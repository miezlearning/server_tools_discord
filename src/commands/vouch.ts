import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CommandInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalSubmitInteraction,
    ButtonInteraction,
    TextChannel,
    Attachment,
    GuildMemberRoleManager,
} from 'discord.js';
import { Command } from '../types';

const allowedChannelId = '1335117108505214986';
const allowedRoleId = '1334982073047584810';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('vouch')
        .setDescription('Membuat vouch baru')
        .addStringOption((option) =>
            option.setName('nama_produk').setDescription('Nama Produk').setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('rating')
                .setDescription('Rating Pembelian')
                .setRequired(true)
                .addChoices(
                    { name: '⭐', value: '⭐' },
                    { name: '⭐⭐', value: '⭐⭐' },
                    { name: '⭐⭐⭐', value: '⭐⭐⭐' },
                    { name: '⭐⭐⭐⭐', value: '⭐⭐⭐⭐' },
                    { name: '⭐⭐⭐⭐⭐', value: '⭐⭐⭐⭐⭐' }
                )
        )
        .addStringOption((option) => option.setName('pesan').setDescription('Pesan (Opsional)'))
        .addAttachmentOption((option) =>
            option.setName('gambar').setDescription('Gambar Produk (Opsional)')
        ),

    execute: async (interaction: CommandInteraction) => {
        if (!interaction.isChatInputCommand()) return;

        if (interaction.channelId !== allowedChannelId) {
            await interaction.reply({
                content: `# <:thinker_cross:1333560082859954288> Error \n-# Command ini hanya bisa digunakan di channel <#${allowedChannelId}>.`,
                ephemeral: true,
            });
            return;
        }

        if (
            !interaction.member ||
            (!Array.isArray(interaction.member.roles) &&
                !interaction.member.roles.cache.has(allowedRoleId))
        ) {
            await interaction.reply({
                content: `# <:thinker_cross:1333560082859954288> Error\n-# Kamu harus membeli produk terlebih dahulu dan memiliki role <@&${allowedRoleId}>`,
                ephemeral: true,
            });
            return;
        }

        const namaProduk = interaction.options.getString('nama_produk', true);
        const rating = interaction.options.getString('rating', true); // Mengambil value dari choice
        const pesan = interaction.options.getString('pesan');
        const gambar = interaction.options.getAttachment('gambar');

        const embed = new EmbedBuilder()
        .setDescription(`# <:thinker_cart:1333560094515789835>  \`Vouch Thinker Hub\` \n\n> Makasih udah belanja di Thinker Hub! 🎉🛍️\n> Semoga puas sama produknya~\n\n> Gunakan **command** </vouch:1335472766358650901> untuk mengirim vouch atau menggunakan **tombol** dibawah yaaa.`)
        .addFields(
                { name: 'Nama Produk', value: namaProduk, inline: true },
                { name: 'Rating', value: rating,inline: true },
                { name: 'Pesan', value: pesan || 'Tidak ada pesan' }
            )
            .setThumbnail('https://media.discordapp.net/attachments/1335194503249788983/1335487789269254224/9a7cfbdd740ccf622ef824df91e2c222.jpg?ex=67a0596d&is=679f07ed&hm=3d6e1479364ffee33f8c2db4cfa176f8f283ec5227c503452101cc8e4bd07ed2&=&format=webp&width=662&height=662')
            .setTimestamp()
            .setColor('#2B2D31')
            .setFooter({ text: `Oleh ${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() });

        if (gambar) {
            embed.setImage(gambar.url);
        }

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('vouch_create_button')
                .setLabel('Tambah Vouch')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('1335489436607189083')
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },

    handleButton: async (interaction: ButtonInteraction) => {
        if (!interaction.member || !(interaction.member.roles as GuildMemberRoleManager).cache.has(allowedRoleId)) {
            await interaction.reply({
                content: `# <:thinker_cross:1333560082859954288> Error\n-# Kamu harus memiliki role <@&${allowedRoleId}> untuk menggunakan tombol ini.`,
                ephemeral: true,
            });
            return;
        }

        const modal = new ModalBuilder().setCustomId('vouch_create_modal').setTitle('Buat Vouch Baru');

        const namaProdukInput = new TextInputBuilder()
            .setCustomId('nama_produk')
            .setLabel('Nama Produk')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const ratingInput = new TextInputBuilder()
            .setCustomId('rating')
            .setLabel('Rating (1-5)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const pesanInput = new TextInputBuilder()
            .setCustomId('pesan')
            .setLabel('Pesan (Opsional)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

            const gambarInput = new TextInputBuilder()
            .setCustomId('gambar')
            .setLabel('URL Gambar (Opsional)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);
        

        const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(namaProdukInput);
        const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(ratingInput);
        const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(pesanInput);
        const fourthActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(gambarInput);
        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);
        

        await interaction.showModal(modal);
    },


    handleModal: async (interaction: ModalSubmitInteraction) => {
        const namaProduk = interaction.fields.getTextInputValue('nama_produk');
        const rating = interaction.fields.getTextInputValue('rating'); // Ambil value dari input modal
        const pesan = interaction.fields.getTextInputValue('pesan');
        const gambar = interaction.fields.getTextInputValue('gambar');

        // Validasi rating (pastikan ada di antara pilihan yang valid)
        const ratingNumber = parseInt(rating, 10);
        if (isNaN(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
            await interaction.reply({
                content: '❌ Rating tidak valid. Harap masukkan angka antara 1 hingga 5.',
                ephemeral: true,
            });
            return;
        }

        // Konversi angka menjadi bintang
        const starRating = '⭐'.repeat(ratingNumber);

        const embed = new EmbedBuilder()
            .setDescription(`# <:thinker_cart:1333560094515789835>  \`Vouch Thinker Hub\` \n\n> Makasih udah belanja di Thinker Hub! 🎉🛍️\n> Semoga puas sama produknya~\n\n> Gunakan **command** </vouch:1335472766358650901> untuk mengirim vouch atau menggunakan **tombol** dibawah yaaa.`)
            .addFields(
                { name: 'Nama Produk', value: namaProduk, inline: true },
                { name: 'Rating', value: starRating,inline: true },
                { name: 'Pesan', value: pesan || 'Tidak ada pesan' }
            )
            .setThumbnail('https://media.discordapp.net/attachments/1335194503249788983/1335487789269254224/9a7cfbdd740ccf622ef824df91e2c222.jpg?ex=67a0596d&is=679f07ed&hm=3d6e1479364ffee33f8c2db4cfa176f8f283ec5227c503452101cc8e4bd07ed2&=&format=webp&width=662&height=662')
            .setTimestamp()
            .setColor('#2B2D31')
            .setFooter({ text: `Oleh ${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() });

        if (gambar) {
            embed.setImage(gambar);
        }

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('vouch_create_button')
                .setLabel('Tambah Vouch')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('1335489436607189083')
        );

        const channel = interaction.channel as TextChannel;
        if (channel) {
            await channel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: '✅ Vouch berhasil dibuat.', ephemeral: true });
        } else {
            await interaction.reply({
                content: '❌ Gagal mengirim vouch, channel tidak ditemukan.',
                ephemeral: true,
            });
        }
    },
};

export default command;
