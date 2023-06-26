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
    async execute(interaction) {
        await interaction.reply('...');
        // Check if the user has the desired role
        const desiredRole = 'Famke';
        const hasRole = interaction.member.roles.cache.some(role => role.name === desiredRole || role.id === desiredRole);
        
        if (hasRole) {
            const connection = mysql.createConnection({
                host: process.env.DATABASEHOST,
                user: process.env.DATABASEUSER,
                password: process.env.DATABASEPASSWORD,
                database: process.env.DATABASENAME
              });
      
              connection.connect(err => {
                if (err) {
                    connection.end();
                    console.log("Connection closed.");
                  console.error(err);
                  interaction.editReply({ content: 'Something went wrong with the database connection :(' });
                  setTimeout(() => {
                    return interaction.deleteReply();
                  }, 5000);
                }
                console.log('Connected to the database!');
      
                const searchForExistingGuild = 'SELECT * FROM serverSettings WHERE guildID = ?';
    
                connection.query(searchForExistingGuild, [interaction.guildId], (err, results) => {
                    if (err) {
                        connection.end();
                        console.log("Connection closed.");
                      console.error('Error executing query:', err);
                      interaction.editReply({ content: 'Something went wrong with the query.' });
                      setTimeout(() => {
                        return interaction.deleteReply();
                      }, 5000);
                    }
                    if (results.length === 0) {
                        const insertLogInfo = 'INSERT INTO serverSettings (guildID, logsEnabled, logsChannel) VALUES (?, ?, ?)';
    
                        connection.query(insertLogInfo, [interaction.guildId, interaction.options.getBoolean('enablelogs'), interaction.options.getString('logchannel')], (err) => {
                          if (err) {
                            connection.end();
                            console.log("Connection closed.");
                            console.error('Error executing query:', err);
                            interaction.editReply({ content: 'Something went wrong with the query.' });
                            setTimeout(() => {
                                return interaction.deleteReply();
                              }, 5000);
                          }
                            connection.end();
                            console.log("Connection closed.");
                            interaction.editReply({ content: 'Succesfully changed log settings!' });
                          setTimeout(() => {
                            return interaction.deleteReply();
                          }, 5000);
                        });
                    } else {
                        const updateLogInfo = 'UPDATE serverSettings SET logsEnabled = ?, logsChannel = ? WHERE guildID = ?';
    
                        connection.query(updateLogInfo, [interaction.options.getBoolean('enablelogs'), interaction.options.getString('logchannel'), interaction.guildId], (err) => {
                          if (err) {
                            connection.end();
                            console.log("Connection closed.");
                            console.error('Error executing query:', err);
                            interaction.editReply({ content: 'Something went wrong with the query.' });
                            setTimeout(() => {
                                return interaction.deleteReply();
                              }, 5000);
                          }
                          connection.end();
                            console.log("Connection closed.");
                            interaction.editReply({ content: 'Succesfully changed log settings!' });
                          setTimeout(() => {
                            return interaction.deleteReply();
                          }, 5000);
                        });
                    }
                });
              });
        } else {
            await interaction.editReply('You do not have the required role to use this command.');
            setTimeout(() => {
                return interaction.deleteReply();
              }, 5000);
        }
    },
};