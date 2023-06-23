const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ms')
    .setDescription('Check the bot\'s response time'),
  async execute(interaction) {
    const ping = Math.round(interaction.client.ws.ping);
    await interaction.reply(`My response time is ${ping}ms`);
  },
};