import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, GuildChannel } from 'discord.js';
import { Command } from '../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('sortchannels')
    .setDescription('Sort channels in the specified category by name and rearrange their positions')
    .addStringOption(option =>
      option
        .setName('category')
        .setDescription('Category ID of the channels to sort')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('order')
        .setDescription('Sorting order (ascending or descending)')
        .setRequired(true)
        .addChoices(
          { name: 'Ascending', value: 'asc' },
          { name: 'Descending', value: 'desc' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  execute: async (interaction) => {
    const { guild } = interaction;
    if (!guild) return;

    // Check permissions
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.reply({
        content: '❌ You need Manage Channels permission to use this command.',
        ephemeral: true
      });
      return;
    }

    try {
      // Get the category ID and sorting order
      const categoryId = interaction.options.getString('category', true);
      const order = interaction.options.getString('order', true);

      // Fetch the category channel
      const category = await guild.channels.fetch(categoryId);
      if (!category || category.type !== ChannelType.GuildCategory) {
        await interaction.reply({
          content: '❌ Category not found or invalid. Please provide a valid category ID.',
          ephemeral: true
        });
        return;
      }

      // Defer reply as this might take time
      await interaction.deferReply({ ephemeral: true });

      // Fetch all channels in the category
      const channels = guild.channels.cache.filter(channel => channel.parentId === categoryId);

      if (channels.size === 0) {
        await interaction.editReply({
          content: '❌ No channels found in the specified category.',
        });
        return;
      }

      // Convert channels to an array and sort them
      const sortedChannels = Array.from(channels.values()).sort((a, b) => 
        order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      );

      // Rearrange channels based on sorted order
      for (let i = 0; i < sortedChannels.length; i++) {
        try {
          await (sortedChannels[i] as GuildChannel).setPosition(i, { reason: `Sorted by ${interaction.user.tag}` });
          // Add delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error moving channel ${sortedChannels[i].name}:`, error);
        }
      }

      // Create result embed
      const resultEmbed = new EmbedBuilder()
        .setTitle('🔢 Channel Sorting Results')
        .setColor('#00FF00')
        .setDescription(`Channels have been sorted in ${order === 'asc' ? 'ascending' : 'descending'} order.`)
        .setTimestamp();

      await interaction.editReply({ embeds: [resultEmbed] });

    } catch (error) {
      console.error('Error in sortchannels command:', error);
      await interaction.editReply({
        content: '❌ An error occurred while sorting channels. Please check permissions and try again.',
      });
    }
  },
};

export default command;