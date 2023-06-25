const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('connect')
        .setDescription('Connect to a specified server!')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message you want to send')),
    async execute(interaction) {
        await interaction.reply('hi');
    },
};
