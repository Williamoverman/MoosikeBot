const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Let the bot say anything!')
        .addStringOption(option =>
            option.setName('userinput')
              .setDescription('Whatever you want the bot to say!')),
	async execute(interaction) {
		const channelName = 'logs';
  
      const guild = interaction.guild;
      const channel = guild.channels.cache.find(ch => ch.name === channelName);
  
      if (!channel) {
        console.log(`Channel "${channelName}" not found.`);
      }
  
      channel.send('wtf');
        let userInteraction = interaction.options.getString('userinput') ?? 'No input given.';
		await interaction.reply(userInteraction);
	},
};