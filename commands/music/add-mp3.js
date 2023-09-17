const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnections, createAudioPlayer, NoSubscriberBehavior, createAudioResource } = require('@discordjs/voice');

module.exports = {
  cooldown: 10,
  data: new SlashCommandBuilder()
      .setName('playmp3')
      .setDescription('Play an mp3 file to play in your VC!')
      .addAttachmentOption(option =>
          option.setName('mp3file')
          .setDescription('Upload your mp3 file here to play in your VC!')
          .setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.voice.channelId) {
      await interaction.reply('You must be in a voice channel to use this command!');
      return;
  } 

  if (!getVoiceConnections().has(interaction.guildId)) {
      joinVoiceChannel({
          channelId: interaction.member.voice.channelId,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator
      });
  }

  const resource = createAudioResource(interaction.options.getAttachment('mp3file').url);
  resource.metadata = {
    title: interaction.options.getAttachment('mp3file').name
  };
  if (!resource.metadata.title.includes('.mp3')) {
      await interaction.reply('Please provide a raw .mp3 file!');
      return;
  }
  const player = createAudioPlayer({
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
    },
  });
  const connection = getVoiceConnections().get(interaction.guildId);
  connection.subscribe(player);
  player.play(resource);
  await interaction.reply('Playing ' + resource.metadata.title + '!');
  },  
};