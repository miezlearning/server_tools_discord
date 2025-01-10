import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, GuildTextBasedChannel, TextChannel, VoiceChannel, NewsChannel } from 'discord.js';
import { Command } from '../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('toggle-view-messages')
    .setDescription('Toggle izin "View Channel" untuk @everyone di semua channel')
    .addStringOption(option =>
      option.setName('exclude')
        .setDescription('ID channel yang dikecualikan (pisahkan dengan koma)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels) // Hanya admin yang bisa menjalankan
    .setDMPermission(false), // Tidak bisa digunakan di DM
    execute: async (interaction) => {
        try {
          if (!interaction.isCommand() || !interaction.guild) return;
      
          // Menanggapi sementara untuk mencegah interaksi kadaluarsa
          await interaction.deferReply({ ephemeral: true });
      
          const { guild, options } = interaction;
      
          // Mendapatkan daftar channel yang dikecualikan
          const excludeChannels = options.getString('exclude')?.split(',') || [];
          const everyoneRole = guild.roles.everyone;
      
          // Loop melalui semua channel di server
          const channels = guild.channels.cache.filter(channel =>
            (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildNews) &&
            !excludeChannels.includes(channel.id)
          );
      
          // Cek status izin untuk menentukan toggle
          let toggleStatus = false;
          for (const [_, channel] of channels) {
            const permissions = (channel as GuildTextBasedChannel).permissionsFor(everyoneRole);
            if (permissions && permissions.has('ViewChannel')) {
              toggleStatus = true;
              break;
            }
          }
      
          // Toggle izin "View Channel"
          for (const [_, channel] of channels) {
            await (channel as TextChannel | VoiceChannel | NewsChannel).permissionOverwrites.edit(everyoneRole, {
              ViewChannel: !toggleStatus,
            });
          }
      
          // Kirim respons ke pengguna
          await interaction.editReply({
            content: `Izin "View Channel" telah ${toggleStatus ? 'dinonaktifkan' : 'diaktifkan'} untuk @everyone di semua channel${excludeChannels.length > 0 ? `, kecuali channel dengan ID: ${excludeChannels.join(', ')}` : ''}.`,
          });
        } catch (error) {
          console.error('Error executing command:', error);
          if (interaction.isRepliable()) {
            await interaction.editReply({
              content: 'Terjadi kesalahan saat menjalankan command ini!',
            });
          }
        }
      },      
};

export default command;