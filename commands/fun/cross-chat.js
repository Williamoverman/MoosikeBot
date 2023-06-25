const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('connect')
		.setDescription('Connect to a specified server!'),
	async execute(interaction) {
        const guilds = client.guilds.cache;
        const sendingGuild = message.guild;
        const sendingChannel = message.channel;

        guilds.forEach((guild) => {
            if (guild !== sendingGuild) {
                const targetChannel = guild.channels.cache.find((channel) => channel.name === 'cross-server-chat');
                if (targetChannel) {
                targetChannel.send(`[Cross-Server Chat] ${message.author.username}: ${chatMessage}`);
                }
            }
        });
	},
};