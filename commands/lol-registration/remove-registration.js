const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder
} = require('discord.js');
const mysql = require('mysql');
require("dotenv").config();

module.exports = {
  cooldown: 10,
  data: new SlashCommandBuilder()
      .setName('unregister')
      .setDescription('Unregister your LoL account!'),
  async execute(interaction, db) {
      try {
          var response = await interaction.reply({
              content: '...',
              components: [],
              ephemeral: true
          });

          const discordUserID = interaction.user.id;
          //let discordUsername = interaction.user.username;

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

          const searchForUsersQuery = 'SELECT * FROM RegistrationLoL WHERE discordID = ?';

          db.query(searchForUsersQuery, [discordUserID], (err, results) => {
              if (err) {
                  console.error('Error executing query:', err);
                  interaction.editReply({
                      content: 'Something went wrong with the query.',
                      embeds: [],
                      components: []
                  });
                  return;
              }
              if (results.length === 0) {
                  interaction.editReply({
                      content: 'Not yet registered.',
                      embeds: [],
                      components: []
                  });
                  //logInfo('Blocked', 'Not yet registered', `${discordUsername} is not yet registered`);
              } else {
                  response = interaction.editReply({
                      content: 'Click on \'Unregister\' To unregister and \'Cancel\' to cancel the command.',
                      components: [row],
                  });
              }
          });

          const collectorFilter = i => i.user.id === interaction.user.id;

          response.awaitMessageComponent({
                  filter: collectorFilter,
                  time: 60_000
              })
              .then(async confirmation => {
                  if (confirmation.customId === 'unregister') {
                      await confirmation.update({
                          content: `...`,
                          components: []
                      });
                      db.query(searchForUsersQuery, [discordUserID], (err, results1) => {
                          if (err) {
                              console.error('Error executing query:', err);
                              interaction.editReply({
                                  content: 'Something went wrong with the query.',
                                  components: []
                              });
                              return;
                          }
                          if (results1.length === 0) {
                              interaction.editReply({
                                  content: 'Already unregistered.',
                                  components: []
                              });
                              //logInfo('Failed', 'Already unregistered', `${discordUsername} was already unregistered`);
                              setTimeout(() => {
                                  return interaction.deleteReply();
                              }, 5000);
                          } else {
                              const deleteRegistrationQuery = "DELETE FROM RegistrationLoL WHERE discordID = ?"
                              db.query(deleteRegistrationQuery, [discordUserID], (err, results2) => {
                                  if (err) {
                                      console.error('Error executing query:', err);
                                      interaction.editReply({
                                          content: 'Something went wrong with the query.',
                                          components: []
                                      });
                                      return;
                                  } else {
                                    const deleteSummonerDetailsQuery = "DELETE FROM SummonerDetails WHERE discordID = ?"
                                    db.query(deleteSummonerDetailsQuery, [discordUserID], (err) => {
                                        if (err) {
                                            console.log(err);
                                            interaction.editReply({
                                                content: 'Something went wrong with the query.',
                                                components: []
                                            });
                                            return;
                                        } else {
                                            interaction.editReply({
                                                content: 'Successfully unregistered',
                                                components: []
                                            });
                                            //logInfo('Success', 'Successfully unregistered', `${discordUsername} Successfully unregistered`);
                                            setTimeout(() => {
                                                return interaction.deleteReply();
                                            }, 5000);
                                        }
                                    });
                                  }
                              });
                          }
                      });
                  } else if (confirmation.customId === 'cancel') {
                      interaction.deleteReply();
                  }
              })
              .catch(e => {
                  interaction.editReply({
                      content: 'Deleting message...',
                      components: []
                  });
                  //logInfo('Failed', 'Collector timer ran out', `${discordUsername} failed to respond in time`);
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
  }
};