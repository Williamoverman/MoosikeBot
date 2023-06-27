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
		interaction.user.send('hou je bek dikzak');
		const collector = interaction.channel.createMessageCollector({ time: 15000 });

		collector.on('collect', (collectedMessage) => {
			console.log(collectedMessage);
			interaction.user.send(collectedMessage.content);
		});
		
		collector.on('end', (collected) => {
			interaction.user.send('doei!!!!!!');
		});
		
		await interaction.reply(userInteraction);
	},
};