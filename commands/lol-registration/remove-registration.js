const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql');
require("dotenv").config();

module.exports = {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('unregister')
    .setDescription('Unregister your LoL account!'),
  async execute(interaction) {
    try {
      var response = await interaction.reply({ content: '...', components: [], ephemeral: true });

      const logEmbed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`The executed command name: ${interaction.commandName}`)
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL() })
      .setTimestamp()
      
      const channelName = 'logs';
  
      const guild = interaction.guild;
      const channel = guild.channels.cache.find(ch => ch.name === channelName);
  
      if (!channel) {
        console.log(`Channel "${channelName}" not found.`);
      }
  
      channel.send(logEmbed);
      
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

      let connectionClosed = false; // Flag to track if the connection is closed

      const searchForUsersQuery = 'SELECT * FROM LoLregistration WHERE discordID = ?';

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
            interaction.editReply({ content: 'Something went wrong with the query.', embeds: [], components: [] });
            connection.end(); // Close connection on error
            return;
          }
          if (results.length === 0) {
            console.log("Connection closed.");
            connection.end();
            connectionClosed = true; // Set the flag to true
            interaction.editReply({ content: 'Not yet registered.', embeds: [], components: [] });
          } else {
            response = interaction.editReply({
              content: 'Click on \'Unregister\' To unregister and \'Cancel\' to cancel the command.',
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
            connection.query(searchForUsersQuery, [discordUserID], (err, results1) => {
              if (err) {
                console.error('Error executing query:', err);
                interaction.editReply({ content: 'Something went wrong with the query.', components: [] });
                connection.end(); // Close connection on error
                return;
              }
              if (results1.length === 0) {
                interaction.editReply({ content: 'Already unregistered.', components: [] });
                console.log("Connection closed.");
                connection.end();
                setTimeout(() => {
                  return interaction.deleteReply();
                }, 5000);
              } else {
                const deleteRegistrationQuery = "DELETE FROM LoLregistration WHERE discordID = ?"
                connection.query(deleteRegistrationQuery, [discordUserID], (err, results2) => {
                  if (err) {
                    console.error('Error executing query:', err);
                    interaction.editReply({ content: 'Something went wrong with the query.', components: [] });
                    connection.end(); // Close connection on error
                    return;
                  } 
                    interaction.editReply({ content: 'Successfully unregistered', components: [] });
                    console.log("Connection closed.");
                    connection.end();
                    setTimeout(() => {
                      return interaction.deleteReply();
                    }, 5000);
                });
              }
            });
          } else if (confirmation.customId === 'cancel') {
            console.log("Connection closed.");
            connection.end();
            interaction.deleteReply();
          }
        })
        .catch(e => {
          interaction.editReply({ content: 'Deleting message...', components: [] });
          if (!connectionClosed) { // Check the flag before closing the connection
            connection.end();
            console.log("Connection closed.");
          }// Close connection on error
          setTimeout(() => {
            interaction.deleteReply();
          }, 5000);
        });
    } catch (error) {
      if (error.code === 10008) {
        console.error('The message could not be found or identified.');
      } else {
        console.error(error);
      }
    }
  }
};