// src/deploy-commands.ts
import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { join } from 'path';

config();

async function deployCommands() {
  try {
    const commands = [];
    const commandsPath = join(__dirname, 'commands');
    const commandFiles = readdirSync(commandsPath).filter(file => 
      file.endsWith('.ts') || file.endsWith('.js')
    );

    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      const commandModule = await import(filePath);
      
      // Handle both default and named exports
      const command = commandModule.default || commandModule;
      
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`Loaded command: ${command.data.name}`);
      } else {
        console.log(`[WARNING] Command at ${filePath} is missing required "data" or "execute" property`);
      }
    }

    if (!process.env.DISCORD_TOKEN) {
      throw new Error('DISCORD_TOKEN is not defined in the environment variables');
    }
    if (!process.env.CLIENT_ID) {
      throw new Error('CLIENT_ID is not defined in the environment variables');
    }
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error during command deployment:', error);
  }
}

deployCommands();