const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Let the bot say anything!')
        .addStringOption(option =>
            option.setName('userinput')
              .setDescription('Whatever you want the bot to say!')),
	async execute(interaction) {
        let userInteraction = interaction.options.getString('userinput') ?? 'No input given.';
		await interaction.reply(userInteraction);
	},
};