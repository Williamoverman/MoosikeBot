const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql');
require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register your LoL account!')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Your LoL username!')
        .setRequired(true)),
  async execute(interaction) {

    const lolEmbed = new EmbedBuilder().setColor(0x0099FF).setDescription('To confirm this is your league account change your profile picture in league to this picture').setImage('http://ddragon.leagueoflegends.com/cdn/10.18.1/img/profileicon/1.png');

    const ready = new ButtonBuilder()
			.setCustomId('ready')
			.setLabel('Ready')
			.setStyle(ButtonStyle.Primary);

		const row = new ActionRowBuilder()
			.addComponents(ready);

		const response = await interaction.reply({
      embeds: [lolEmbed],
			components: [row],
		});

    const collectorFilter = i => i.user.id === interaction.user.id;

    try {
      const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

      if (confirmation.customId === 'ready') {
        await confirmation.update({ content: `ready`, components: [] });
      } 
    } catch (e) {
      await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
      return;
    }

    const connection = mysql.createConnection({
      host: process.env.DATABASEHOST,
      user: process.env.DATABASEUSER,
      password: process.env.DATABASEPASSWORD,
      database: process.env.DATABASENAME
    });

    connection.connect(err => {
      if (err) {
        console.error('Error connecting to database:', err);
        interaction.editReply({ content: 'Something went wrong with connecting to the database :(', ephemeral: true });
      } else {
        console.log('Connected to database!');

        const leagueUsername = interaction.options.getString('username');
        const discordUserID = interaction.user.id;

        const searchForUsersQuery = 'SELECT * FROM LoLregistration WHERE discordID = ?';
        connection.query(searchForUsersQuery, [discordUserID], (err, results) => {
          if (err) {
            console.error('Error executing query:', err);
            return;
          }
          if (results.length === 0) {
            const userData = { discordID: discordUserID, usernameLoL: leagueUsername };
            const insertUserQuery = 'INSERT INTO LoLregistration SET ?'
            connection.query(insertUserQuery, userData, (err, result) => {
              if (err) {
                console.error('Error inserting data:', err);
                interaction.editReply({ content: 'Something went wrong with registering :(', ephemeral: true });
              } else {
                console.log('Data inserted successfully!');
                interaction.editReply({ content: 'Thank you for registering! :)', ephemeral: false });
              }
            });
          } else {
            interaction.editReply({ content: 'Already registered.', ephemeral: true });
          }
          connection.end();
        });
      }
    });
  },
};