import { Client } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { Command } from '../types';

export async function loadCommands(client: Client) {
    const commandsPath = join(__dirname, '../commands');
    const commandFiles = readdirSync(commandsPath).filter(file =>
        file.endsWith('.ts') || file.endsWith('.js')
    );

    for (const file of commandFiles) {
        console.log(`Loading command: ${file}`);
        const filePath = join(commandsPath, file);
        const commandModule = require(filePath);
        const command: Command = commandModule.default || commandModule;

        if (command && command.data && typeof command.execute === 'function') {
            client.commands.set(command.data.name, command);
            console.log(`Successfully loaded command: ${command.data.name}`);
        } else {
            console.warn(`Command file ${file} is not exporting a valid command object.`);
        }
    }
}
