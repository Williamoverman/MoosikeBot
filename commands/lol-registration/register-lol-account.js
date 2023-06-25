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
    try {
      var response = await interaction.reply({ content: '...', embeds: [], components: [], ephemeral: true });

      var leagueUsername = interaction.options.getString('username');
      const apiLink = `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${leagueUsername}?api_key=${process.env.LOLAPITOKEN}`;
  
      fetch(apiLink)
        .then(apiresponse => {
          if (!apiresponse.ok) {

            throw new Error('API request failed');
          }
          return apiresponse.json();
        })
        .then(data => {
          leagueUsername = data.name;
  
          const lolEmbed = new EmbedBuilder().setColor(0x0099FF).setDescription('To confirm this is your LoL account, change your profile picture in LoL to this picture').setImage('http://ddragon.leagueoflegends.com/cdn/10.18.1/img/profileicon/1.png');
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
  
          let connectionClosed = false; // Flag to track if the connection is closed
  
          connection.connect(err => {
            if (err) {
              console.error(err);
              interaction.editReply({ content: 'Something went wrong with the database connection :(', embeds: [], components: [] });
              return;
            }
            console.log('Connected to the database!');
  
            const searchForUsersQuery = 'SELECT * FROM LoLregistration WHERE discordID = ?';
            connection.query(searchForUsersQuery, [discordUserID], (err, results) => {
              if (err) {
                console.error('Error executing query:', err);
                return interaction.editReply({ content: 'Something went wrong with the query.', embeds: [], components: [] });
              }
              if (results.length !== 0) {
                connection.end();
                console.log("Connection closed.");
                connectionClosed = true; // Set the flag to true
                interaction.editReply({ content: 'Already registered.', embeds: [], components: [] });
              } else {
                response = interaction.editReply({
                  content: '',
                  embeds: [lolEmbed],
                  components: [row],
                });
              }
            });
          });
  
          const collectorFilter = i => i.user.id === interaction.user.id;
  
          response.awaitMessageComponent({ filter: collectorFilter, time: 90_000 })
            .then(async confirmation => {
              if (confirmation.customId === 'ready') {
                await confirmation.update({ content: `...`, components: [] });
                fetch(apiLink)
                .then(apiresponse2 => {
                  if (!apiresponse2.ok) {
                    throw new Error('API request failed');
                  }
                  return apiresponse2.json();
                })
                .then(data1 => {
                  if (data1.profileIconId === 1) {
                    const userData = { discordID: discordUserID, usernameLoL: leagueUsername };
                    const insertUserQuery = 'INSERT INTO LoLregistration SET ?';
                    connection.query(insertUserQuery, userData, (err, result) => {
                      if (err) {
                        console.error('Error inserting data:', err);
                        interaction.editReply({ content: 'Something went wrong with registering :(', embeds: [], components: [] });
                        setTimeout(() => {
                          return interaction.deleteReply();
                        }, 5000);
                      } else {
                        console.log('Data inserted successfully!');
                        interaction.editReply({ content: 'Thank you for registering! :)', embeds: [], components: [] });
                        setTimeout(() => {
                          return interaction.deleteReply();
                        }, 5000);
                      }
                      if (!connectionClosed) { // Check the flag before closing the connection
                        connection.end();
                        console.log("Connection closed.");
                      }
                    });
                  } else {
                    interaction.editReply({ content: 'Incorrect profile picture.', embeds: [], components: [] });
                    if (!connectionClosed) { // Check the flag before closing the connection
                      connection.end();
                      console.log("Connection closed.");
                      setTimeout(() => {
                        return interaction.deleteReply();
                      }, 5000);
                    }
                  }
                }).catch(error => {
                  console.error(error);
                });
              }
            })
            .catch(e => {
              interaction.editReply({ content: 'Deleting message..', embeds: [], components: [] });
              if (!connectionClosed) { // Check the flag before closing the connection
                connection.end();
                console.log("Connection closed.");
              }
              setTimeout(() => {
                interaction.deleteReply();
              }, 5000);
            });
        })
        .catch(error => {
          console.error(error);
          interaction.editReply({ content: 'No summoner found.', embeds: [], components: [] });
          setTimeout(() => {
            return interaction.deleteReply();
          }, 5000);
        });
    } catch (error) {
      if (error.code === 10008) {
        /*if (!connectionClosed) { // Check the flag before closing the connection
          connection.end();
          console.log("Connection closed.");
        }*/
        console.error('The message could not be found or identified.');
        /*interaction.editReply({ content: 'No response. Deleting message.', embeds: [], components: [] });
          setTimeout(() => {
            return interaction.deleteReply();
          }, 5000);*/
      } else {
        console.error(error);
      }
    }
  },
};