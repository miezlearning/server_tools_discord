import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionsBitField,
    WebhookClient,
    TextChannel,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} from 'discord.js';

const dataFile = path.join(__dirname, '../../data/messageIds.json');

// Function to ensure the data file exists and is valid
function ensureDataFile() {
    try {
        if (!fs.existsSync(dataFile)) {
            fs.mkdirSync(path.dirname(dataFile), { recursive: true });
            fs.writeFileSync(dataFile, JSON.stringify([], null, 2));
            console.log(`Created ${dataFile} with an empty array.`);
        } else {
            const data = fs.readFileSync(dataFile, 'utf8');
            JSON.parse(data); // Validate JSON
        }
    } catch (error) {
        console.error('Error ensuring data file:', error);
        fs.writeFileSync(dataFile, JSON.stringify([], null, 2));
        console.log(`Reset ${dataFile} due to corruption.`);
    }
}

// Function to save message data (embed + components) to the data file
function saveMessageData(messageId: string, embed: any, components: any[]) {
    try {
        ensureDataFile();
        const storedData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        storedData.push({ messageId, embed, components });
        fs.writeFileSync(dataFile, JSON.stringify(storedData, null, 2));
    } catch (error) {
        console.error('Error saving message data:', error);
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName('embed_add')
        .setDescription('Buat embed dari file JSON.')
        .addBooleanOption(opt =>
            opt
                .setName('use_webhook')
                .setDescription('Kirim menggunakan webhook?')
                .setRequired(true)
        )
        .addAttachmentOption(opt =>
            opt
                .setName('file')
                .setDescription('File JSON untuk embed.')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        // Cek permission (opsional)
        if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'No permission.', flags: 64 }); // 64 is the flag for ephemeral messages
        }

        // Cari attachment di message
        const attach = interaction.options.getAttachment('file', true);
        if (!attach || !attach.name?.endsWith('.json')) {
            return interaction.reply({ content: 'Harap sertakan file JSON.', ephemeral: true });
        }

        // Ambil data JSON
        try {
            const res = await fetch(attach.url);
            if (!res.ok) {
                throw new Error(`Gagal mengambil file: ${res.statusText}`);
            }

            const text = await res.text();
            if (!text.trim()) {
                throw new Error('File JSON kosong.');
            }

            const payload = JSON.parse(text);
            if (!payload || typeof payload !== 'object') {
                throw new Error('File JSON tidak valid.');
            }

            // Validasi embed
            if (!payload.embeds || !Array.isArray(payload.embeds) || payload.embeds.length === 0) {
                throw new Error('File JSON tidak memiliki embed yang valid.');
            }

            const embedData = payload.embeds[0];

            // Buat embed dari payload (tanpa membersihkan karakter khusus)
            const embed = new EmbedBuilder(embedData);

            // Buat komponen (button, dll)
            const components = payload.components.map((row: any) => {
                return new ActionRowBuilder().addComponents(
                    row.components.map((comp: any) => {
                        if (comp.type === 'BUTTON') {
                            return new ButtonBuilder()
                                .setCustomId(comp.customId)
                                .setLabel(comp.label)
                                .setStyle(comp.style);
                        }
                        return null;
                    }).filter((comp: any) => comp !== null)
                );
            });

            // Check use_webhook
            const useWebhook = interaction.options.getBoolean('use_webhook', true);

            if (useWebhook) {
                // Ganti URL di bawah dengan URL webhook
                const webhookClient = new WebhookClient({ url: 'https://discord.com/api/webhooks/1328005057098154116/Gp9ovRiDymVCcc6f3vhWtwdll6mUkKIcvRRYSCI6QrkC8C3PqI1rlo7T40WBAc-C_hJX' });
                const sent = await webhookClient.send({ embeds: [embed], components });
                saveMessageData(sent.id, payload.embed, payload.components);
                await interaction.reply({ content: `Embed dikirim via webhook (ID: ${sent.id}).`, ephemeral: true });
            } else {
                // Ensure the channel is a TextChannel before sending
                if (interaction.channel instanceof TextChannel) {
                    const sent = await interaction.channel.send({ embeds: [embed], components });
                    saveMessageData(sent.id, payload.embed, payload.components);
                    await interaction.reply({ content: `Embed dikirim (ID: ${sent.id}).`, ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Gagal mengirim embed: Channel tidak mendukung pengiriman pesan.', ephemeral: true });
                }
            }
        } catch (error) {
            console.error('Error processing JSON file:', error);
            if (error instanceof SyntaxError) {
                await interaction.reply({ content: 'File JSON tidak valid atau rusak.', ephemeral: true });
            } else if (error instanceof Error) {
                await interaction.reply({ content: `Terjadi kesalahan: ${error.message}`, ephemeral: true });
            } else {
                await interaction.reply({ content: 'Terjadi kesalahan saat memproses file JSON.', ephemeral: true });
            }
        }
    },
};