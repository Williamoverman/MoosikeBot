const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql');
const fetch = require('isomorphic-fetch');
require('dotenv').config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.MESSAGE_CONTENTS] });

client.once('ready', () => {
  console.log('Bot is ready!');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, user, reply } = interaction;
  if (commandName === 'register') {
    const leagueUsername = options.getString('username');

    try {
      const apiLink = `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${leagueUsername}?api_key=${process.env.LOLAPITOKEN}`;

      const apiResponse = await fetch(apiLink);
      if (!apiResponse.ok) {
        throw new Error('API request failed');
      }
      const data = await apiResponse.json();
      const leagueUsername = data.name;

      const lolEmbed = new MessageEmbed()
        .setColor('#0099FF')
        .setDescription('To confirm this is your LoL account, change your profile picture in LoL to this picture')
        .setImage('http://ddragon.leagueoflegends.com/cdn/10.18.1/img/profileicon/1.png');
      const discordUserID = user.id;

      const readyButton = new MessageButton()
        .setCustomId('ready')
        .setLabel('Ready')
        .setStyle('PRIMARY');

      const row = new MessageActionRow()
        .addComponents(readyButton);

      const connection = mysql.createConnection({
        host: process.env.DATABASEHOST,
        user: process.env.DATABASEUSER,
        password: process.env.DATABASEPASSWORD,
        database: process.env.DATABASENAME,
      });

      connection.connect((err) => {
        if (err) {
          console.error(err);
          reply({ content: 'Something went wrong with the database connection :(', ephemeral: true });
          return;
        }
        console.log('Connected to the database!');

        const searchForUsersQuery = 'SELECT * FROM LoLregistration WHERE discordID = ?';
        connection.query(searchForUsersQuery, [discordUserID], (err, results) => {
          if (err) {
            console.error('Error executing query:', err);
            return reply({ content: 'Something went wrong with the query.', ephemeral: true });
          }
          if (results.length !== 0) {
            connection.end();
            console.log('Connection closed.');
            reply({ content: 'Already registered.', ephemeral: true });
            setTimeout(() => {
              interaction.deleteReply();
            }, 5000);
          } else {
            reply({ embeds: [lolEmbed], components: [row] });
          }
        });
      });

      const collectorFilter = (i) => i.user.id === user.id;

      interaction.awaitMessageComponent({ filter: collectorFilter, time: 90000 })
        .then(async (confirmation) => {
          if (confirmation.customId === 'ready') {
            await confirmation.update({ content: '...', components: [] });

            const apiResponse2 = await fetch(apiLink);
            if (!apiResponse2.ok) {
              throw new Error('API request failed');
            }
            const data1 = await apiResponse2.json();

            if (data1.profileIconId === 1) {
              const userData = { discordID: discordUserID, usernameLoL: leagueUsername };
              const insertUserQuery = 'INSERT INTO LoLregistration SET ?';
              connection.query(insertUserQuery, userData, (err, result) => {
                if (err) {
                  console.error('Error inserting data:', err);
                  reply({ content: 'Something went wrong with registering :(', ephemeral: true });
                } else {
                  console.log('Data inserted successfully!');
                  reply({ content: 'Thank you for registering! :)', ephemeral: true });
                }
                connection.end();
                console.log('Connection closed.');
                setTimeout(() => {
                  interaction.deleteReply();
                }, 5000);
              });
            } else {
              reply({ content: 'Incorrect profile picture.', ephemeral: true });
              connection.end();
              console.log('Connection closed.');
              setTimeout(() => {
                interaction.deleteReply();
              }, 5000);
            }
          }
        })
        .catch((e) => {
          reply({ content: 'Deleting message...', ephemeral: true });
          connection.end();
          console.log('Connection closed.');
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
});