// commands/chatToggle.ts
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Manage the chat functionality in this channel')
    .addSubcommand(sub =>
      sub
        .setName('toggle')
        .setDescription('Toggle the chat functionality in this channel')),
  async execute(interaction: any) {
    const client = interaction.client;
    if (interaction.options.getSubcommand() === 'toggle') {
      const channelId = interaction.channelId;
      if (!client.enabledChannels.has(channelId)) {
        client.enabledChannels.set(channelId, true);
        await interaction.reply('Chat functionality enabled in this channel.');
      } else {
        client.enabledChannels.delete(channelId);
        await interaction.reply('Chat functionality disabled in this channel.');
      }
    }
  },
};