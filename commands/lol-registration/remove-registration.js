const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql');
const fetch = require('isomorphic-fetch');
require("dotenv").config();

module.exports = {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('unregister')
    .setDescription('Unregister your LoL account!'),
  async execute(interaction) {
    try {
        var response = await interaction.reply({ content: '', components: [], ephemeral: true });
        const discordUserID = interaction.user.id;
  
        const unregister = new ButtonBuilder()
            .setCustomId('unregister')
            .setLabel('Unregister')
            .setStyle(ButtonStyle.Primary);
  
        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder()
            .addComponents(unregister, cancel);
  
        const connection = mysql.createConnection({
            host: process.env.DATABASEHOST,
            user: process.env.DATABASEUSER,
            password: process.env.DATABASEPASSWORD,
            database: process.env.DATABASENAME
        });

          const searchForUsersQuery = 'SELECT * FROM LoLregistration WHERE discordID = ?';

          let connectionClosed = false; // Flag to track if the connection is closed
  
          connection.connect(err => {
            if (err) {
              console.error(err);
              interaction.editReply({ content: 'Something went wrong with the database connection :(', embeds: [], components: [] });
              return;
            }
            console.log('Connected to the database!');
  
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
                  components: [row],
                });
              }
            });
          });
  
          const collectorFilter = i => i.user.id === interaction.user.id;
  
          response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 })
            .then(async confirmation => {
              if (confirmation.customId === 'unregister') {
                await confirmation.update({ content: `...`, components: [] });
                const deleteRegistrationQuery = "DELETE FROM LoLregistration WHERE discordID = ?"
                    connection.query(deleteRegistrationQuery, [discordUserID], (err, results) => {
                    if (err) {
                      console.error('Error executing query:', err);
                      return interaction.editReply({ content: 'Something went wrong with the query.', components: [] });
                    }
                    if (results.length !== 0) {
                      interaction.editReply({ content: 'Already unregistered.', components: [] });
                      if (!connectionClosed) { // Check the flag before closing the connection
                        connection.end();
                        console.log("Connection closed.");
                      }
                      setTimeout(() => {
                        return interaction.deleteReply();
                      }, 5000);
                    } else {
                        interaction.editReply({ content: 'Succesfully unregistered.', components: [] });
                        if (!connectionClosed) { // Check the flag before closing the connection
                          connection.end();
                          console.log("Connection closed.");
                        }
                        setTimeout(() => {
                          return interaction.deleteReply();
                        }, 5000);
                    }
                });
              } else if (confirmation.customId === 'cancel') {
                interaction.editReply({ content: 'Cancelling...', components: [] });
                if (!connectionClosed) { // Check the flag before closing the connection
                    connection.end();
                    console.log("Connection closed.");
                }
                setTimeout(() => {
                    return interaction.deleteReply();
                }, 2000);
              }
            })
            .catch(e => {
              interaction.editReply({ content: 'Deleting message..', components: [] });
              if (!connectionClosed) { // Check the flag before closing the connection
                connection.end();
                console.log("Connection closed.");
              }
              setTimeout(() => {
                interaction.deleteReply();
              }, 5000);
            });
        }
        catch (error) {
            if (error.code === 10008) {
              console.error('The message could not be found or identified.');
            } else {
              console.error(error);
            }
          }
    }
};