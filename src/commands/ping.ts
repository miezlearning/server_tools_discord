import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Mengecek latensi bot dan koneksi API Discord'),
    
  execute: async (interaction) => {
    try {
      // Send initial message with loading indicator
      const sent = await interaction.reply({ 
        content: '🏓 **Pinging...** 📡', 
        fetchReply: true 
      });

      // Calculate latencies
      const roundtripLatency = Math.abs(sent.createdTimestamp - interaction.createdTimestamp);
      const websocketLatency = Math.max(0, interaction.client.ws.ping); // Ensure positive value
      
      // Determine connection quality
      const getLatencyStatus = (ping: number): { emoji: string; status: string; color: number } => {
        // Handle invalid/negative values
        if (ping < 0 || isNaN(ping)) return { emoji: '❓', status: 'Unknown', color: 0x808080 };
        if (ping < 50) return { emoji: '🟢', status: 'Excellent', color: 0x00FF00 };
        if (ping < 100) return { emoji: '🟡', status: 'Good', color: 0xFFFF00 };
        if (ping < 200) return { emoji: '🟠', status: 'Fair', color: 0xFFA500 };
        if (ping < 500) return { emoji: '🔴', status: 'Poor', color: 0xFF0000 };
        return { emoji: '⚫', status: 'Very Poor', color: 0x800080 };
      };

      const roundtripStatus = getLatencyStatus(roundtripLatency);
      const websocketStatus = getLatencyStatus(websocketLatency);

      // Get bot uptime
      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      let uptimeString = '';
      if (days > 0) uptimeString += `${days}d `;
      if (hours > 0) uptimeString += `${hours}h `;
      if (minutes > 0) uptimeString += `${minutes}m `;
      uptimeString += `${seconds}s`;

      // Create detailed embed
      const embed = new EmbedBuilder()
        .setTitle('🏓 **Pong!** - Bot Status')
        .setColor(roundtripLatency < 100 ? 0x00AE86 : roundtripLatency < 200 ? 0xFFFF00 : 0xFF0000)
        .setDescription('📊 **Detailed Connection Information**')
        .addFields(
          {
            name: '⚡ **Roundtrip Latency**',
            value: `${roundtripStatus.emoji} **${roundtripLatency >= 0 ? roundtripLatency : 'N/A'}ms**\n*${roundtripStatus.status}*`,
            inline: true
          },
          {
            name: '🌐 **WebSocket Ping**',
            value: `${websocketStatus.emoji} **${websocketLatency >= 0 ? websocketLatency : 'N/A'}ms**\n*${websocketStatus.status}*`,
            inline: true
          },
          {
            name: '🔄 **Bot Uptime**',
            value: `⏱️ **${uptimeString}**\n*Since last restart*`,
            inline: true
          },
          {
            name: '📈 **Performance Metrics**',
            value: [
              `💾 **Memory Usage:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
              `🖥️ **CPU Usage:** ${process.cpuUsage().user}μs`,
              `📊 **Node.js:** ${process.version}`
            ].join('\n'),
            inline: false
          },
          {
            name: '🔗 **Connection Status**',
            value: [
              `${interaction.client.ws.status === 0 ? '🟢 Connected' : '🔴 Disconnected'}`,
              `📡 **Guilds:** ${interaction.client.guilds.cache.size}`,
              `👥 **Users:** ${interaction.client.users.cache.size}`,
              `📺 **Channels:** ${interaction.client.channels.cache.size}`
            ].join('\n'),
            inline: false
          }
        )
        .setFooter({
          text: `Requested by ${interaction.user.displayName} • ${new Date().toLocaleTimeString()}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      // Add thumbnail based on connection quality
      if (roundtripLatency < 100) {
        embed.setThumbnail('https://cdn.discordapp.com/emojis/755744584217583656.png'); // Green checkmark
      } else if (roundtripLatency < 200) {
        embed.setThumbnail('https://cdn.discordapp.com/emojis/755744584078704640.png'); // Yellow warning
      } else {
        embed.setThumbnail('https://cdn.discordapp.com/emojis/755744584192417854.png'); // Red X
      }

      await interaction.editReply({
        content: null,
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error in ping command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ **Error**')
        .setDescription('Terjadi error saat mengecek ping!')
        .setColor(0xFF0000)
        .setTimestamp();

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};

export default command;