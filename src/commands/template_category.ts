import {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType,
  } from 'discord.js';
  import { Command } from '../types';
  
  const command: Command = {
    data: new SlashCommandBuilder()
      .setName('createcategories')
      .setDescription('Create multiple category channels in bulk with custom template')
      .addStringOption((option) =>
        option
          .setName('template')
          .setDescription(
            'Category name template. Use [nama] as a placeholder.'
          )
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName('categories')
          .setDescription('Category list: category1, category2, category3')
          .setRequired(true)
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
        const categoriesInput = interaction.options.getString('categories', true);
  
        if (!template.includes('[nama]')) {
          await interaction.reply({
            content: '❌ Template must contain [nama] as a placeholder.',
            ephemeral: true,
          });
          return;
        }
  
        await interaction.deferReply({ ephemeral: true });
  
        const results = {
          success: [] as string[],
          failed: [] as string[],
        };
  
        const categoriesList = categoriesInput.split(',').map((category) => category.trim());
  
        for (const categoryName of categoriesList) {
          try {
            const formattedName = template.replace('[nama]', categoryName);
  
            const newCategory = await guild.channels.create({
              name: formattedName,
              type: ChannelType.GuildCategory,
              reason: `Bulk category creation by ${interaction.user.tag}`,
            });
  
            results.success.push(formattedName);
  
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error) {
            results.failed.push(categoryName);
            console.error(`Error creating category ${categoryName}:`, error);
          }
        }
  
        const resultEmbed = new EmbedBuilder()
          .setTitle('📝 Category Creation Results')
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
        console.error('Error in createcategories command:', error);
        await interaction.editReply({
          content:
            '❌ An error occurred while creating categories. Please check permissions and try again.',
        });
      }
    },
  };
  
  export default command;