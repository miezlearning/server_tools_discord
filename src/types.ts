import {
    SlashCommandBuilder,
    CommandInteraction,
    ButtonInteraction,
    ModalSubmitInteraction,
    ChatInputCommandInteraction,
    Message,
    TextChannel,
  } from 'discord.js';
export interface Command {
    data: any;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    handleButton?: (interaction: ButtonInteraction) => Promise<void>;
    handleModal?: (interaction: ModalSubmitInteraction) => Promise<void>;
    managedMessage?: {
        channelId: string;
        messageId?: string;
        content: string;
        embeds: any[];
        components: any[];
        onUpdate: (message: Message) => void;
      };
}


export interface ManagedMessage {
    commandName: string;
    channelId: string;
    messageId?: string;
  }
  

export interface ButtonData {
    messageId: string;
    embed: any;
    components: any[];
}

export interface Handlers {
    loadButtonHandler: (client: any) => Promise<void>;
    loadMessageHandler: (client: any) => Promise<void>;
  }