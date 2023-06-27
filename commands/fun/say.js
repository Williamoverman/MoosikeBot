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

		collector.on('collect', m => {
			console.log(`Collected ${m.content}`);
		});
		
		collector.on('end', collected => {
			interaction.user.send(collected.content);
		});

		await interaction.reply(userInteraction);
	},
};