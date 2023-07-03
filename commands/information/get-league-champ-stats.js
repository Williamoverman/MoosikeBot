const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fetch = require('isomorphic-fetch');
const mysql = require('mysql');
const path = require('path');
require("dotenv").config();

module.exports = {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('mastery')
    .setDescription('Check a specific champion\'s mastery!')
    .addStringOption(option =>
      option.setName('champion')
        .setDescription('The champion you want to see your mastery score on!')
        .setRequired(true)),
  async execute(interaction, db) {
    try {
      await interaction.reply({ content: 'Getting data...', ephemeral: false });

      let userSummonerID = "";
      const discordUserID = interaction.user.id;
      const checkIfRegisteredQuery = 'SELECT * FROM RegistrationLoL WHERE discordID = ?';

      db.query(checkIfRegisteredQuery, [discordUserID], async (err, results) => {
        if (err) {
          await interaction.editReply({ content: 'Something went wrong', ephemeral: true });
          return setTimeout(() => {
            interaction.deleteReply();
          }, 5000);
        }

        if (results === 0) {
          await interaction.editReply({ content: 'Not yet registered!', ephemeral: true });
          return setTimeout(() => {
            interaction.deleteReply();
          }, 5000);
        }  
      });
      
      const getSummonerIdQuery = 'SELECT summonerID FROM SummonerDetails WHERE discordID = ?';

      db.query(getSummonerIdQuery, [discordUserID], async (err, resultsSummonerID) => {
        if (err) {
          await interaction.editReply({ content: 'Something went wrong', ephemeral: true });
          return setTimeout(() => {
            interaction.deleteReply();
          }, 5000);
        }

        if (resultsSummonerID === 0) {
          await interaction.editReply({ content: 'Please refresh your registration using /refresh', ephemeral: true });
          return setTimeout(() => {
            interaction.deleteReply();
          }, 5000);
        } else {
          userSummonerID = resultsSummonerID[0].summonerID;
          const givenChampion = interaction.options.getString('champion');  

          // Fetch champion data
          const championDataResponse = await fetch('http://ddragon.leagueoflegends.com/cdn/12.6.1/data/en_US/champion.json');
          if (!championDataResponse.ok) {
              console.log('api request failed');
          }
          const championData = await championDataResponse.json();

          if (championData.data) {
            const champions = Object.values(championData.data);
            const champion = champions.find(champ => champ.name.toLowerCase() === givenChampion.toLowerCase());
          
            if (champion) {
              const championID = champion.key;
              const championName = champion.id;
              const championImg = champion.image.full;

              // Fetch user data
              const userDataResponse = await fetch(`https://euw1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${userSummonerID}/by-champion/${championID}?api_key=${process.env.LOLAPITOKEN}`);
              if (!userDataResponse.ok) {
                console.log('api request failed');
              }
              const userData = await userDataResponse.json();
              let championPoints = userData.championPoints;

              const discordUsername = interaction.user.username;

              const champStatsEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setAuthor({ name: championName, iconURL: `https://ddragon.leagueoflegends.com/cdn/12.4.1/img/champion/${championImg}` })
                .setDescription(`${discordUsername} has ${championPoints.toLocaleString()} mastery points on ${championName}`)
                .setTimestamp();

              await interaction.editReply({ content: '', embeds: [champStatsEmbed], ephemeral: false });
            } else {
              await interaction.editReply({ content: 'Champion does not exist.', ephemeral: true });
              setTimeout(() => {
                interaction.deleteReply();
              }, 5000);
            }
          } else {
            await interaction.editReply({ content: 'Champion does not exist.', ephemeral: true });
              setTimeout(() => {
                interaction.deleteReply();
              }, 5000);
          }
        }
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: 'Something went wrong', ephemeral: true });
      setTimeout(() => {
        interaction.deleteReply();
      }, 5000);
    }
  },
};
