const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ms')
    .setDescription('Check the bot\'s response time'),
  async execute(interaction) {
    await interaction.deferReply();

    
    await interaction.editReply(`My response time is: ${Math.round(interaction.client.ws.ping)}ms`);
  },
};