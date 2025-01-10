import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, CategoryChannel, GuildChannel, GuildBasedChannel } from 'discord.js';
import { Command } from '../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('sync-permissions')
    .setDescription('Sinkronisasi izin semua channel dalam kategori tertentu berdasarkan channel yang dipilih')
    .addChannelOption(option =>
      option.setName('category')
        .setDescription('Kategori tempat channel-channel akan disinkronisasi')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName('reference_channel')
        .setDescription('Channel yang akan dijadikan patokan (tolok ukur)')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),
  execute: async (interaction) => {
    try {
      if (!interaction.isCommand() || !interaction.guild) return;

      const { guild, options } = interaction;

      // Mendapatkan kategori yang dipilih
      const category = options.getChannel('category', true);
      if (!(category instanceof CategoryChannel)) {
        await interaction.reply({
          content: 'Kategori yang dipilih tidak valid!',
          ephemeral: true,
        });
        return;
      }

      // Mendapatkan channel referensi
      const referenceChannel = options.getChannel('reference_channel', true);
      if (!(referenceChannel instanceof GuildChannel)) {
        await interaction.reply({
          content: 'Channel referensi yang dipilih tidak valid!',
          ephemeral: true,
        });
        return;
      }

      // Pastikan channel referensi berada dalam kategori yang dipilih
      if (referenceChannel.parentId !== category.id) {
        await interaction.reply({
          content: 'Channel referensi tidak berada dalam kategori yang dipilih!',
          ephemeral: true,
        });
        return;
      }

      // Dapatkan semua channel dalam kategori
      const channelsInCategory = category.children.cache.filter(channel =>
        channel.type === ChannelType.GuildText ||
        channel.type === ChannelType.GuildVoice ||
        channel.type === ChannelType.GuildNews
      );

      // Salin izin dari channel referensi ke semua channel dalam kategori
      for (const [_, channel] of channelsInCategory) {
        if (channel.id !== referenceChannel.id) {
          await channel.permissionOverwrites.set(referenceChannel.permissionOverwrites.cache);
        }
      }

      // Kirim respons ke pengguna
      await interaction.reply({
        content: `Izin semua channel dalam kategori **${category.name}** telah disinkronisasi berdasarkan channel **${referenceChannel.name}**.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error executing command:', error);
      if (interaction.isRepliable()) {
        await interaction.reply({
          content: 'Terjadi kesalahan saat menjalankan command ini!',
          ephemeral: true,
        });
      }
    }
  },
};

export default command;