const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ]
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('connect')
        .setDescription('Connect to a specified server!')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message you want to send')),
    async execute(interaction) {
        const guilds = client.guilds.cache;

        //check guilds
        guilds.forEach((guild) => {
            console.log(`Guild Name: ${guild.name}`);
            console.log(`Guild ID: ${guild.id}`);
        });
        await interaction.reply('hi');
    },
};
