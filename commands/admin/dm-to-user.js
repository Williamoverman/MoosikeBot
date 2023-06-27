const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql');

const allowedUserIDs = ['307079375990423554'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('DM to specific user!')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('The user u want to send to (ID)'))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message u want to send')),
    async execute(interaction) {
        await interaction.reply({ content: '...', ephemeral: true });

        if (allowedUserIDs.includes(interaction.user.id)) {
            const givenID = interaction.options.getString('id') ?? '307079375990423554';
            const givenMessage = interaction.options.getString('message') ?? 'Hi.';
            interaction.users.send(givenID, givenMessage);
            setTimeout(() => {
                return interaction.deleteReply();
            }, 5000);
        } else {
            await interaction.editReply('You do not have the required role to use this command.');
            setTimeout(() => {
                return interaction.deleteReply();
            }, 5000);
        }
    },
};