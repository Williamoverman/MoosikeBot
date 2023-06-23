const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql');
const fetch = require('isomorphic-fetch');
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
    
    const lolEmbed = new EmbedBuilder().setColor(0x0099FF).setDescription('To confirm this is your LoL account change your profile picture in LoL to this picture').setImage('http://ddragon.leagueoflegends.com/cdn/10.18.1/img/profileicon/1.png');
    const discordUserID = interaction.user.id;

    const ready = new ButtonBuilder()
			.setCustomId('ready')
			.setLabel('Ready')
			.setStyle(ButtonStyle.Primary);

		const row = new ActionRowBuilder()
			.addComponents(ready);

    const connection = mysql.createConnection({
      host: process.env.DATABASEHOST,
      user: process.env.DATABASEUSER,
      password: process.env.DATABASEPASSWORD,
      database: process.env.DATABASENAME
    });

    connection.connect(err => {
      console.log('Connected to database!');
    
      const searchForUsersQuery = 'SELECT * FROM LoLregistration WHERE discordID = ?';
      connection.query(searchForUsersQuery, [discordUserID], (err, results) => {
        if (err) {
          console.error('Error executing query:', err);
          return;
        }
        if (results.length != 0) {
          interaction.editReply({ content: 'Already registered.', embeds: [], components: []});
        } 
      });  
    })

    const response = await interaction.reply({
      embeds: [lolEmbed],
			components: [row],
      ephemeral: true,
		});
    
    const collectorFilter = i => i.user.id === interaction.user.id;

    try {
      const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 180_000 });

      if (confirmation.customId === 'ready') {
        await confirmation.update({ content: `...`, components: [] });
      } 
    } catch (e) {
      await interaction.editReply({ content: 'Confirmation not received within 3 minutes, cancelling...', embeds: [], components: []});
      return;
    }

    const leagueUsername = interaction.options.getString('username');

    const apiLink = `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${leagueUsername}?api_key=${process.env.LOLAPITOKEN}`

    fetch(apiLink)
    .then(response => {
      if (!response.ok) {
        throw new Error('API request failed');
      }
      return response.json();
    })
    .then(data => {
      const profileIconId = data.profileIconId;
      if (profileIconId == 1) {
        const userData = { discordID: discordUserID, usernameLoL: leagueUsername };
            const insertUserQuery = 'INSERT INTO LoLregistration SET ?'
            connection.query(insertUserQuery, userData, (err, result) => {
              if (err) {
                console.error('Error inserting data:', err);
                interaction.editReply({ content: 'Something went wrong with registering :(', embeds: [], components: []});
              } else {
                console.log('Data inserted successfully!');
                interaction.editReply({ content: 'Thank you for registering! :)', embeds: [], components: []});
              }
            });
            connection.end();
      } else {
        interaction.editReply({ content: 'Incorrect profile picture.', embeds: [], components: []});
      }
    })
    .catch(error => {
      console.error(error);
      interaction.editReply({ content: 'Something went wrong with the API.', embeds: [], components: []});
    });
  },
};