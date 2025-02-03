import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
import { loadCommands } from './handlers/commandHandler';
import { Command } from './types';
import { loadButtonHandler } from './handlers/buttonHandler';
import { loadMessageHandler } from './handlers/messageHandler';

const { GoogleGenerativeAI } = require("@google/generative-ai");

config();

// process.env.GROQ_API_KEY
declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, Command>;
    enabledChannels: Collection<string, boolean>;
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.enabledChannels = new Collection();

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});




client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error executing this command!',
      ephemeral: true,
    });
  }
});



const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!client.enabledChannels.has(message.channelId)) return;

  try {
    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: "You are a helpful assistant" }]
            }
        ]
    });

    const result = await chat.sendMessage(message.content);
    const response = await result.response;
    const reply = response.text();

    if (reply) {
        const maxLength = 2000;
        let startIndex = 0;
        while (startIndex < reply.length) {
            const endIndex = Math.min(startIndex + maxLength, reply.length);
            const part = reply.substring(startIndex, endIndex);
            await message.channel.send(part);
            startIndex = endIndex;
        }
    } else {
        console.error('Reply is null');
    }
  } catch (error) {
    console.error('Error:', error);
  }
});

loadCommands(client);
loadButtonHandler(client);
loadMessageHandler(client);

client.login(process.env.DISCORD_TOKEN);
