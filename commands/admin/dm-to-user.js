const { SlashCommandBuilder } = require('discord.js');

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
            const client = interaction.client;
            client.users.send(givenID, givenMessage).catch(error => {
                console.log(error)
            }) 
        } else {
            await interaction.editReply('You do not have the required role to use this command.');
            setTimeout(() => {
                return interaction.deleteReply();
            }, 5000);
        }
    },
};