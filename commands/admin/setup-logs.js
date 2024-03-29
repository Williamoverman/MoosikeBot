const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuplogs')
        .setDescription('Setup logs for your server!')
        .addBooleanOption(option =>
            option.setName('enablelogs')
                .setDescription('If you want logs to be enabled'))
        .addStringOption(option =>
            option.setName('logchannel')
                .setDescription('Which channel you want the logs in')),
    async execute(interaction, db) {
        await interaction.reply('...');
        // Check if the user has the desired role
        const desiredRole = 'Famke';
        const hasRole = interaction.member.roles.cache.some(role => role.name === desiredRole || role.id === desiredRole);
        
        if (hasRole) {      
          const searchForExistingGuild = 'SELECT * FROM serverSettings WHERE guildID = ?';
    
          db.query(searchForExistingGuild, [interaction.guildId], (err, results) => {
              if (err) {
                console.error('Error executing query:', err);
                interaction.editReply({ content: 'Something went wrong with the query.' });
                setTimeout(() => {
                  return interaction.deleteReply();
                }, 5000);
              }
              if (results.length === 0) {
                  const insertLogInfo = 'INSERT INTO serverSettings (guildID, logsEnabled, logsChannel, roleNeeded) VALUES (?, ?, ?, ?)';

                  db.query(insertLogInfo, [interaction.guildId, interaction.options.getBoolean('enablelogs'), interaction.options.getString('logchannel'), desiredRole], (err) => {
                    if (err) {
                      console.error('Error executing query:', err);
                      interaction.editReply({ content: 'Something went wrong with the query.' });
                      setTimeout(() => {
                          return interaction.deleteReply();
                        }, 5000);
                    }
                      interaction.editReply({ content: 'Succesfully changed log settings!' });
                    setTimeout(() => {
                      return interaction.deleteReply();
                    }, 5000);
                  });
              } else {
                  const updateLogInfo = 'UPDATE serverSettings SET logsEnabled = ?, logsChannel = ?, roleNeeded = ? WHERE guildID = ?';

                  db.query(updateLogInfo, [interaction.options.getBoolean('enablelogs'), interaction.options.getString('logchannel'), desiredRole, interaction.guildId], (err) => {
                    if (err) {
                      console.error('Error executing query:', err);
                      interaction.editReply({ content: 'Something went wrong with the query.' });
                      setTimeout(() => {
                          return interaction.deleteReply();
                        }, 5000);
                    }
                      interaction.editReply({ content: 'Succesfully changed log settings!' });
                    setTimeout(() => {
                      return interaction.deleteReply();
                    }, 5000);
                  });
              }
          });
        } else {
            await interaction.editReply('You do not have the required role to use this command.');
            setTimeout(() => {
                return interaction.deleteReply();
              }, 5000);
        }
    },
};