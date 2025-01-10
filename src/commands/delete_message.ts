import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, Message, TextChannel, Collection } from 'discord.js';
import { Command } from '../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete messages with filtering options')
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Number of messages to delete (max 100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Type of messages to delete')
        .setRequired(true)
        .addChoices(
          { name: 'All Messages', value: 'all' },
          { name: 'Bot Messages Only', value: 'bot' },
          { name: 'User Messages Only', value: 'user' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  execute: async (interaction) => {
    // Check if user has permission to manage messages
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({
        content: '❌ You need Manage Messages permission to use this command.',
        ephemeral: true
      });
      return;
    }

    // Check if command is used in a text channel
    if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
      await interaction.reply({
        content: '❌ This command can only be used in text channels.',
        ephemeral: true
      });
      return;
    }

    const amount = interaction.options.getInteger('amount', true);
    const type = interaction.options.getString('type', true);

    // Defer reply since deletion might take some time
    await interaction.deferReply({ ephemeral: true });

    try {
      // Fetch messages
      const messages = await interaction.channel.messages.fetch({ limit: amount });
      
      // Filter messages based on type
      let filteredMessages: Collection<string, Message>;
      switch (type) {
        case 'bot':
          filteredMessages = messages.filter(message => message.author.bot);
          break;
        case 'user':
          filteredMessages = messages.filter(message => !message.author.bot);
          break;
        default:
          filteredMessages = messages;
      }

      // Check if there are any messages to delete
      if (filteredMessages.size === 0) {
        await interaction.editReply({
          content: '❌ No messages found matching the specified criteria.',
        });
        return;
      }

      // Filter out messages older than 14 days (Discord API limitation)
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const deletableMessages = filteredMessages.filter(message => message.createdTimestamp > twoWeeksAgo);

      // Check if there are any deletable messages
      if (deletableMessages.size === 0) {
        await interaction.editReply({
          content: '❌ Cannot delete messages older than 14 days due to Discord limitations.',
        });
        return;
      }

      // Delete messages
      const deleted = await interaction.channel.bulkDelete(deletableMessages, true);

      // Create result embed
      const resultEmbed = new EmbedBuilder()
        .setTitle('🗑️ Message Deletion Results')
        .setColor('#00FF00')
        .addFields(
          { 
            name: 'Messages Deleted', 
            value: deleted.size.toString(),
            inline: true 
          },
          { 
            name: 'Filter Type', 
            value: type === 'all' ? 'All Messages' : type === 'bot' ? 'Bot Messages Only' : 'User Messages Only',
            inline: true 
          },
          {
            name: 'Skipped Messages',
            value: (filteredMessages.size - deleted.size).toString(),
            inline: true
          }
        )
        .setFooter({ text: 'Messages older than 14 days cannot be bulk deleted' })
        .setTimestamp();

      await interaction.editReply({ embeds: [resultEmbed] });

    } catch (error) {
      console.error('Error while deleting messages:', error);
      await interaction.editReply({
        content: '❌ An error occurred while deleting messages. Make sure I have the proper permissions and messages aren\'t too old.',
      });
    }
  },
};

export default command;