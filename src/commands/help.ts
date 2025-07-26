import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../types';
import { readdirSync } from 'fs';
import { join } from 'path';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Menampilkan semua commands yang tersedia'),
  execute: async (interaction) => {
    try {
      const commands = [];
      const commandsPath = join(__dirname);
      const commandFiles = readdirSync(commandsPath).filter(file => 
        file.endsWith('.ts') || file.endsWith('.js')
      );

      for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        
        try {
          const commandModule = await import(filePath);
          const cmd = commandModule.default || commandModule;
          
          if ('data' in cmd && 'execute' in cmd) {
            commands.push({
              name: cmd.data.name,
              description: cmd.data.description
            });
          }
        } catch (error) {
          // Skip files that can't be loaded
          continue;
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('🤖 Available Commands')
        .setColor(0x00AE86)
        .setDescription(
          commands.length > 0 
            ? commands
                .map(cmd => `**/${cmd.name}** - ${cmd.description}`)
                .join('\n')
            : 'Tidak ada commands yang tersedia.'
        )
        .setFooter({
          text: `Total: ${commands.length} commands`,
          iconURL: interaction.client.user.displayAvatarURL()
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in help command:', error);
      await interaction.reply({ 
        content: '❌ Terjadi error saat memuat commands!', 
        ephemeral: true 
      });
    }
  },
};

export default command;