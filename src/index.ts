import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
import { loadCommands } from './handlers/commandHandler';
import { Command } from './types';
import Groq from 'groq-sdk';

config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!client.enabledChannels.has(message.channelId)) return;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: message.content },
      ],
      model: 'llama-3.3-70b-versatile',
    });

    const reply = completion.choices[0]?.message?.content;
    if (reply) {
      await message.channel.send(reply);
    } else {
      console.error('Reply is null');
    }
  } catch (error) {
    console.error(error);
    await message.channel.send('Sorry, I encountered an error while processing your message.');
  }
});

loadCommands(client);

client.login(process.env.DISCORD_TOKEN);
