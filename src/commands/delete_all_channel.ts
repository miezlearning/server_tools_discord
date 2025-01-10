import { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { Command } from '../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('deletechannels')
    .setDescription('Delete all channels except specified ones')
    .addStringOption(option =>
      option
        .setName('exceptions')
        .setDescription('Channel IDs to keep (separate multiple IDs with commas)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  execute: async (interaction) => {
    const { guild } = interaction;
    if (!guild) return;

    // Check if user has administrator permissions
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '❌ You need Administrator permissions to use this command.',
        ephemeral: true
      });
      return;
    }

    // Get exception channel IDs
    const exceptionsString = interaction.options.getString('exceptions') || '';
    const exceptionIds = exceptionsString.split(',').map(id => id.trim());

    // Create confirmation embed
    const confirmEmbed = new EmbedBuilder()
      .setTitle('⚠️ Channel Deletion Confirmation')
      .setColor('#FF0000')
      .setDescription(
        'Are you sure you want to delete all channels?' +
        (exceptionIds.length > 0 ? `\nThe following channels will be kept:\n${exceptionIds.map(id => `<#${id}>`).join('\n')}` : '')
      )
      .setTimestamp();

    // Send confirmation message
    const confirmation = await interaction.reply({
      embeds: [confirmEmbed],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 4,
              label: 'Confirm Delete',
              custom_id: 'confirm_delete'
            },
            {
              type: 2,
              style: 2,
              label: 'Cancel',
              custom_id: 'cancel_delete'
            }
          ]
        }
      ],
      fetchReply: true
    });

    try {
      // Wait for button interaction
      const buttonInteraction = await confirmation.awaitMessageComponent({
        filter: i => i.user.id === interaction.user.id,
        time: 30000
      });

      if (buttonInteraction.customId === 'confirm_delete') {
        await buttonInteraction.update({
          content: '🚫 Starting channel deletion process...',
          embeds: [],
          components: []
        });

        let deletedCount = 0;
        let skippedCount = 0;
        const failedChannels: string[] = [];

        // Get all channels
        const channels = await guild.channels.fetch();

        // Delete channels
        for (const [id, channel] of channels) {
          if (exceptionIds.includes(id)) {
            skippedCount++;
            continue;
          }

          try {
            if (channel) {
              await channel.delete();
            } else {
              failedChannels.push(id);
            }
            deletedCount++;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit prevention
          } catch (error) {
            if (channel) {
              failedChannels.push(channel.name);
            } else {
              failedChannels.push(id);
            }
          }
        }

        // Create result embed
        const resultEmbed = new EmbedBuilder()
          .setTitle('Channel Deletion Results')
          .setColor('#00FF00')
          .addFields(
            { name: 'Channels Deleted', value: deletedCount.toString(), inline: true },
            { name: 'Channels Skipped', value: skippedCount.toString(), inline: true },
            { name: 'Failed Deletions', value: failedChannels.length > 0 ? failedChannels.join(', ') : 'None', inline: false }
          )
          .setTimestamp();

        await interaction.followUp({ embeds: [resultEmbed], ephemeral: true });
      } else {
        await buttonInteraction.update({
          content: '❌ Channel deletion cancelled.',
          embeds: [],
          components: []
        });
      }
    } catch (error) {
      await interaction.followUp({
        content: '❌ Confirmation timed out or an error occurred.',
        ephemeral: true
      });
    }
  },
};

export default command;