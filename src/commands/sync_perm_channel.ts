import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, CategoryChannel, GuildChannel, GuildBasedChannel } from 'discord.js';
import { Command } from '../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('sync-permissions')
    .setDescription('Synchronize permissions for all channels in a selected category based on a reference channel')
    .addChannelOption(option =>
      option.setName('category')
        .setDescription('The category whose channels will be synchronized')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName('reference_channel')
        .setDescription('The channel whose permissions will be used as a reference')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildNews)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),
  execute: async (interaction) => {
    try {
      if (!interaction.isCommand() || !interaction.guild) return;

      const { guild, options } = interaction;

      // Get the selected category
      const category = options.getChannel('category', true);
      if (!(category instanceof CategoryChannel)) {
        await interaction.reply({
          content: 'Invalid category selected!',
          ephemeral: true,
        });
        return;
      }

      // Get the reference channel
      const referenceChannel = options.getChannel('reference_channel', true);
      if (!(referenceChannel instanceof GuildChannel)) {
        await interaction.reply({
          content: 'Invalid reference channel selected!',
          ephemeral: true,
        });
        return;
      }

      // Fetch all channels in the selected category
      const channelsInCategory = category.children.cache.filter(channel =>
        channel.type === ChannelType.GuildText ||
        channel.type === ChannelType.GuildVoice ||
        channel.type === ChannelType.GuildNews
      );

      // Synchronize permissions
      for (const [_, channel] of channelsInCategory) {
        await channel.permissionOverwrites.set(referenceChannel.permissionOverwrites.cache);
      }

      // Send confirmation message
      await interaction.reply({
        content: `Permissions for all channels in category **${category.name}** have been synchronized based on **${referenceChannel.name}**.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error executing command:', error);
      if (interaction.isRepliable()) {
        await interaction.reply({
          content: 'An error occurred while executing this command!',
          ephemeral: true,
        });
      }
    }
  },
};

export default command;