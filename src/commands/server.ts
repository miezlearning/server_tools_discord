import { SlashCommandBuilder, EmbedBuilder, ChannelType } from 'discord.js';
import { Command } from '../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Display server information'),
  execute: async (interaction) => {
    try {
      if (!interaction.isCommand() || !interaction.guild) return;

      const { guild } = interaction;

      // Calculate additional server information
      const totalChannels = guild.channels.cache.size;
      const textChannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText).size;
      const voiceChannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildVoice).size;
      const rolesCount = guild.roles.cache.size;
      const verificationLevel = guild.verificationLevel;

      const embed = new EmbedBuilder()
        .setTitle(`${guild.name} Server Information`)
        .setColor('#0099ff')
        .setThumbnail(guild.iconURL() || 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg')
        .addFields(
          { name: 'Created On', value: guild.createdAt.toLocaleDateString(), inline: true },
          { name: 'Member Count', value: guild.memberCount.toString(), inline: true },
          { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
          { name: 'Boost Level', value: guild.premiumTier.toString(), inline: true },
          { name: 'Boost Count', value: guild.premiumSubscriptionCount?.toString() || '0', inline: true },
          { name: 'Total Channels', value: totalChannels.toString(), inline: true },
          { name: 'Text Channels', value: textChannels.toString(), inline: true },
          { name: 'Voice Channels', value: voiceChannels.toString(), inline: true },
          { name: 'Roles Count', value: rolesCount.toString(), inline: true },
          { name: 'Verification Level', value: verificationLevel.toString(), inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error executing command:', error);
      if (interaction.isRepliable()) {
        await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
      }
    }
  },
};

export default command;