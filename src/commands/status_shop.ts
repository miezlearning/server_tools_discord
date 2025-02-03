import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CommandInteraction,
    ButtonInteraction,
    PermissionFlagsBits,
    Message,
    TextChannel,
    GuildMemberRoleManager,
    ChannelType,
  } from 'discord.js';
  import { Command } from '../types';
  import fs from 'fs';
  
  // File untuk menyimpan data managed messages
  const managedMessagesFile = './managedMessages.json';
  
  interface ManagedMessageData {
    messageId: string | null;
    channelId: string;
    content: string;
    embeds: any[];
    components: any[];
  }
  
  // Load managed messages from file
  function loadManagedMessages(): ManagedMessageData[] {
    try {
      if (!fs.existsSync(managedMessagesFile)) {
        fs.writeFileSync(managedMessagesFile, '[]');
      }
      const data = fs.readFileSync(managedMessagesFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading managed messages from file:', error);
      return [];
    }
  }
  
  // Save managed messages to file
  function saveManagedMessages(messages: ManagedMessageData[]) {
    try {
      fs.writeFileSync(managedMessagesFile, JSON.stringify(messages, null, 2));
    } catch (error) {
      console.error('Error saving managed messages to file:', error);
    }
  }
  
  const command: Command = {
    data: new SlashCommandBuilder()
      .setName('shopstatus')
      .setDescription('Mengatur dan mengirim pesan status toko')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
    execute: async (interaction: CommandInteraction) => {
      if (!interaction.guild) {
        await interaction.reply({ content: '❌ Command ini hanya bisa digunakan di server.', ephemeral: true });
        return;
      }
  
      if (interaction.user.id !== '1203659210747944983') {
        await interaction.reply({
          content: `❌ Kamu tidak memiliki izin untuk menggunakan command ini.`,
          ephemeral: true,
        });
        return;
      }
  
      let managedMessages: ManagedMessageData[] = loadManagedMessages();
      let managedMessage = managedMessages.find(m => m.channelId === '1335576254505816074');
  
      const channel = interaction.guild.channels.cache.get('1335576254505816074') as TextChannel;
      if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.reply({
          content: `❌ Channel yang dikonfigurasi tidak ditemukan atau bukan Text Channel.`,
          ephemeral: true,
        });
        return;
      }
  
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('shopstatus_open')
          .setLabel('Open Shop')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('shopstatus_close')
          .setLabel('Close Shop')
          .setStyle(ButtonStyle.Danger)
      );
  
      try {
        if (managedMessage && managedMessage.messageId) {
          try {
            const existingMessage = await channel.messages.fetch(managedMessage.messageId);
            if (existingMessage) {
              await existingMessage.edit({ components: [row] });
              await interaction.reply({ content: 'Pesan status toko berhasil diupdate.', ephemeral: true });
              return;
            }
          } catch (error) {
            // Message not found, continue to create new message
            console.log('managed message not found, creating new message');
          }
        }
  
        const defaultEmbed = new EmbedBuilder()
          .setColor('#2B2D31')
          .setTitle('Status Toko')
          .setDescription('Status toko akan ditampilkan di sini.')
          .setImage(
            'https://media.discordapp.net/attachments/1335194503249788983/1335591893542637579/Status_THINKER_HUB.png?ex=67a0ba61&is=679f68e1&hm=fdfd599d8f65d8f793ae0bf2a6d7184fd9c95628b5c549abb6f2fba34295a41d&=&format=webp&quality=lossless&width=687&height=343'
          );
  
        const message = await channel.send({
          content: '',
          embeds: [defaultEmbed.toJSON()],
          components: [row],
        });
  
        if (!managedMessage) {
          managedMessage = {
            channelId: channel.id,
            messageId: message.id,
            content: '',
            embeds: [defaultEmbed.toJSON()],
            components: [row.toJSON()],
          };
          managedMessages.push(managedMessage);
        } else {
          managedMessage.messageId = message.id;
          managedMessage.content = '';
          managedMessage.embeds = [defaultEmbed.toJSON()];
          managedMessage.components = [row.toJSON()];
        }
        saveManagedMessages(managedMessages);
  
        await interaction.reply({ content: 'Pesan status toko berhasil dikirim.', ephemeral: true });
      } catch (error) {
        console.error('Error sending or editing message:', error);
        await interaction.reply({
          content: 'Terjadi kesalahan saat mengirim atau mengedit pesan status toko.',
          ephemeral: true,
        });
      }
    },
  
    handleButton: async function(interaction: ButtonInteraction) {
      const managedMessages: ManagedMessageData[] = loadManagedMessages();
      const managedMessage = managedMessages.find(m => m.channelId === interaction.channelId);
  
      if (!managedMessage || !managedMessage.messageId) {
        await interaction.reply({
          content: '❌ Konfigurasi pesan untuk command ini belum diatur atau pesan tidak ditemukan.',
          ephemeral: true,
        });
        return;
      }
  
      const buttonId = interaction.customId;
      const allowedRoleId = '1327712139133325394';
  
      if (!(interaction.member?.roles instanceof GuildMemberRoleManager) || !interaction.member.roles.cache.has(allowedRoleId)) {
        await interaction.reply({
          content: '❌ Kamu tidak memiliki izin untuk menggunakan tombol ini.',
          ephemeral: true,
        });
        return;
      }
  
      let newEmbed: EmbedBuilder;
      let newContent: string;
  
      if (buttonId === 'shopstatus_open') {
        newContent = `
# Thinker Hub Status <:thinkerhub:1335489434673614878> is Online <a:thinker_online:1335603860370227200>
  
Halo, store udah buka nih langsung belanjan aja cek katalog kami! 
  
-# <:thinker_warning:1333560077868732568>  **Note**: Tanyakan stok produk di chat atau melalui tiket.
  `;
        
        newEmbed = new EmbedBuilder()
          .setColor('#2B2D31')
          .setDescription(newContent)
          .setImage(
            'https://media.discordapp.net/attachments/1335194503249788983/1335591893542637579/Status_THINKER_HUB.png?ex=67a0ba61&is=679f68e1&hm=fdfd599d8f65d8f793ae0bf2a6d7184fd9c95628b5c549abb6f2fba34295a41d&=&format=webp&quality=lossless&width=687&height=343'
          );
      } else if (buttonId === 'shopstatus_close') {
        newContent = `
# Thinker Hub Status <:thinkerhub:1335489434673614878> is Offline <a:thinker_offline:1335603866737053778>
  
Halo, store tutup dulu yaa saat ini fleksibel, jika ingin membuat tiket silakan tapi kami akan membalas nanti.
  
-# <:thinker_warning:1333560077868732568>  **Note**: Tanyakan stok produk di chat atau melalui tiket.
  `;
        
        newEmbed = new EmbedBuilder()
          .setColor('#2B2D31')
          .setDescription(newContent)
          .setImage(
            'https://media.discordapp.net/attachments/1335194503249788983/1335591893542637579/Status_THINKER_HUB.png?ex=67a0ba61&is=679f68e1&hm=fdfd599d8f65d8f793ae0bf2a6d7184fd9c95628b5c549abb6f2fba34295a41d&=&format=webp&quality=lossless&width=687&height=343'
          );
      } else {
        await interaction.reply({ content: 'Tombol tidak valid.', ephemeral: true });
        return;
      }
  
      const channel = interaction.channel as TextChannel;
      if (!channel) {
        await interaction.reply({
          content: '❌ Gagal mendapatkan channel.',
          ephemeral: true,
        });
        return;
      }
  
      try {
        const message = await channel.messages.fetch(managedMessage.messageId);
        await message.edit({ embeds: [newEmbed] });
        await interaction.reply({ content: 'Status toko berhasil diupdate.', ephemeral: true });
  
        const everyoneMessage = await channel.send('@everyone Status toko telah diperbarui!');
        setTimeout(() => {
          everyoneMessage.delete().catch(console.error);
        }, 5000);
      } catch (error) {
        console.error('Error updating message:', error);
        await interaction.reply({
          content: 'Terjadi kesalahan saat mengupdate status toko.',
          ephemeral: true,
        });
      }
    },
  };
  
  export default command;