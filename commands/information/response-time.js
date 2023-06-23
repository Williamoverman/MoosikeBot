const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ms')
    .setDescription('Check the bot\'s response time'),
  async execute(interaction) {
    await interaction.deferReply();

    const ping = Math.round(interaction.client.ws.ping);
    await interaction.editReply(`Pong! Bot response time: ${ping}ms`);
  },
};