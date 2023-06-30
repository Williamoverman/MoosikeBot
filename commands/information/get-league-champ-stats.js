const { SlashCommandBuilder } = require('discord.js');
const fetch = require('isomorphic-fetch');
const mysql = require('mysql');
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
      await interaction.reply({ content: 'Getting data...', ephemeral: true });

      const discordUserID = interaction.user.id;
      const checkIfRegisteredQuery = 'SELECT * FROM RegistrationLoL WHERE discordID = ?';

      db.query(checkIfRegisteredQuery, [discordUserID], async (err, results) => {
        if (err) {
          await interaction.editReply({ content: 'Something went wrong' });
          return setTimeout(() => {
            interaction.deleteReply();
          }, 5000);
        }

        if (results === 0) {
          await interaction.editReply({ content: 'Not yet registered!' });
          return setTimeout(() => {
            interaction.deleteReply();
          }, 5000);
        }  
      });
      
      const givenChampion = interaction.options.getString('champion');
      let championID = 0;
      let championImg = '';
      let championName = '';

      // Fetch champion data
      const championDataResponse = await fetch('https://ddragon.leagueoflegends.com/cdn/6.24.1/data/en_US/champion.json');
      if (!championDataResponse.ok) {
        throw new Error('API request failed');
      }
      const championData = await championDataResponse.json();

      if (championData.data[givenChampion]) {
        const champion = championData.data[givenChampion];
        championName = champion.id;
        championID = champion.key;
        championImg = champion.image.full;
      } else {
        throw new Error('Champion data not found');
      }

      const getSummonerIdQuery = 'SELECT summonerID FROM SummonerDetails WHERE discordID = ?';

        db.query(getSummonerIdQuery, [discordUserID], async (err, resultsSummonerID) => {
          if (err) {
            await interaction.editReply({ content: 'Something went wrong' });
            return setTimeout(() => {
              interaction.deleteReply();
            }, 5000);
          }

          if (resultsSummonerID === 0) {
            await interaction.editReply({ content: 'Please refresh your registration using /refresh' });
            return setTimeout(() => {
              interaction.deleteReply();
            }, 5000);
          }

          let championPoints = 0;
          let championLevel = 0;
          // Fetch user data
          const userDataResponse = await fetch(`https://euw1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${resultsSummonerID.summonerID}/by-champion/${championID}?api_key=${process.env.LOLAPITOKEN}`);
          if (!userDataResponse.ok) {
            throw new Error('API request failed');
          }
          const userData = await userDataResponse.json();
          championPoints = userData.championPoints;
          championLevel = userData.championLevel;

          const discordUsername = interaction.user.username;
          const imagePath = path.join(__dirname, `../images/mastery${championLevel}.png`);

          const champStatsEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setAuthor({ name: championName, iconURL: `https://ddragon.leagueoflegends.com/cdn/12.4.1/img/champion/${championImg}` })
            .setDescription(`${discordUsername} has ${championPoints} on ${championName}`)
            .setThumbnail(imagePath)
            .setTimestamp();

          await interaction.editReply({ content: '', embeds: [champStatsEmbed], ephemeral: false });
        });
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: 'Something went wrong' });
      setTimeout(() => {
        interaction.deleteReply();
      }, 5000);
    }
  },
};
