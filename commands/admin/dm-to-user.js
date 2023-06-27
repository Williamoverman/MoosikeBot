const { SlashCommandBuilder } = require('discord.js');

const allowedUserIDs = ['307079375990423554'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('DM to specific user!')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('The user you want to send to (ID)'))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message you want to send')),
    async execute(interaction) {
        await interaction.reply({ content: '...', ephemeral: true });

        if (allowedUserIDs.includes(interaction.user.id)) {
            const givenID = interaction.options.getString('id') ?? '307079375990423554';
            const givenMessage = interaction.options.getString('message') ?? 'Hi.';
            const client = interaction.client;
            const user = await client.users.fetch(givenID);

            user.send(givenMessage).then(dm => {
                const filter = (response) => response.author.id === givenID;
                const collector = dm.channel.createMessageCollector(filter, { time: 60000 });

                collector.on('collect', (collected) => {
                    interaction.editReply(`Collected message: ${collected.content}`);
                });

                collector.on('end', (collected) => {
                    interaction.editReply(`Collector ended. Collected ${collected.size} messages.`);
                });
            }).catch(err => {
                console.error(`Failed to send DM: ${err}`);
            });
        } else {
            await interaction.editReply('You do not have the required role to use this command.');
            setTimeout(() => {
                return interaction.deleteReply();
            }, 5000);
        }
    },
};
