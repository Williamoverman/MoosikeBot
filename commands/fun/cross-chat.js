const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

module.exports = {
	data: new SlashCommandBuilder()
		.setName('connect')
		.setDescription('Connect to a specified server!')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message you want to send')),
	async execute(interaction) {
		const guilds = client.guilds.cache;
		const sendingGuild = interaction.guild;
		const sendingChannel = interaction.channel;

		const chatMessage = interaction.options.getString('message'); // Assuming you have a string option named 'message'

		guilds.forEach((guild) => {
			if (guild !== sendingGuild) {
				const targetChannel = guild.channels.cache.find((channel) => channel.name === 'cross-server-chat');
				if (targetChannel) {
					targetChannel.send(`[Cross-Server Chat] ${interaction.user.username}: ${chatMessage}`);
				}
			}
		});
	},
};
