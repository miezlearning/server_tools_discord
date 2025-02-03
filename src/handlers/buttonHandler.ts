// Tidak banyak berubah, hanya import `Command` yang benar dari `types.ts`
import { Client, Interaction } from 'discord.js';
import { Command, Handlers } from '../types';

export const loadButtonHandler: Handlers['loadButtonHandler'] = async (client) => {
  client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isButton()) return;

    const buttonId = interaction.customId;

    const command = client.commands.find(
      (cmd: Command) => cmd.handleButton && buttonId.startsWith(cmd.data.name)
    );

    if (command && command.handleButton) {
      try {
        await command.handleButton(interaction);
      } catch (error) {
        console.error(`Error handling button ${buttonId}:`, error);
        await interaction.reply({
          content: 'Terjadi kesalahan saat memproses tombol.',
          ephemeral: true,
        });
      }
    }
  });

  client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isModalSubmit()) return;
    const modalId = interaction.customId;

    const command = client.commands.find(
      (cmd: Command) => cmd.handleModal && modalId.startsWith(cmd.data.name)
    );

    if (command && command.handleModal) {
      try {
        await command.handleModal(interaction);
      } catch (error) {
        console.error(`Error handling modal ${modalId}:`, error);
        await interaction.reply({
          content: 'Terjadi kesalahan saat memproses modal.',
          ephemeral: true,
        });
      }
    }
  });

  console.log('Button and Modal handler loaded.');
};