import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType,
  AttachmentBuilder
} from 'discord.js';
import { Command } from '../types';
import * as path from 'path';
import * as fs from 'fs';

// Payment methods configuration
const PAYMENT_METHODS = {
  qris: {
    name: '🏛️ QRIS',
    merchantName: 'THINKER STORE, PALARAN',
    nmid: 'ID1024351849715',
    terminalId: 'A01',
    imagePath: path.join(__dirname, '../images/qris.png'),
    color: 0xFF6B6B,
    icon: '🏛️',
    description: 'Satu QR untuk semua e-wallet & bank'
  },
  dana: {
    name: '💙 DANA',
    number: '08123456789',
    color: 0x118EEA,
    icon: '💙',
    description: 'Pembayaran digital terpercaya'
  },
  gopay: {
    name: '💚 GoPay',
    number: '08123456789',
    color: 0x00AA5B,
    icon: '💚',
    description: 'Dari ekosistem Gojek/Tokopedia'
  },
  ovo: {
    name: '💜 OVO',
    number: '08123456789',
    color: 0x4F3A9C,
    icon: '💜',
    description: 'Cashless payment solution'
  },
  shopee: {
    name: '🧡 ShopeePay',
    number: '08123456789',
    color: 0xEE4D2D,
    icon: '🧡',
    description: 'Terintegrasi dengan Shopee'
  },
  linkaja: {
    name: '❤️ LinkAja',
    number: '08123456789',
    color: 0xE51D2A,
    icon: '❤️',
    description: 'Digital payment by Telkomsel'
  }
};

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('payment')
    .setDescription('Menampilkan daftar metode pembayaran dengan QRIS')
    .addStringOption(option =>
      option.setName('method')
        .setDescription('Pilih metode pembayaran spesifik')
        .setRequired(false)
        .addChoices(
          { name: '🏛️ QRIS (All E-wallet)', value: 'qris' },
          { name: '💙 DANA', value: 'dana' },
          { name: '💚 GoPay', value: 'gopay' },
          { name: '💜 OVO', value: 'ovo' },
          { name: '🧡 ShopeePay', value: 'shopee' },
          { name: '❤️ LinkAja', value: 'linkaja' }
        )
    )
    .addStringOption(option =>
      option.setName('amount')
        .setDescription('Jumlah pembayaran (opsional)')
        .setRequired(false)
    ),

  execute: async (interaction) => {
    try {
      await interaction.deferReply();

      const selectedMethod = interaction.options.getString('method');
      const amount = interaction.options.getString('amount');

      if (selectedMethod) {
        // Show specific payment method
        const paymentData = PAYMENT_METHODS[selectedMethod as keyof typeof PAYMENT_METHODS];
        
        if (selectedMethod === 'qris') {
          // For QRIS, use the uploaded image if it exists
          const qrisData = paymentData as typeof PAYMENT_METHODS.qris;
          let attachment: AttachmentBuilder | undefined;
          
          if (fs.existsSync(qrisData.imagePath)) {
            attachment = new AttachmentBuilder(qrisData.imagePath, { name: 'qris.png' });
          }

          const embed = new EmbedBuilder()
            .setTitle(`${qrisData.icon} **${qrisData.name}** - Payment`)
            .setColor(qrisData.color)
            .setDescription('🏛️ **Scan QRIS di bawah untuk pembayaran dari semua e-wallet & bank**')
            .addFields(
              {
                name: '🏪 **Merchant**',
                value: `\`${qrisData.merchantName}\``,
                inline: true
              },
              {
                name: '🆔 **NMID**',
                value: `\`${qrisData.nmid}\``,
                inline: true
              },
              {
                name: '📟 **Terminal**',
                value: `\`${qrisData.terminalId}\``,
                inline: true
              },
              {
                name: '💰 **Jumlah Pembayaran**',
                value: amount ? `**Rp ${parseInt(amount).toLocaleString('id-ID')}**` : '**Sesuai kebutuhan**',
                inline: true
              },
              {
                name: '⏰ **Berlaku Hingga**',
                value: `<t:${Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000)}:f>`,
                inline: true
              },
              {
                name: '🌟 **Keunggulan QRIS**',
                value: '✅ **Semua E-wallet** - DANA, GoPay, OVO, ShopeePay, LinkAja\n✅ **Semua Bank** - BCA, Mandiri, BRI, BNI, dll\n✅ **Satu QR** untuk semua pembayaran digital',
                inline: true
              },
              {
                name: '📋 **Cara Pembayaran**',
                value: [
                  '1️⃣ Buka aplikasi **e-wallet** atau **mobile banking**',
                  '2️⃣ Pilih menu **"Scan QR"** atau **"Bayar"**',
                  '3️⃣ Scan QRIS code di bawah ini',
                  '4️⃣ Masukkan nominal pembayaran',
                  '5️⃣ Periksa detail dan konfirmasi transaksi'
                ].join('\n'),
                inline: false
              },
              {
                name: '⚠️ **Penting untuk Diperhatikan**',
                value: '• Pastikan saldo mencukupi di aplikasi Anda\n• Periksa detail merchant sebelum konfirmasi\n• Simpan bukti pembayaran untuk referensi\n• Laporkan jika ada kesalahan transaksi',
                inline: false
              }
            )
            .setFooter({
              text: 'QRIS berlaku 24 jam • Jangan bagikan ke orang lain • Cek aplikasi penyedia QRIS di: www.aspi-qris.id',
              iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

          if (attachment) {
            embed.setImage('attachment://qris.png');
          }

          await interaction.editReply({
            embeds: [embed],
            files: attachment ? [attachment] : undefined
          });

        } else {
          // For other e-wallets, show transfer information
          const ewalletData = paymentData as typeof PAYMENT_METHODS.dana;
          const embed = new EmbedBuilder()
            .setTitle(`${ewalletData.icon} **${ewalletData.name}** - Transfer`)
            .setColor(ewalletData.color)
            .setDescription(`💳 **Transfer ke nomor ${ewalletData.name.replace(/💙|💚|💜|🧡|❤️/g, '').trim()} di bawah**`)
            .addFields(
              {
                name: '📱 **Nomor Tujuan**',
                value: `\`${ewalletData.number}\``,
                inline: true
              },
              {
                name: '💰 **Jumlah Pembayaran**',
                value: amount ? `**Rp ${parseInt(amount).toLocaleString('id-ID')}**` : '**Sesuai kebutuhan**',
                inline: true
              },
              {
                name: '⏰ **Berlaku Hingga**',
                value: `<t:${Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000)}:f>`,
                inline: true
              },
              {
                name: '📋 **Cara Transfer**',
                value: [
                  '1️⃣ Buka aplikasi **' + paymentData.name.replace(/💙|💚|💜|🧡|❤️/g, '').trim() + '**',
                  '2️⃣ Pilih menu **"Transfer"** atau **"Kirim Uang"**',
                  '3️⃣ Masukkan nomor tujuan di atas',
                  '4️⃣ Masukkan nominal pembayaran',
                  '5️⃣ Periksa detail dan konfirmasi transfer'
                ].join('\n'),
                inline: false
              },
              {
                name: '⚠️ **Penting**',
                value: '• Pastikan nomor tujuan sudah benar\n• Periksa saldo sebelum transfer\n• Simpan bukti transfer\n• Konfirmasi ke penjual setelah transfer',
                inline: false
              }
            )
            .setFooter({
              text: 'Transfer berlaku 24 jam • Pastikan detail sudah benar sebelum konfirmasi',
              iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

          await interaction.editReply({
            embeds: [embed]
          });
        }

      } else {
        // Show all payment methods with interactive buttons
        const mainEmbed = new EmbedBuilder()
          .setTitle('💳 **Metode Pembayaran Tersedia**')
          .setColor(0x00AE86)
          .setDescription('📱 **Pilih metode pembayaran digital yang Anda inginkan**')
          .addFields(
            {
              name: '🏛️ **QRIS (Rekomendasi)**',
              value: `🏪 \`${PAYMENT_METHODS.qris.merchantName}\`\n💡 *${PAYMENT_METHODS.qris.description}*`,
              inline: true
            },
            {
              name: '💙 **DANA**',
              value: `📱 \`${PAYMENT_METHODS.dana.number}\`\n💡 *${PAYMENT_METHODS.dana.description}*`,
              inline: true
            },
            {
              name: '💚 **GoPay**',
              value: `📱 \`${PAYMENT_METHODS.gopay.number}\`\n💡 *${PAYMENT_METHODS.gopay.description}*`,
              inline: true
            },
            {
              name: '💜 **OVO**',
              value: `📱 \`${PAYMENT_METHODS.ovo.number}\`\n💡 *${PAYMENT_METHODS.ovo.description}*`,
              inline: true
            },
            {
              name: '🧡 **ShopeePay**',
              value: `📱 \`${PAYMENT_METHODS.shopee.number}\`\n💡 *${PAYMENT_METHODS.shopee.description}*`,
              inline: true
            },
            {
              name: '❤️ **LinkAja**',
              value: `📱 \`${PAYMENT_METHODS.linkaja.number}\`\n💡 *${PAYMENT_METHODS.linkaja.description}*`,
              inline: true
            },
            {
              name: '🛡️ **Keamanan Terjamin**',
              value: '✅ Transaksi aman & terenkripsi\n✅ Mendukung semua bank\n✅ Tersedia 24/7',
              inline: true
            },
            {
              name: '💡 **Tips Pembayaran**',
              value: [
                '🔒 **Gunakan aplikasi resmi** - Download dari store resmi',
                '💰 **Cek saldo** - Pastikan saldo mencukupi',
                '📱 **Periksa detail** - Pastikan nomor/merchant benar',
                '📄 **Simpan bukti** - Screenshot bukti transaksi',
                '⏰ **Bayar tepat waktu** - Jangan tunda pembayaran'
              ].join('\n'),
              inline: false
            }
          )
          .setThumbnail('https://cdn-icons-png.flaticon.com/512/2331/2331966.png')
          .setFooter({
            text: 'Pilih tombol di bawah untuk melihat detail pembayaran',
            iconURL: interaction.client.user.displayAvatarURL()
          })
          .setTimestamp();

        // Create buttons for each payment method
        const row1 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('payment_qris')
              .setLabel('QRIS (Semua E-wallet)')
              .setEmoji('🏛️')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('payment_dana')
              .setLabel('DANA')
              .setEmoji('💙')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('payment_gopay')
              .setLabel('GoPay')
              .setEmoji('💚')
              .setStyle(ButtonStyle.Success)
          );

        const row2 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('payment_ovo')
              .setLabel('OVO')
              .setEmoji('💜')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('payment_shopee')
              .setLabel('ShopeePay')
              .setEmoji('🧡')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('payment_linkaja')
              .setLabel('LinkAja')
              .setEmoji('❤️')
              .setStyle(ButtonStyle.Danger)
          );

        const message = await interaction.editReply({
          embeds: [mainEmbed],
          components: [row1, row2]
        });

        // Create button collector
        const collector = message.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 300000 // 5 minutes
        });

        collector.on('collect', async (buttonInteraction) => {
          if (buttonInteraction.user.id !== interaction.user.id) {
            await buttonInteraction.reply({
              content: '❌ Hanya yang menggunakan command ini yang bisa memilih metode pembayaran!',
              ephemeral: true
            });
            return;
          }

          const methodKey = buttonInteraction.customId.replace('payment_', '');
          
          if (methodKey === 'back') {
            // Back to main menu
            await buttonInteraction.update({
              embeds: [mainEmbed],
              components: [row1, row2]
            });
            return;
          }

          const paymentData = PAYMENT_METHODS[methodKey as keyof typeof PAYMENT_METHODS];

          try {
            await buttonInteraction.deferUpdate();

            if (methodKey === 'qris') {
              // Show QRIS payment
              const qrisData = PAYMENT_METHODS.qris;
              let attachment: AttachmentBuilder | undefined;
              if (fs.existsSync(qrisData.imagePath)) {
                attachment = new AttachmentBuilder(qrisData.imagePath, { name: 'qris.png' });
              }

              const qrisEmbed = new EmbedBuilder()
                .setTitle(`${qrisData.icon} **${qrisData.name}** - Payment`)
                .setColor(qrisData.color)
                .setDescription('🏛️ **Scan QRIS di bawah untuk pembayaran dari semua e-wallet & bank**')
                .addFields(
                  {
                    name: '🏪 **Merchant**',
                    value: `\`${qrisData.merchantName}\``,
                    inline: true
                  },
                  {
                    name: '🆔 **NMID**',
                    value: `\`${qrisData.nmid}\``,
                    inline: true
                  },
                  {
                    name: '📟 **Terminal**',
                    value: `\`${qrisData.terminalId}\``,
                    inline: true
                  },
                  {
                    name: '💰 **Jumlah Pembayaran**',
                    value: amount ? `**Rp ${parseInt(amount).toLocaleString('id-ID')}**` : '**Sesuai kebutuhan**',
                    inline: true
                  },
                  {
                    name: '⏰ **Berlaku Hingga**',
                    value: `<t:${Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000)}:f>`,
                    inline: true
                  },
                  {
                    name: '🌟 **Keunggulan QRIS**',
                    value: '✅ **Semua E-wallet** - DANA, GoPay, OVO, ShopeePay, LinkAja\n✅ **Semua Bank** - BCA, Mandiri, BRI, BNI, dll\n✅ **Satu QR** untuk semua pembayaran digital',
                    inline: true
                  },
                  {
                    name: '📋 **Cara Pembayaran**',
                    value: [
                      '1️⃣ Buka aplikasi **e-wallet** atau **mobile banking**',
                      '2️⃣ Pilih menu **"Scan QR"** atau **"Bayar"**',
                      '3️⃣ Scan QRIS code di bawah ini',
                      '4️⃣ Masukkan nominal pembayaran',
                      '5️⃣ Periksa detail dan konfirmasi transaksi'
                    ].join('\n'),
                    inline: false
                  }
                )
                .setFooter({
                  text: 'QRIS berlaku 24 jam • Tekan tombol untuk kembali ke menu utama',
                  iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

              if (attachment) {
                qrisEmbed.setImage('attachment://qris.png');
              }

              const backButton = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId('payment_back')
                    .setLabel('← Kembali ke Menu')
                    .setEmoji('🔙')
                    .setStyle(ButtonStyle.Secondary)
                );

              await buttonInteraction.editReply({
                embeds: [qrisEmbed],
                files: attachment ? [attachment] : undefined,
                components: [backButton]
              });

            } else {
              // Show e-wallet transfer
              const ewalletData = paymentData as typeof PAYMENT_METHODS.dana;
              const paymentEmbed = new EmbedBuilder()
                .setTitle(`${ewalletData.icon} **${ewalletData.name}** - Transfer`)
                .setColor(ewalletData.color)
                .setDescription(`💳 **Transfer ke nomor ${ewalletData.name.replace(/💙|💚|💜|🧡|❤️/g, '').trim()} di bawah**`)
                .addFields(
                  {
                    name: '📱 **Nomor Tujuan**',
                    value: `\`${ewalletData.number}\``,
                    inline: true
                  },
                  {
                    name: '💰 **Jumlah Pembayaran**',
                    value: amount ? `**Rp ${parseInt(amount).toLocaleString('id-ID')}**` : '**Sesuai kebutuhan**',
                    inline: true
                  },
                  {
                    name: '⏰ **Berlaku Hingga**',
                    value: `<t:${Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000)}:f>`,
                    inline: true
                  },
                  {
                    name: '📋 **Cara Transfer**',
                    value: [
                      '1️⃣ Buka aplikasi **' + ewalletData.name.replace(/💙|💚|💜|🧡|❤️/g, '').trim() + '**',
                      '2️⃣ Pilih menu **"Transfer"** atau **"Kirim Uang"**',
                      '3️⃣ Masukkan nomor tujuan di atas',
                      '4️⃣ Masukkan nominal pembayaran',
                      '5️⃣ Periksa detail dan konfirmasi transfer'
                    ].join('\n'),
                    inline: false
                  },
                  {
                    name: '⚠️ **Penting**',
                    value: '• Pastikan nomor tujuan sudah benar\n• Periksa saldo sebelum transfer\n• Simpan bukti transfer\n• Konfirmasi ke penjual setelah transfer',
                    inline: false
                  }
                )
                .setFooter({
                  text: 'Transfer berlaku 24 jam • Tekan tombol untuk kembali ke menu utama',
                  iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

              const backButton = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId('payment_back')
                    .setLabel('← Kembali ke Menu')
                    .setEmoji('🔙')
                    .setStyle(ButtonStyle.Secondary)
                );

              await buttonInteraction.editReply({
                embeds: [paymentEmbed],
                components: [backButton]
              });
            }

          } catch (error) {
            console.error('Error showing payment method:', error);
            await buttonInteraction.followUp({
              content: '❌ Terjadi error saat menampilkan metode pembayaran!',
              ephemeral: true
            });
          }
        });

        collector.on('end', async () => {
          try {
            const disabledRow1 = new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                ...row1.components.map(button => 
                  ButtonBuilder.from(button).setDisabled(true)
                )
              );
            
            const disabledRow2 = new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                ...row2.components.map(button => 
                  ButtonBuilder.from(button).setDisabled(true)
                )
              );

            await interaction.editReply({
              components: [disabledRow1, disabledRow2]
            });
          } catch (error) {
            // Message might be deleted, ignore error
          }
        });
      }

    } catch (error) {
      console.error('Error in payment command:', error);
      
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ Terjadi error saat memuat metode pembayaran!'
        });
      } else {
        await interaction.reply({
          content: '❌ Terjadi error saat memuat metode pembayaran!',
          ephemeral: true
        });
      }
    }
  },
};

export default command;