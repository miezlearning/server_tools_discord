import {
    SlashCommandBuilder,
    EmbedBuilder,
    AttachmentBuilder,
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
  } from 'discord.js';
  import { Command } from '../types';
  import { createCanvas, loadImage, registerFont } from 'canvas';
  import QRCode from 'qrcode';
  import axios from 'axios';
  import path from 'path';



  
  const command: Command = {
    data: new SlashCommandBuilder()
      .setName('createqris')
      .setDescription('Membuat QRIS Dinamis dari QRIS Statis')
      .addAttachmentOption((option) =>
        option
          .setName('qris_image')
          .setDescription('Upload gambar QRIS statis')
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName('nominal')
          .setDescription('Masukkan nominal transaksi')
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName('fee_option')
          .setDescription('Pilih jenis fee yang digunakan')
          .setRequired(true)
          .addChoices(
            { name: 'Tidak ada', value: 'no' },
            { name: 'Persen', value: 'percent' },
            { name: 'Rupiah', value: 'rupiah' }
          )
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.AttachFiles),
  
    execute: async (interaction) => {
      const qrisImage = interaction.options.getAttachment('qris_image', true);
      const nominal = interaction.options.getString('nominal', true);
      const feeOption = interaction.options.getString('fee_option', true);
  
      // Validasi input nominal
      if (isNaN(Number(nominal))) {
        await interaction.reply({ content: '❌ Nominal harus berupa angka.', ephemeral: true });
        return;
      }
  
      if (feeOption === 'no') {
        // Jika tidak menggunakan fee, langsung proses
        await processQRIS(interaction, qrisImage, nominal);
      } else {
        // Jika menggunakan fee, tampilkan modal untuk input fee amount
        const modal = new ModalBuilder()
          .setCustomId('feeModal')
          .setTitle('Input Fee Amount');
  
        const feeAmountInput = new TextInputBuilder()
          .setCustomId('fee_amount')
          .setLabel(`Masukkan jumlah fee (${feeOption === 'percent' ? 'persen' : 'rupiah'})`)
          .setStyle(TextInputStyle.Short)
          .setRequired(true);
  
        const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(feeAmountInput);
        modal.addComponents(actionRow);
  
        await interaction.showModal(modal);
  
        // Tunggu interaction modal submit
        const filter = (i: { customId: string }) => i.customId === 'feeModal';
        interaction
          .awaitModalSubmit({ filter, time: 60000 }) // Timeout 60 detik
          .then(async (modalInteraction) => {
            const feeAmount = modalInteraction.fields.getTextInputValue('fee_amount');
  
            // Validasi fee amount
            if (isNaN(Number(feeAmount))) {
              await modalInteraction.reply({ content: '❌ Fee amount harus berupa angka.', ephemeral: true });
              return;
            }
  
            // Proses QRIS dengan fee
            await processQRIS(modalInteraction, qrisImage, nominal, feeOption, feeAmount);
          })
          .catch((error) => {
            console.error('Error awaiting modal submit:', error);
            interaction.followUp({ content: '❌ Terjadi kesalahan atau timeout saat menunggu input modal.', ephemeral: true });
          });
      }
    },
  };
  
  async function processQRIS(
    interaction: any,
    qrisImage: any,
    nominal: string,
    feeOption?: string,
    feeAmount?: string
) {
    try {
        await interaction.deferReply();

        // Download gambar QRIS
        const response = await axios.get(qrisImage.url, { responseType: 'arraybuffer' });
        const qrisImageData = Buffer.from(response.data, 'binary').toString('base64');

        // Scan gambar QRIS
        const img = await loadImage(`data:image/png;base64,${qrisImageData}`);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        const jsQR = (await import('jsqr')).default;
        const qrCodeData = jsQR(imageData.data, imageData.width, imageData.height);

        if (!qrCodeData) {
            await interaction.editReply('❌ Gagal membaca data QRIS dari gambar.');
            return;
        }

        const qrisData = qrCodeData.data;

        // Konversi QRIS statis ke dinamis
        const dynamicQRIS = convertQRIS(qrisData, nominal, feeOption, feeAmount);

        // Generate QR code dari QRIS dinamis
        const qrCodeImage = await QRCode.toDataURL(dynamicQRIS);

        // Create a new canvas with extra space for text
        const finalCanvas = createCanvas(400, 500); // Increased height for text
        const finalCtx = finalCanvas.getContext('2d');

        // Set background to white
        finalCtx.fillStyle = 'white';
        finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        // Add "Thinker Store" text
        finalCtx.fillStyle = '#000000';
        finalCtx.font = 'bold 24px Arial';
        finalCtx.textAlign = 'center';
        finalCtx.fillText('Thinker Store', finalCanvas.width / 2, 40);

        // Add nominal text
        finalCtx.font = '20px Arial';
        finalCtx.fillText(`Rp ${Number(nominal).toLocaleString('id-ID')}`, finalCanvas.width / 2, 80);

        // Draw QR code
        const qrImage = await loadImage(qrCodeImage);
        const qrSize = 300;
        const qrX = (finalCanvas.width - qrSize) / 2;
        const qrY = 100;
        finalCtx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

        // Convert canvas to buffer
        const buffer = finalCanvas.toBuffer('image/png');

        // Create attachment
        const attachment = new AttachmentBuilder(buffer, { name: 'dynamic_qris.png' });

        // Calculate total
        let total = Number(nominal);
        if (feeOption !== 'no' && feeAmount) {
            if (feeOption === 'percent') {
                total += total * (Number(feeAmount) / 100);
            } else {
                total += Number(feeAmount);
            }
        }

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle('✨ QRIS Thinker Store ✨')
            .setDescription(`Berikut adalah QRIS pembayaranmu!`)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setImage('attachment://dynamic_qris.png')
            .addFields(
                { name: '💰 Nominal', value: `\`\`\`Rp ${Number(nominal).toLocaleString('id-ID')}\`\`\``, inline: false },
            )
            .setFooter({ text: `Generated by ${interaction.user.tag}`, iconURL: interaction.guild?.iconURL() ?? undefined })
            .setTimestamp()
            .setColor('#2B2D31');

        // Add fee fields if applicable
        if (feeOption !== 'no' && feeAmount) {
            embed.addFields(
                {
                    name: '💳 Fee',
                    value: `\`\`\`${feeOption === 'percent' ? `${feeAmount}%` : `Rp ${Number(feeAmount).toLocaleString('id-ID')}`}\`\`\``,
                    inline: false,
                },
                {
                    name: '💵 Total Pembayaran',
                    value: `\`\`\`Rp ${total.toLocaleString('id-ID')}\`\`\``,
                    inline: false,
                }
            );
        } else {
            embed.addFields(
                {
                    name: '💵 Total Pembayaran',
                    value: `\`\`\`Rp ${total.toLocaleString('id-ID')}\`\`\``,
                    inline: false,
                }
            );
        }

        // Send embed and attachment
        await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (error) {
        console.error('Error in createqris command:', error);
        await interaction.editReply('❌ Terjadi kesalahan saat membuat QRIS dinamis.');
    }
}

  
  function convertQRIS(qris: string, nominal: string, feeOption?: string, feeAmount?: string): string {
    let tax = '';
    if (feeOption === 'rupiah') {
      tax = '55020256' + String(feeAmount!.length).padStart(2, '0') + feeAmount!;
    } else if (feeOption === 'percent') {
      tax = '55020357' + String(feeAmount!.length).padStart(2, '0') + feeAmount!;
    }
  
    qris = qris.substring(0, qris.length - 4);
    const step1 = qris.replace('010211', '010212');
    const step2 = step1.split('5802ID');
    let uang = '54' + String(nominal.length).padStart(2, '0') + nominal;
  
    if (!tax) {
      uang += '5802ID';
    } else {
      uang += tax + '5802ID';
    }
  
    const fix = step2[0] + uang + step2[1];
    const crc = ConvertCRC16(fix);
    return fix + crc;
  }
  
  function ConvertCRC16(str: string): string {
    function charCodeAt(str: string, i: number): number {
      return str.charCodeAt(i);
    }
    let crc = 0xffff;
    const strlen = str.length;
    for (let c = 0; c < strlen; c++) {
      crc ^= charCodeAt(str, c) << 8;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }
    let hex = (crc & 0xffff).toString(16).toUpperCase();
    if (hex.length === 3) hex = '0' + hex;
    return hex;
  }
  
  export default command;