const { GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const path = require('path');

const index = require(path.join(__dirname, '../../index'));

const client = index.client;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('connect')
        .setDescription('Connect to a specified server!')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message you want to send')),
    async execute(interaction) {
        await client.guilds.fetch();

        const guilds = client.guilds.cache;

        guilds.forEach((guild) => {
            console.log(`Guild Name: ${guild.name}`);
            console.log(`Guild ID: ${guild.id}`);
        });
        
        await interaction.reply('hi');
    },
};
