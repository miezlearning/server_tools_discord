import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, TextChannel, CategoryChannel } from 'discord.js';
import { Command } from '../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('new_label_channnel_delete')
    .setDescription('Menghilangkan tulisan NEW pada channel baru dengan mengirim pesan ke semua channel dalam kategori')
    .addStringOption(option =>
      option
        .setName('category')
        .setDescription('ID atau nama kategori untuk mengirim pesan ke semua channel')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  execute: async (interaction) => {
    const { guild, options } = interaction;
    if (!guild) return;

    // Check permissions
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({
        content: '❌ You need Manage Messages permission to use this command.',
        ephemeral: true
      });
      return;
    }

    try {
      // Get the category ID from options
      const categoryInput = options.getString('category', true);
      const messageContent = "."; // Default message

      // Cari kategori berdasarkan ID atau nama
      let targetCategory: CategoryChannel | null = null;
      
      // Coba cari berdasarkan ID terlebih dahulu
      if (/^\d+$/.test(categoryInput)) {
        const categoryById = guild.channels.cache.get(categoryInput);
        if (categoryById && categoryById.type === ChannelType.GuildCategory) {
          targetCategory = categoryById as CategoryChannel;
        }
      }

      // Jika tidak ditemukan berdasarkan ID, cari berdasarkan nama
      if (!targetCategory) {
        const categoryByName = guild.channels.cache.find(channel => 
          channel.name.toLowerCase() === categoryInput.toLowerCase() && 
          channel.type === ChannelType.GuildCategory
        ) as CategoryChannel;
        targetCategory = categoryByName;
      }

      if (!targetCategory) {
        await interaction.reply({
          content: `❌ Kategori "${categoryInput}" tidak ditemukan!`,
          ephemeral: true
        });
        return;
      }

      // Defer reply as this might take time
      await interaction.deferReply({ ephemeral: true });

      // Fetch all channels in the category (text, voice, announcement, stage, forum, etc.)
      const allChannels = guild.channels.cache.filter(channel => 
        channel.parentId === targetCategory.id
      );

      if (allChannels.size === 0) {
        await interaction.editReply({
          content: `❌ Tidak ada channel yang ditemukan dalam kategori "${targetCategory.name}".`,
        });
        return;
      }

      let sentCount = 0;
      let textChannelCount = 0;
      let otherChannelCount = 0;

      // Send message to each channel
      for (const [channelId, channel] of allChannels) {
        try {
          // Hanya kirim pesan ke text channel, announcement channel, dan forum channel
          if (channel.type === ChannelType.GuildText || 
              channel.type === ChannelType.GuildAnnouncement ||
              channel.type === ChannelType.GuildForum) {
            
            const textChannel = channel as TextChannel;
            const sentMessage = await textChannel.send(messageContent);
            
            // Schedule deletion after 5 seconds
            setTimeout(async () => {
              try {
                await sentMessage.delete();
              } catch (error) {
                console.error(`Error deleting message in ${channel.name}:`, error);
              }
            }, 5000);
            
            sentCount++;
            textChannelCount++;
          } else {
            // Count other channel types (voice, stage, etc.)
            otherChannelCount++;
          }
        } catch (error) {
          console.error(`Error sending message to channel ${channel.name}:`, error);
        }
      }

      let resultMessage = `✅ **Pesan berhasil dikirim ke ${sentCount} text channel** dalam kategori **"${targetCategory.name}"**\n`;
      resultMessage += `📝 **${textChannelCount}** text/announcement channels - pesan akan dihapus dalam 5 detik\n`;
      
      if (otherChannelCount > 0) {
        resultMessage += `🔊 **${otherChannelCount}** channel lain (voice/stage) - tidak bisa menerima pesan\n`;
      }
      
      resultMessage += `\n💡 *Tujuan: Menghilangkan label "NEW" pada channel*`;

      await interaction.editReply({
        content: resultMessage,
      });

    } catch (error) {
      console.error('Error in new_label_channnel_delete command:', error);
      
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ Terjadi error saat mengirim pesan. Silakan periksa permission dan coba lagi.',
        });
      } else {
        await interaction.reply({
          content: '❌ Terjadi error saat mengirim pesan. Silakan periksa permission dan coba lagi.',
          ephemeral: true
        });
      }
    }
  },
};

export default command;