const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const fetch = require('isomorphic-fetch');
const mysql = require('mysql');
require("dotenv").config();

module.exports = {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register your LoL account!')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Your LoL username!')
        .setRequired(true)),
  async execute(interaction, db) {
    try {
      var response = await interaction.reply({ content: '...', embeds: [], components: [], ephemeral: true });

      //let discordUsername = interaction.user.username;
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

          var randomIcon = randomNumber(0, 28);
          const lolEmbed = new EmbedBuilder().setColor(0x0099FF).setDescription('To confirm this is your LoL account, change your profile picture in LoL to this picture').setThumbnail(`http://ddragon.leagueoflegends.com/cdn/10.18.1/img/profileicon/${randomIcon}.png`);
          const discordUserID = interaction.user.id;
  
          const ready = new ButtonBuilder()
            .setCustomId('ready')
            .setLabel('Ready')
            .setStyle(ButtonStyle.Primary);
  
          const row = new ActionRowBuilder()
            .addComponents(ready);

          const searchForUsersQuery = 'SELECT * FROM RegistrationLoL WHERE discordID = ?';
  
          db.query(searchForUsersQuery, [discordUserID], (err, results) => {
            if (err) {
              console.error('Error executing query:', err);
              return interaction.editReply({ content: 'Something went wrong with the query.', embeds: [], components: [] });
            }
            if (results.length !== 0) {
              //logInfo('Failed', 'Already registered', `${discordUsername} tried registering when they were already registered`);
              interaction.editReply({ content: 'Already registered.', embeds: [], components: [] });
              setTimeout(() => {
                return interaction.deleteReply();
              }, 5000);
            } else {
              response = interaction.editReply({
                content: '',
                embeds: [lolEmbed],
                components: [row],
              });
              
            const collectorFilter = i => i.user.id === interaction.user.id;
    
            response.awaitMessageComponent({ filter: collectorFilter, time: 90_000 })
              .then(async confirmation => {
                if (confirmation.customId === 'ready') {
                  await confirmation.update({ content: `...`, components: [] });
                  setTimeout(() => {
                    db.query(searchForUsersQuery, [discordUserID], (err, results) => {
                      if (err) {
                        console.error('Error executing query:', err);
                        return interaction.editReply({ content: 'Something went wrong with the query.', embeds: [], components: [] });
                      }
                      if (results.length !== 0) {
                        //logInfo('Failed', 'Already registered', `${discordUsername} tried registering when they were already registered`);
                        interaction.editReply({ content: 'Already registered.', embeds: [], components: [] });
                        setTimeout(() => {
                          return interaction.deleteReply();
                        }, 5000);
                      } else {
                        fetch(apiLink)
                        .then(apiresponse2 => {
                        if (!apiresponse2.ok) {
                          throw new Error('API request failed');
                        }
                        return apiresponse2.json();
                        })
                        .then(data1 => {
                          if (data1.profileIconId === randomIcon) {
                            const summonerData = {
                              discordID: discordUserID,
                              puuID: data1.puuid,
                              accountID: data1.accountId,
                              summonerID: data1.id
                            };
                            const insertSummonerDetailsQuery = 'INSERT INTO SummonerDetails SET ?';
                            db.query(insertSummonerDetailsQuery, summonerData, (err) => {
                              if (err) {
                                console.log(err);
                                interaction.editReply({ content: 'Something went wrong with registering :(', embeds: [], components: [] });
                                setTimeout(() => {
                                  return interaction.deleteReply();
                                }, 5000);
                              } else {
                                const userData = { discordID: discordUserID, usernameLoL: leagueUsername };
                                const insertUserQuery = 'INSERT INTO RegistrationLoL SET ?';
                                db.query(insertUserQuery, userData, (err) => {
                                  if (err) {
                                    console.error('Error inserting data:', err);
                                    interaction.editReply({ content: 'Something went wrong with registering :(', embeds: [], components: [] });
                                    setTimeout(() => {
                                      return interaction.deleteReply();
                                    }, 5000);
                                  } else {
                                    //logInfo('Success', 'Succesfully registered', `${discordUsername} succesfully registered`);
                                    interaction.editReply({ content: 'Thank you for registering! :)', embeds: [], components: [] });
                                    setTimeout(() => {
                                      return interaction.deleteReply();
                                    }, 5000);
                                  }
                                });
                              }
                            });
                          } else {
                            //logInfo('Failed', 'Incorrect profile picture', `${discordUsername} failed to equip the right profile picture`);
                            interaction.editReply({ content: 'Incorrect profile picture.', embeds: [], components: [] });
                            setTimeout(() => {
                              return interaction.deleteReply();
                            }, 5000);
                          }
                        }).catch(error => {
                          console.error(error);
                        });
                      }
                    });
                  }, 2000);
                }
              })
              .catch(e => {
                //logInfo('Failed', 'Collector timer ran out', `${discordUsername} failed to respond in time`);
                interaction.editReply({ content: 'Deleting message..', embeds: [], components: [] });
                setTimeout(() => {
                  interaction.deleteReply();
                }, 5000);
              });
            }
          });
        })
        .catch(error => {
          //logInfo('Failed', 'No summoner found', `${discordUsername} inputted a non existent summoner name`);
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
    /*function logInfo(status, title, msg) {
      const logEmbed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`${status}: ${title}`)
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL() })
      .setTimestamp()
      .setFooter({ text: `The executed command name: ${interaction.commandName}` });
  
      if (msg) {
          logEmbed.setDescription(msg);
      } else {
          logEmbed.setDescription('No message provided');
      }
      
      const channelName = 'logs';
  
      const guild = interaction.guild;
      const channel = guild.channels.cache.find(ch => ch.name === channelName);
  
      if (!channel) {
        console.log(`Channel "${channelName}" not found.`);
      }
  
      channel.send({ embeds: [logEmbed] });
    }*/
  },
};

function randomNumber(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}