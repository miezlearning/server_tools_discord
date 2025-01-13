import { ChatInputCommandInteraction, ButtonInteraction } from 'discord.js';

export interface Command {
    data: any;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface ButtonData {
    messageId: string;
    embed: any;
    components: any[];
}