import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Command } from '../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('create-invite')
    .setDescription('Create an invite link for the bot with permissions set to 0')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),
  execute: async (interaction) => {
    try {
      if (!interaction.isCommand() || !interaction.guild) return;

      const { client } = interaction;

      // Fixed permission value of 0
      const permissions = 0;

      // Generate the invite URL
      const clientId = client.user.id;
      const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;

      // Send the invite link to the user
      await interaction.reply({
        content: `Here is the invite link for the bot:\n${inviteUrl}`,
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