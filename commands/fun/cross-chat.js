const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('connect')
		.setDescription('Connect to a specified server!'),
	async execute(interaction) {
        bot.guilds.cache.forEach(guild => {
            interaction.reply("hi");
        });
	},
};