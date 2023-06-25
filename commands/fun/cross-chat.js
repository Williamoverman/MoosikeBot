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
        const messageContent = interaction.options.getString('message');

        const targetServerId = 1121419451775078581;

        const targetServer = client.guilds.cache.get(targetServerId);
        if (!targetServer) {
            await interaction.reply('Invalid target server ID.');
            return;
        }

        const targetChannel = targetServer.channels.cache.find(channel => channel.name === 'cross-server-chat' && channel.type === 'GUILD_TEXT');
        if (!targetChannel) {
            await interaction.reply('No "cross-server-chat" channel found in the target server.');
            return;
        }

        await targetChannel.send(messageContent);
        await interaction.reply('Message sent successfully!');
	},
};
