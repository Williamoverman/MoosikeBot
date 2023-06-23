const { ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
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

    const cancel = new ButtonBuilder()
			.setCustomId('ready')
			.setLabel('Ready')
			.setStyle(ButtonStyle.Primary);

		const row = new ActionRowBuilder()
			.addComponents(cancel);

      await interaction.reply({ content: 'Click the button!', components: [row] });

      const filter = i => i.customId === 'button_click' && i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
  
      collector.on('collect', async i => {
        await i.update({ content: 'Button clicked!', components: [] });
        // Perform the desired action here when the button is clicked
        const connection = mysql.createConnection({
          host: process.env.DATABASEHOST,
          user: process.env.DATABASEUSER,
          password: process.env.DATABASEPASSWORD,
          database: process.env.DATABASENAME
        });
    
        connection.connect(err => {
          if (err) {
            console.error('Error connecting to database:', err);
            interaction.reply({ content: 'Something went wrong with connecting to the database :(', ephemeral: true });
          } else {
            console.log('Connected to database!');
    
            const leagueUsername = interaction.options.getString('username');
            const discordUserID = interaction.user.id;
    
            const searchForUsersQuery = 'SELECT * FROM LoLregistration WHERE discordID = ?';
            connection.query(searchForUsersQuery, [discordUserID], (err, results) => {
              if (err) {
                console.error('Error executing query:', err);
                return;
              }
              if (results.length === 0) {
                const userData = { discordID: discordUserID, usernameLoL: leagueUsername };
                const insertUserQuery = 'INSERT INTO LoLregistration SET ?'
                connection.query(insertUserQuery, userData, (err, result) => {
                  if (err) {
                    console.error('Error inserting data:', err);
                    interaction.reply({ content: 'Something went wrong with registering :(', ephemeral: true });
                  } else {
                    console.log('Data inserted successfully!');
                    interaction.reply({ content: 'Thank you for registering! :)', ephemeral: false });
                  }
                });
              } else {
                interaction.reply({ content: 'Already registered.', ephemeral: true });
              }
              connection.end();
            });
          }
        });
      });
  
      collector.on('end', async collected => {
        if (collected.size === 0) {
          await interaction.editReply({ content: 'Button interaction expired.', components: [] });
        }
      });
  },
};
