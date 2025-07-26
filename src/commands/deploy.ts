import { SlashCommandBuilder, PermissionFlagsBits, REST, Routes } from 'discord.js';
import { Command } from '../types';
import { readdirSync } from 'fs';
import { join } from 'path';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('deploy')
    .setDescription('Deploy/reload semua slash commands bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  execute: async (interaction) => {
    try {
      await interaction.deferReply({ ephemeral: true });

      const commands = [];
      const commandsPath = join(__dirname);
      const commandFiles = readdirSync(commandsPath).filter(file => 
        file.endsWith('.ts') || file.endsWith('.js')
      );

      let loadedCount = 0;
      let skippedCount = 0;

      for (const file of commandFiles) {
        // Skip file deploy.ts sendiri untuk menghindari circular reference
        if (file === 'deploy.ts' || file === 'deploy.js') {
          continue;
        }

        const filePath = join(commandsPath, file);
        
        try {
          // Clear module cache untuk memastikan file terbaru dimuat
          delete require.cache[require.resolve(filePath)];
          
          const commandModule = await import(filePath);
          
          // Handle both default and named exports
          const cmd = commandModule.default || commandModule;
          
          if ('data' in cmd && 'execute' in cmd) {
            commands.push(cmd.data.toJSON());
            loadedCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          console.error(`Error loading command ${file}:`, error);
          skippedCount++;
        }
      }

      if (!process.env.DISCORD_TOKEN) {
        await interaction.editReply('❌ DISCORD_TOKEN tidak ditemukan dalam environment variables!');
        return;
      }

      if (!process.env.CLIENT_ID) {
        await interaction.editReply('❌ CLIENT_ID tidak ditemukan dalam environment variables!');
        return;
      }

      const rest = new REST().setToken(process.env.DISCORD_TOKEN);

      await interaction.editReply('🔄 Sedang deploy commands...');

      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );

      const successMessage = `✅ **Deploy Commands Berhasil!**\n` +
        `📝 **${loadedCount}** commands berhasil di-deploy\n` +
        `⚠️ **${skippedCount}** commands di-skip\n` +
        `⏰ Commands akan aktif dalam beberapa detik\n\n` +
        '💡 *Tip: Ketik `/` untuk melihat commands terbaru*';

      await interaction.editReply(successMessage);

    } catch (error) {
      console.error('Error in deploy command:', error);
      
      let errorMessage = '❌ **Gagal deploy commands!**\n\n';
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage += '🔑 **Token bot tidak valid**\nPeriksa DISCORD_TOKEN di environment variables';
        } else if (error.message.includes('403')) {
          errorMessage += '🚫 **Bot tidak memiliki permission**\nPastikan bot memiliki permission yang diperlukan';
        } else if (error.message.includes('404')) {
          errorMessage += '🔍 **Client ID tidak valid**\nPeriksa CLIENT_ID di environment variables';
        } else {
          errorMessage += `📝 **Error details:**\n\`\`\`${error.message}\`\`\``;
        }
      } else {
        errorMessage += '❓ **Unknown error occurred**';
      }
      
      if (interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply({ 
          content: errorMessage, 
          ephemeral: true 
        });
      }
    }
  },
};

export default command;
