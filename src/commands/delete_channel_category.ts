import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { Command } from '../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('deletech_category')
    .setDescription('Delete all channels in the specified category')
    .addStringOption(option =>
      option
        .setName('category')
        .setDescription('Category ID of the channels to delete')
        .setRequired(true)
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
      // Get the category ID
      const categoryId = interaction.options.getString('category', true);

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

      const results = {
        success: [] as string[],
        failed: [] as string[]
      };

      // Delete each channel
      for (const [channelId, channel] of channels) {
        try {
          await channel.delete(`Deleted by ${interaction.user.tag}`);
          results.success.push(channel.name);

          // Add delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          results.failed.push(channel.name);
          console.error(`Error deleting channel ${channel.name}:`, error);
        }
      }

      // Create result embed
      const resultEmbed = new EmbedBuilder()
        .setTitle('🗑️ Channel Deletion Results')
        .setColor(results.failed.length === 0 ? '#00FF00' : '#FF9900')
        .addFields(
          {
            name: '✅ Successfully Deleted',
            value: results.success.length > 0 ? results.success.join('\n') : 'None',
            inline: false
          },
          {
            name: '❌ Failed to Delete',
            value: results.failed.length > 0 ? results.failed.join('\n') : 'None',
            inline: false
          }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [resultEmbed] });

    } catch (error) {
      console.error('Error in deletechannels command:', error);
      await interaction.editReply({
        content: '❌ An error occurred while deleting channels. Please check permissions and try again.',
      });
    }
  },
};

export default command;
