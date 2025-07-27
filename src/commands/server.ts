import { SlashCommandBuilder, EmbedBuilder, ChannelType, GuildVerificationLevel, GuildExplicitContentFilter, GuildMFALevel, GuildNSFWLevel } from 'discord.js';
import { Command } from '../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Menampilkan informasi lengkap tentang server'),
    
  execute: async (interaction) => {
    try {
      if (!interaction.guild) {
        await interaction.reply({ 
          content: '❌ Command ini hanya bisa digunakan di dalam server!', 
          ephemeral: true 
        });
        return;
      }

      await interaction.deferReply();

      const { guild } = interaction;

      // Fetch guild owner
      const owner = await guild.fetchOwner().catch(() => null);

      // Calculate channels information
      const channels = {
        total: guild.channels.cache.size,
        text: guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size,
        voice: guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size,
        category: guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size,
        announcement: guild.channels.cache.filter(c => c.type === ChannelType.GuildAnnouncement).size,
        stage: guild.channels.cache.filter(c => c.type === ChannelType.GuildStageVoice).size,
        forum: guild.channels.cache.filter(c => c.type === ChannelType.GuildForum).size
      };

      // Get verification level text
      const getVerificationLevel = (level: GuildVerificationLevel): string => {
        const levels = {
          [GuildVerificationLevel.None]: '🔓 None',
          [GuildVerificationLevel.Low]: '🔒 Low',
          [GuildVerificationLevel.Medium]: '🔐 Medium', 
          [GuildVerificationLevel.High]: '🛡️ High',
          [GuildVerificationLevel.VeryHigh]: '🔒🛡️ Very High'
        };
        return levels[level] || 'Unknown';
      };

      // Get explicit content filter text
      const getExplicitContentFilter = (filter: GuildExplicitContentFilter): string => {
        const filters = {
          [GuildExplicitContentFilter.Disabled]: '❌ Disabled',
          [GuildExplicitContentFilter.MembersWithoutRoles]: '⚠️ Members without roles',
          [GuildExplicitContentFilter.AllMembers]: '🛡️ All members'
        };
        return filters[filter] || 'Unknown';
      };

      // Get MFA level text
      const getMFALevel = (level: GuildMFALevel): string => {
        return level === GuildMFALevel.Elevated ? '🔐 Enabled' : '🔓 Disabled';
      };

      // Get NSFW level text
      const getNSFWLevel = (level: GuildNSFWLevel): string => {
        const levels = {
          [GuildNSFWLevel.Default]: '🔒 Default',
          [GuildNSFWLevel.Explicit]: '🔞 Explicit',
          [GuildNSFWLevel.Safe]: '✅ Safe',
          [GuildNSFWLevel.AgeRestricted]: '🔞 Age Restricted'
        };
        return levels[level] || 'Unknown';
      };

      // Get boost tier with emoji
      const getBoostTier = (tier: number): string => {
        const tiers = {
          0: '⭐ Level 0',
          1: '⭐⭐ Level 1',
          2: '⭐⭐⭐ Level 2', 
          3: '⭐⭐⭐⭐ Level 3'
        };
        return tiers[tier as keyof typeof tiers] || `⭐ Level ${tier}`;
      };

      // Calculate server age
      const serverAge = Math.floor((Date.now() - guild.createdTimestamp) / (1000 * 60 * 60 * 24));

      // Get features
      const features = guild.features.length > 0 
        ? guild.features.map(feature => {
            const featureNames: { [key: string]: string } = {
              'ANIMATED_BANNER': '🎬 Animated Banner',
              'ANIMATED_ICON': '🎭 Animated Icon',
              'BANNER': '🖼️ Banner',
              'COMMERCE': '🛒 Commerce',
              'COMMUNITY': '🏘️ Community',
              'DISCOVERABLE': '🔍 Discoverable',
              'FEATURABLE': '⭐ Featurable',
              'INVITE_SPLASH': '🌊 Invite Splash',
              'MEMBER_VERIFICATION_GATE_ENABLED': '🚪 Member Screening',
              'NEWS': '📰 News Channels',
              'PARTNERED': '🤝 Partnered',
              'PREVIEW_ENABLED': '👁️ Preview Enabled',
              'VANITY_URL': '🔗 Vanity URL',
              'VERIFIED': '✅ Verified',
              'VIP_REGIONS': '🌍 VIP Regions',
              'WELCOME_SCREEN_ENABLED': '👋 Welcome Screen'
            };
            return featureNames[feature] || feature.replace(/_/g, ' ');
          }).join('\n')
        : '❌ No special features';

      // Main server info embed
      const mainEmbed = new EmbedBuilder()
        .setTitle(`🏰 ${guild.name}`)
        .setDescription(guild.description || '*No server description set*')
        .setColor(0x00AE86)
        .setThumbnail(guild.iconURL({ size: 256 }) || null)
        .addFields(
          {
            name: '👑 **Server Owner**',
            value: owner ? `${owner.user.displayName}\n\`${owner.user.tag}\`` : 'Unknown',
            inline: true
          },
          {
            name: '📅 **Created**',
            value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>\n*${serverAge} days ago*`,
            inline: true
          },
          {
            name: '🆔 **Server ID**',
            value: `\`${guild.id}\``,
            inline: true
          },
          {
            name: '👥 **Members**',
            value: `**${guild.memberCount.toLocaleString()}** total members`,
            inline: true
          },
          {
            name: '🚀 **Boost Status**',
            value: `${getBoostTier(guild.premiumTier)}\n💎 **${guild.premiumSubscriptionCount || 0}** boosts`,
            inline: true
          },
          {
            name: '🌐 **Region**',
            value: guild.preferredLocale || 'Not set',
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Requested by ${interaction.user.displayName}`,
          iconURL: interaction.user.displayAvatarURL()
        });

      // Channels info embed
      const channelsEmbed = new EmbedBuilder()
        .setTitle('📺 **Channel Information**')
        .setColor(0x5865F2)
        .addFields(
          {
            name: '📊 **Overview**',
            value: `**${channels.total}** total channels`,
            inline: false
          },
          {
            name: '💬 **Text Channels**',
            value: `${channels.text}`,
            inline: true
          },
          {
            name: '🔊 **Voice Channels**',
            value: `${channels.voice}`,
            inline: true
          },
          {
            name: '📁 **Categories**',
            value: `${channels.category}`,
            inline: true
          },
          {
            name: '📢 **Announcements**',
            value: `${channels.announcement}`,
            inline: true
          },
          {
            name: '🎭 **Stage Channels**',
            value: `${channels.stage}`,
            inline: true
          },
          {
            name: '💬 **Forum Channels**',
            value: `${channels.forum}`,
            inline: true
          }
        );

      // Security & Settings embed
      const securityEmbed = new EmbedBuilder()
        .setTitle('🛡️ **Security & Settings**')
        .setColor(0xED4245)
        .addFields(
          {
            name: '🔐 **Verification Level**',
            value: getVerificationLevel(guild.verificationLevel),
            inline: true
          },
          {
            name: '🚫 **Explicit Content Filter**',
            value: getExplicitContentFilter(guild.explicitContentFilter),
            inline: true
          },
          {
            name: '🔒 **2FA Requirement**',
            value: getMFALevel(guild.mfaLevel),
            inline: true
          },
          {
            name: '🔞 **NSFW Level**',
            value: getNSFWLevel(guild.nsfwLevel),
            inline: true
          },
          {
            name: '👑 **Roles Count**',
            value: `${guild.roles.cache.size}`,
            inline: true
          },
          {
            name: '😀 **Emojis**',
            value: `${guild.emojis.cache.size}/50`,
            inline: true
          }
        );

      // Features embed (only if there are features)
      const embeds = [mainEmbed, channelsEmbed, securityEmbed];
      
      if (guild.features.length > 0) {
        const featuresEmbed = new EmbedBuilder()
          .setTitle('✨ **Server Features**')
          .setColor(0xFEE75C)
          .setDescription(features);
        embeds.push(featuresEmbed);
      }

      // Add banner if available
      if (guild.bannerURL()) {
        mainEmbed.setImage(guild.bannerURL({ size: 1024 }));
      }

      await interaction.editReply({ embeds });

    } catch (error) {
      console.error('Error in server command:', error);
      
      if (interaction.deferred) {
        await interaction.editReply({ 
          content: '❌ Terjadi error saat mengambil informasi server!' 
        });
      } else {
        await interaction.reply({ 
          content: '❌ Terjadi error saat mengambil informasi server!', 
          ephemeral: true 
        });
      }
    }
  },
};

export default command;