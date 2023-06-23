const { SlashCommandBuilder } = require('discord.js');
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
    const connection = mysql.createConnection({
      host: process.env.DATABASEHOST,
      user: process.env.DATABASEUSER,
      password: process.env.DATABASEPASSWORD,
      database: process.env.DATABASENAME
    });

    connection.connect(err => {
      if (err) {
        console.error('Error connecting to database:', err);
        interaction.reply({ content: 'Something went wrong with registering :(', ephemeral: true });
      } else {
        console.log('Connected to database!');

        const leagueUsername = interaction.options.getString('username');
        const discordUserID = interaction.user.id;

        const userData = { discordID: discordUserID, usernameLoL: leagueUsername };
        connection.query('INSERT INTO LoLregistration SET ?', userData, (err, result) => {
          if (err) {
            console.error('Error inserting data:', err);
            interaction.reply({ content: 'Something went wrong with registering :(', ephemeral: true });
          } else {
            console.log('Data inserted successfully!');
            interaction.reply({ content: 'Thank you for registering! !!!!! :)', ephemeral: false });
          }
        });
      }
    });
  },
};
