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
      // Defer reply immediately to prevent timeout
      await interaction.deferReply();

      const commands = [];
      const commandsPath = join(__dirname);
      
      let commandFiles;
      try {
        commandFiles = readdirSync(commandsPath).filter(file => 
          file.endsWith('.ts') || file.endsWith('.js')
        );
      } catch (error) {
        console.error('Error reading commands directory:', error);
        await interaction.editReply('❌ Tidak dapat membaca direktori commands!');
        return;
      }

      for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        
        try {
          // Clear module cache to ensure fresh load
          delete require.cache[require.resolve(filePath)];
          
          const commandModule = await import(filePath);
          const cmd = commandModule.default || commandModule;
          
          if ('data' in cmd && 'execute' in cmd && cmd.data.name && cmd.data.description) {
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

      // Sort commands alphabetically
      commands.sort((a, b) => a.name.localeCompare(b.name));

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

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in help command:', error);
      
      // Check if we can still respond
      if (interaction.deferred) {
        try {
          await interaction.editReply('❌ Terjadi error saat memuat commands!');
        } catch (editError) {
          console.error('Failed to edit reply:', editError);
        }
      } else if (!interaction.replied) {
        try {
          await interaction.reply({ 
            content: '❌ Terjadi error saat memuat commands!', 
            flags: [4096] // MessageFlags.Ephemeral
          });
        } catch (replyError) {
          console.error('Failed to reply:', replyError);
        }
      }
    }
  },
};

export default command;