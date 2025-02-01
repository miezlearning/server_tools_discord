import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, TextChannel } from 'discord.js';
import { Command } from '../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('new_label_channnel_delete')
    .setDescription('Menghilangkan tulisan NEW pada channel baru')
    .addStringOption(option =>
      option
        .setName('category')
        .setDescription('Category ID of the channels to send the message to')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('The message to send to all channels')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  execute: async (interaction) => {
    const { guild, options } = interaction;
    if (!guild) return;

    // Check permissions
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({
        content: '❌ You need Manage Messages permission to use this command.',
        ephemeral: true
      });
      return;
    }

    try {
      // Get the category ID and message from options
      const categoryId = options.getString('category', true);
      const messageContent = options.getString('message', true);

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

      // Fetch all text channels in the category
      const channels = guild.channels.cache.filter(channel => 
        channel.parentId === categoryId && channel.type === ChannelType.GuildText
      );

      if (channels.size === 0) {
        await interaction.editReply({
          content: '❌ No text channels found in the specified category.',
        });
        return;
      }

      // Send the message to each channel and schedule deletion
      for (const [channelId, channel] of channels) {
        try {
          if (channel.type === ChannelType.GuildText) {
            const textChannel = channel as TextChannel;
            const sentMessage = await textChannel.send(messageContent);
            setTimeout(async () => {
              await sentMessage.delete().catch(console.error);
            }, 5000); // Delete after 5 seconds
          }
        } catch (error) {
          console.error(`Error sending message to channel ${channel.name}:`, error);
        }
      }

      await interaction.editReply({
        content: `✅ Message has been sent to all text channels in the category and will be deleted in 5 seconds.`,
      });

    } catch (error) {
      console.error('Error in sendmessage command:', error);
      await interaction.editReply({
        content: '❌ An error occurred while sending the message. Please check permissions and try again.',
      });
    }
  },
};

export default command;