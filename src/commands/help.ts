import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all available commands'),
  execute: async (interaction) => {
    const commands = Array.from(interaction.client.commands.values());
    
    const embed = new EmbedBuilder()
      .setTitle('Available Commands')
      .setColor('#0099ff')
      .setDescription(
        commands
          .map(cmd => `**/${cmd.data.name}** - ${cmd.data.description}`)
          .join('\n')
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;