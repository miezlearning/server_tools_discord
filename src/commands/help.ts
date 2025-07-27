import { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { Command } from '../types';
import { readdirSync } from 'fs';
import { join } from 'path';

const COMMANDS_PER_PAGE = 5; // Jumlah commands per halaman

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Menampilkan semua commands yang tersedia dengan navigasi'),
  
  execute: async (interaction) => {
    try {
      // Defer reply immediately to prevent timeout
      await interaction.deferReply();

      const commands: { name: string; description: string }[] = [];
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

      if (commands.length === 0) {
        await interaction.editReply('❌ Tidak ada commands yang tersedia.');
        return;
      }

      // Calculate total pages
      const totalPages = Math.ceil(commands.length / COMMANDS_PER_PAGE);
      let currentPage = 0;

      // Function to create embed for specific page
      const createEmbed = (page: number) => {
        const start = page * COMMANDS_PER_PAGE;
        const end = start + COMMANDS_PER_PAGE;
        const pageCommands = commands.slice(start, end);

        const embed = new EmbedBuilder()
          .setTitle('🤖 Available Commands')
          .setColor(0x00AE86)
          .setDescription(
            pageCommands
              .map((cmd, index) => `**${start + index + 1}.** \`/${cmd.name}\` - ${cmd.description}`)
              .join('\n')
          )
          .setFooter({
            text: `Halaman ${page + 1} dari ${totalPages} • Total: ${commands.length} commands`,
            iconURL: interaction.client.user.displayAvatarURL()
          })
          .setTimestamp();

        return embed;
      };

      // Function to create buttons
      const createButtons = (page: number) => {
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('help_first')
              .setLabel('⏪ Pertama')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page === 0),
            new ButtonBuilder()
              .setCustomId('help_prev')
              .setLabel('◀️ Sebelumnya')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === 0),
            new ButtonBuilder()
              .setCustomId('help_next')
              .setLabel('▶️ Selanjutnya')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === totalPages - 1),
            new ButtonBuilder()
              .setCustomId('help_last')
              .setLabel('⏩ Terakhir')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page === totalPages - 1)
          );

        return row;
      };

      // Send initial message
      const embed = createEmbed(currentPage);
      const buttons = createButtons(currentPage);
      
      const message = await interaction.editReply({
        embeds: [embed],
        components: totalPages > 1 ? [buttons] : []
      });

      // If only one page, no need for collector
      if (totalPages <= 1) return;

      // Create button collector
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000 // 5 minutes
      });

      collector.on('collect', async (buttonInteraction) => {
        // Check if the user who clicked is the one who used the command
        if (buttonInteraction.user.id !== interaction.user.id) {
          await buttonInteraction.reply({
            content: '❌ Hanya yang menggunakan command ini yang bisa mengontrol menu!',
            ephemeral: true
          });
          return;
        }

        // Handle button clicks
        switch (buttonInteraction.customId) {
          case 'help_first':
            currentPage = 0;
            break;
          case 'help_prev':
            currentPage = Math.max(0, currentPage - 1);
            break;
          case 'help_next':
            currentPage = Math.min(totalPages - 1, currentPage + 1);
            break;
          case 'help_last':
            currentPage = totalPages - 1;
            break;
        }

        // Update the message
        const newEmbed = createEmbed(currentPage);
        const newButtons = createButtons(currentPage);

        await buttonInteraction.update({
          embeds: [newEmbed],
          components: [newButtons]
        });
      });

      collector.on('end', async () => {
        // Disable all buttons when collector ends
        const disabledRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('help_first')
              .setLabel('⏪ Pertama')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('help_prev')
              .setLabel('◀️ Sebelumnya')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('help_next')
              .setLabel('▶️ Selanjutnya')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('help_last')
              .setLabel('⏩ Terakhir')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );

        try {
          await interaction.editReply({
            components: [disabledRow]
          });
        } catch (error) {
          // Message might be deleted, ignore error
        }
      });

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