import { SlashCommandBuilder, PermissionFlagsBits, CategoryChannel, TextChannel, EmbedBuilder } from 'discord.js';
import { Command } from '../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('send_message')
    .setDescription('Mengirim pesan ke channel dalam kategori yang dipilih')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('ID atau nama kategori tujuan')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('channel')
        .setDescription('ID atau nama channel tujuan dalam kategori')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Pesan yang akan dikirim')
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option.setName('attachment')
        .setDescription('File attachment (opsional)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option.setName('embed')
        .setDescription('Kirim sebagai embed (default: false)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  execute: async (interaction) => {
    try {
      await interaction.deferReply({ ephemeral: true });

      const categoryInput = interaction.options.getString('category', true);
      const channelInput = interaction.options.getString('channel', true);
      const messageContent = interaction.options.getString('message', true);
      const attachment = interaction.options.getAttachment('attachment');
      const useEmbed = interaction.options.getBoolean('embed') ?? false;

      const guild = interaction.guild;
      if (!guild) {
        await interaction.editReply('❌ Command ini hanya bisa digunakan di server!');
        return;
      }

      // Cari kategori berdasarkan ID atau nama
      let targetCategory: CategoryChannel | null = null;
      
      // Coba cari berdasarkan ID terlebih dahulu
      if (/^\d+$/.test(categoryInput)) {
        const categoryById = guild.channels.cache.get(categoryInput);
        if (categoryById && categoryById.isThread() === false && categoryById.type === 4) { // CategoryChannel type = 4
          targetCategory = categoryById as CategoryChannel;
        }
      }

      // Jika tidak ditemukan berdasarkan ID, cari berdasarkan nama
      if (!targetCategory) {
        const categoryByName = guild.channels.cache.find(channel => 
          channel.name.toLowerCase() === categoryInput.toLowerCase() && 
          channel.isThread() === false && 
          channel.type === 4
        ) as CategoryChannel;
        targetCategory = categoryByName;
      }

      if (!targetCategory) {
        await interaction.editReply(`❌ Kategori "${categoryInput}" tidak ditemukan!`);
        return;
      }

      // Cari channel dalam kategori berdasarkan ID atau nama
      let targetChannel: TextChannel | null = null;

      // Coba cari berdasarkan ID terlebih dahulu
      if (/^\d+$/.test(channelInput)) {
        const channelById = guild.channels.cache.get(channelInput);
        if (channelById && 
            channelById.isThread() === false && 
            channelById.type === 0 && // TextChannel type = 0
            channelById.parentId === targetCategory.id) {
          targetChannel = channelById as TextChannel;
        }
      }

      // Jika tidak ditemukan berdasarkan ID, cari berdasarkan nama dalam kategori
      if (!targetChannel) {
        const channelByName = guild.channels.cache.find(channel => 
          channel.name.toLowerCase() === channelInput.toLowerCase() && 
          channel.isThread() === false && 
          channel.type === 0 &&
          channel.parentId === targetCategory.id
        ) as TextChannel;
        targetChannel = channelByName;
      }

      if (!targetChannel) {
        await interaction.editReply(`❌ Channel "${channelInput}" tidak ditemukan dalam kategori "${targetCategory.name}"!`);
        return;
      }

      // Persiapkan pesan
      const messageOptions: any = {
        files: attachment ? [attachment] : []
      };

      if (useEmbed) {
        const embed = new EmbedBuilder()
          .setDescription(messageContent)
          .setColor(0x00AE86)
          .setTimestamp()
          .setFooter({
            text: `Dikirim oleh ${interaction.user.displayName}`,
            iconURL: interaction.user.displayAvatarURL()
          });

        messageOptions.embeds = [embed];
      } else {
        messageOptions.content = messageContent;
      }

      // Kirim pesan ke channel target
      await targetChannel.send(messageOptions);

      // Konfirmasi berhasil
      const successMessage = `✅ Pesan berhasil dikirim ke ${targetChannel} dalam kategori **${targetCategory.name}**!`;
      
      if (attachment) {
        await interaction.editReply(`${successMessage}\n📎 Dengan attachment: ${attachment.name}`);
      } else {
        await interaction.editReply(successMessage);
      }

    } catch (error) {
      console.error('Error in send_message command:', error);
      
      if (interaction.deferred) {
        await interaction.editReply('❌ Terjadi error saat mengirim pesan. Silakan coba lagi!');
      } else {
        await interaction.reply({ 
          content: '❌ Terjadi error saat mengirim pesan. Silakan coba lagi!', 
          ephemeral: true 
        });
      }
    }
  },
};

export default command;
