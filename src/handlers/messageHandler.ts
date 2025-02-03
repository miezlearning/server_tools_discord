import { Client, Message, TextChannel } from 'discord.js';
import { Command, Handlers, ManagedMessage } from '../types';
import fs from 'fs';

const managedMessagesFile = './managedMessages.json';

export const loadMessageHandler: Handlers['loadMessageHandler'] = async (client) => {
  // Load managed messages from file
  let managedMessages: ManagedMessage[] = loadManagedMessages();

  client.on('ready', async () => {
    console.log('Fetching and updating managed messages...');
    if (managedMessages && managedMessages.length > 0) { // Periksa apakah managedMessages ada dan tidak kosong
      for (const managedMessage of managedMessages) {
        const command: Command | undefined = client.commands.get(managedMessage.commandName);
        if (command && command.managedMessage) {
          const channel = client.channels.cache.get(managedMessage.channelId) as TextChannel;
          if (channel) {
            try {
              let message;
              if (managedMessage.messageId) {
                message = await channel.messages.fetch(managedMessage.messageId);
                await message.edit({
                  content: command.managedMessage.content,
                  embeds: command.managedMessage.embeds,
                  components: command.managedMessage.components,
                });
              } else {
                message = await channel.send({
                  content: command.managedMessage.content,
                  embeds: command.managedMessage.embeds,
                  components: command.managedMessage.components,
                });
                managedMessage.messageId = message.id;
                saveManagedMessages(managedMessages);
              }
              command.managedMessage.onUpdate(message);
            } catch (error) {
              console.error(
                `Error fetching or updating managed message for command ${command.data.name}:`,
                error
              );
            }
          }
        }
      }
    }
    console.log('Managed messages updated.');
  });

  // Save managed messages to file whenever a new message is added or an existing one is updated
  client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) {
      const commandName = getCommandNameFromMessage(message);
      if (commandName) {
        const command: Command | undefined = client.commands.get(commandName);
        if (command && command.managedMessage && message.channelId === command.managedMessage.channelId) {
          const existingMessageIndex = managedMessages.findIndex(
            (mm) => mm.commandName === commandName && mm.channelId === message.channelId
          );
          if (existingMessageIndex !== -1) {
            managedMessages[existingMessageIndex].messageId = message.id;
          } else {
            managedMessages.push({
              commandName,
              channelId: message.channelId,
              messageId: message.id,
            });
          }
          saveManagedMessages(managedMessages);
          command.managedMessage.onUpdate(message);
        }
      }
    }
  });

  // Helper functions
  function loadManagedMessages(): ManagedMessage[] {
    try {
      // Pastikan file ada, buat file kosong jika belum ada
      if (!fs.existsSync(managedMessagesFile)) {
        fs.writeFileSync(managedMessagesFile, '[]');
      }

      const data = fs.readFileSync(managedMessagesFile, 'utf-8');
      const parsedData = JSON.parse(data);

      // Validasi apakah data yang diparse adalah array
      if (Array.isArray(parsedData)) {
        return parsedData;
      } else {
        console.error('Invalid managed messages format. Returning an empty array.');
        return [];
      }
    } catch (error) {
      console.error('Error loading managed messages from file:', error);
      return []; // Kembalikan array kosong jika terjadi error
    }
  }

  function saveManagedMessages(messages: ManagedMessage[]) {
    try {
      fs.writeFileSync(managedMessagesFile, JSON.stringify(messages, null, 2));
    } catch (error) {
      console.error('Error saving managed messages to file:', error);
    }
  }

  function getCommandNameFromMessage(message: any): string | null {
    // Implement logic to extract command name from message
    // This is highly dependent on your specific implementation
    // For example, you might check the message content or embeds
    return message.content.startsWith('Status toko') ? 'shopstatus' : null;
  }
};