const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ms')
    .setDescription('Check the bot\'s response time'),
  async execute(interaction) {
    await interaction.reply(`Latency is ${Date.now() - interaction.createdTimestamp}ms. Bot Latency is ${Math.round(client.ws.ping)}ms`);
  },
};