const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Let the bot say anything!')
        .addStringOption(option =>
            option.setName('userinput')
              .setDescription('Whatever you want the bot to say!')),
	async execute(interaction) {
        let userInteraction = interaction.options.getString('userinput') ?? 'No input given.';
		const logEmbed = new EmbedBuilder()
		.setColor(0x0099FF)
		.setTitle(`The executed command name: ${interaction.commandName}`)
		.setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL() })
		.setTimestamp()
		
		const channelName = 'logs';
	
		const guild = interaction.guild;
		const channel = guild.channels.cache.find(ch => ch.name === channelName);
	
		if (!channel) {
		  console.log(`Channel "${channelName}" not found.`);
		}
	
		channel.send(logEmbed);
		await interaction.reply(userInteraction);
	},
};