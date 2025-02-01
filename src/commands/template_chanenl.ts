import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  GuildBasedChannel,
} from 'discord.js';
import { Command } from '../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('createchannels')
    .setDescription('Create multiple channels in bulk with a custom template')
    .addStringOption((option) =>
      option
        .setName('template')
        .setDescription(
          'Channel name template. Use [emoji] and [nama_channel] as placeholders'
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('channels')
        .setDescription('Channel list: channel1, :emoji:|channel2')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('category')
        .setDescription('Category ID where channels will be created')
        .setRequired(true)
    )
    .addStringOption((option) =>
        option
          .setName('type')
          .setDescription('Type of channel to create')
          .setRequired(true)
          .addChoices(
            { name: 'Text', value: 'text' },
            { name: 'Voice', value: 'voice' },
            { name: 'Forum', value: 'forum' },
            { name: 'Announcement', value: 'announcement' }
          )
      )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  execute: async (interaction) => {
    const { guild } = interaction;
    if (!guild) return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.reply({
        content: '❌ You need Manage Channels permission to use this command.',
        ephemeral: true,
      });
      return;
    }

    try {
      const template = interaction.options.getString('template', true);
      const channelsInput = interaction.options.getString('channels', true);
      const categoryId = interaction.options.getString('category', true);
      const channelType = interaction.options.getString('type', true);

      if (!template.includes('[nama_channel]')) {
        await interaction.reply({
          content: '❌ Template must contain [nama_channel] as a placeholder.',
          ephemeral: true,
        });
        return;
      }

      const category = await guild.channels.fetch(categoryId);
      if (!category || category.type !== ChannelType.GuildCategory) {
        await interaction.reply({
          content: '❌ Category not found. Please provide a valid category ID.',
          ephemeral: true,
        });
        return;
      }

       // Determine the ChannelType enum value
        let channelTypeValue: ChannelType;
        switch (channelType) {
          case 'text':
            channelTypeValue = ChannelType.GuildText;
            break;
          case 'voice':
            channelTypeValue = ChannelType.GuildVoice;
            break;
          case 'forum':
            channelTypeValue = ChannelType.GuildForum;
            break;
          case 'announcement':
            channelTypeValue = ChannelType.GuildAnnouncement;
            break;
            default:
            channelTypeValue = ChannelType.GuildText;
            break;

        }

      // Split channels by comma and handle spaces properly
      const channelsList = channelsInput.split(',').map((channel) => channel.trim());

      await interaction.deferReply({ ephemeral: true });

      const results = {
        success: [] as string[],
        failed: [] as string[],
      };

      for (const channelInput of channelsList) {
        try {
          let emoji = '';
          let channelName = '';

          // Split input using the new separator "|"
          const [emojiPart, namePart] = channelInput.split('|').map((part) => part.trim());

          if (namePart) {
            // If both parts are present, assign values
            emoji = emojiPart || ''; // Emoji can be empty
            channelName = namePart;
          } else {
            // If no separator, assume entire input is the channel name
            channelName = emojiPart;
          }

          // Create the formatted name using the template
          const formattedName = template
            .replace('[emoji]', emoji)
            .replace('[nama_channel]', channelName);

          // Create the channel
          const newChannel = await guild.channels.create({
            name: formattedName,
            type: channelTypeValue,
            parent: categoryId,
            reason: `Bulk channel creation by ${interaction.user.tag}`,
          });

          results.success.push(formattedName);

          // Add delay to prevent rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          results.failed.push(channelInput);
          console.error(`Error creating channel ${channelInput}:`, error);
        }
      }


      const resultEmbed = new EmbedBuilder()
        .setTitle('📝 Channel Creation Results')
        .setColor(results.failed.length === 0 ? '#00FF00' : '#FF9900')
        .addFields(
          {
            name: '✅ Successfully Created',
            value: results.success.length > 0 ? results.success.join('\n') : 'None',
          },
          {
            name: '❌ Failed to Create',
            value: results.failed.length > 0 ? results.failed.join('\n') : 'None',
          }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [resultEmbed] });
    } catch (error) {
      console.error('Error in createchannels command:', error);
      await interaction.editReply({
        content:
          '❌ An error occurred while creating channels. Please check permissions and try again.',
      });
    }
  },
};

export default command; 