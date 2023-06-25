const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
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
        const Guilds = client.guilds.cache.map(guild => guild.id);
        console.log(Guilds);
        const messageContent = interaction.options.getString('message');

        // Get the target server's ID
        const targetServerId = interaction.guild.id;

        // Check if the target server is cached
        const targetServer = client.guilds.cache.get(targetServerId);
        if (!targetServer) {
            console.log(`Target server (${targetServerId}) is not cached.`);
            console.log('Cached guilds:', client.guilds.cache);
            await interaction.reply('Invalid target server ID.');
            return;
        }

        // Find the "cross-server-chat" channel in the target server
        const targetChannel = targetServer.channels.cache.find(channel => channel.name === 'cross-server-chat' && channel.type === 'GUILD_TEXT');
        if (!targetChannel) {
            await interaction.reply('No "cross-server-chat" channel found in the target server.');
            return;
        }

        // Send the message to the target channel
        await targetChannel.send(messageContent);
        await interaction.reply('Message sent successfully!');
    },
};
