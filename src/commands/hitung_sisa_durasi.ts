import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { Command } from '../types';
import moment from 'moment';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('hitungdurasi')
    .setDescription('Menghitung sisa durasi langganan dengan penambahan masa perbaikan')
    .addStringOption((option) =>
      option
        .setName('tanggal_pembelian')
        .setDescription('Tanggal pembelian (format: DD-MM-YYYY)')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('total_durasi')
        .setDescription('Total durasi langganan (contoh: 30d, 1m, 1y)')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('pemakaian')
        .setDescription('Pemakaian sebelum perbaikan (contoh: 10d, 2w)')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('masa_perbaikan')
        .setDescription('Masa perbaikan (contoh: 5d, 1w)')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  execute: async (interaction) => {
    try {
      const tanggalPembelianInput = interaction.options.getString('tanggal_pembelian', true);
      const totalDurasiInput = interaction.options.getString('total_durasi', true);
      const pemakaianInput = interaction.options.getString('pemakaian', true);
      const masaPerbaikanInput = interaction.options.getString('masa_perbaikan', true);

      // Validasi input tanggal pembelian
      const tanggalPembelianRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
      if (!tanggalPembelianRegex.test(tanggalPembelianInput)) {
        await interaction.reply({
          content: '❌ Format tanggal pembelian tidak valid. Gunakan format: DD-MM-YYYY',
          ephemeral: true,
        });
        return;
      }

      // Validasi input durasi
      const durationRegex = /^(\d+)([dwmy])$/;
      if (!durationRegex.test(totalDurasiInput) || !durationRegex.test(pemakaianInput) || !durationRegex.test(masaPerbaikanInput)) {
        await interaction.reply({
          content: '❌ Format input durasi tidak valid. Gunakan format: angka + d (hari) / w (minggu) / m (bulan) / y (tahun). Contoh: 30d, 1m, 2w',
          ephemeral: true,
        });
        return;
      }

      // Parse tanggal pembelian
      const tanggalPembelian = moment(tanggalPembelianInput, 'DD-MM-YYYY');
      if (!tanggalPembelian.isValid()) {
        await interaction.reply({
          content: '❌ Tanggal pembelian tidak valid.',
          ephemeral: true,
        });
        return;
      }

      // Fungsi untuk mengubah string durasi menjadi objek moment.duration
      const parseDuration = (durationString: string) => {
        const match = durationString.match(durationRegex);
        if (!match) return moment.duration(); // Return empty duration

        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
          case 'd':
            return moment.duration(value, 'days');
          case 'w':
            return moment.duration(value, 'weeks');
          case 'm':
            return moment.duration(value, 'months');
          case 'y':
            return moment.duration(value, 'years');
          default:
            return moment.duration();
        }
      };

      // Konversi input durasi ke objek moment.duration
      const totalDurasi = parseDuration(totalDurasiInput);
      const pemakaian = parseDuration(pemakaianInput);
      const masaPerbaikan = parseDuration(masaPerbaikanInput);

      // Hitung tanggal pemakaian
      const tanggalSetelahPemakaian = moment(tanggalPembelian).add(pemakaian);

      // Hitung tanggal sisa durasi
      const tanggalSisaDurasi = moment(tanggalSetelahPemakaian).add(totalDurasi).subtract(pemakaian).add(masaPerbaikan);
      
      // Hitung sisa durasi dalam format yang mudah dibaca
      const sisaDurasi = moment.duration(tanggalSisaDurasi.diff(moment()));

      // Format durasi untuk output
      const formatDuration = (duration: moment.Duration) => {
        const days = duration.days();
        const weeks = duration.weeks();
        const months = duration.months();
        const years = duration.years();
      
        if (years > 0) return `${years} tahun ${months} bulan ${days} hari`;
        if (months > 0) return `${months} bulan ${days} hari`;
        if (weeks > 0) return `${weeks} minggu ${days} hari`;
        return `${days} hari`;
      };

      // Buat embed
      const embed = new EmbedBuilder()
        .setTitle('🧮 Kalkulator Durasi Langganan')
        .setColor('#00FFFF')
        .addFields(
          { name: 'Tanggal Pembelian', value: `${tanggalPembelian.format('DD-MM-YYYY')}`, inline: true },
          { name: 'Total Durasi Langganan', value: `${formatDuration(totalDurasi)}`, inline: true },
          { name: 'Pemakaian Sebelum Perbaikan', value: `${formatDuration(pemakaian)}`, inline: true },
          { name: 'Masa Perbaikan', value: `${formatDuration(masaPerbaikan)}`, inline: true },
          { name: '✅ Sisa Durasi', value: `${formatDuration(sisaDurasi)}` },
          { name: 'Tanggal Sisa Durasi', value: `${tanggalSisaDurasi.format('DD-MM-YYYY')}` }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in hitungdurasi command:', error);
      await interaction.reply({
        content: '❌ Terjadi kesalahan saat menghitung durasi. Pastikan input sudah benar.',
        ephemeral: true,
      });
    }
  },
};

export default command;