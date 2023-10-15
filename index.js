const fs = require('node:fs');
const path = require('node:path');
const fetch = require('isomorphic-fetch');
const schedule = require('node-schedule');
const mysql = require('mysql');
const { EmbedBuilder, REST, Routes, Client, Collection, Events, GatewayIntentBits, ActivityType } = require('discord.js');
require("dotenv").config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.cooldowns = new Collection();
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
	const commands = [];
	const foldersPath = path.join(__dirname, 'commands');
	const commandFolders = fs.readdirSync(foldersPath);

	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);
			if ('data' in command && 'execute' in command) {
				commands.push(command.data.toJSON());
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}

	const rest = new REST().setToken(process.env.TOKEN);

	(async () => {
		try {
			console.log(`Started refreshing ${commands.length} application (/) commands globally.`);

			const data = await rest.put(
				Routes.applicationCommands(process.env.CLIENTID),
				{ body: commands },
			);

			console.log(`Successfully reloaded ${data.length} application (/) commands globally.`);
		} catch (error) {
			console.error(error);
		}
	})();

	client.user.setPresence({
		activities: [{ name: `This crazy spotify playlist`, type: ActivityType.Listening }],
		status: 'Spotify',
	});

	//timed message
	schedule.scheduleJob(`0 57 22 * * *`, () => {
		const exampleEmbed = new EmbedBuilder()
		.setColor(0x0099FF)
		.setTitle('Nofap')
		.setAuthor({ name: 'DJ Khaled' })
		.setDescription("<@&1152995114143203330> HALLO HEBBEN JULLIE HET GEHAALD?????????????????????????????? :wine_glass::moyai::wine_glass::moyai::wine_glass::moyai::wine_glass::moyai::wine_glass::moyai::wine_glass::moyai::wine_glass::moyai::wine_glass::moyai::wine_glass::moyai::wine_glass::moyai::wine_glass::moyai::wine_glass::moyai::wine_glass::moyai::wine_glass::moyai::wine_glass::moyai:")
		.setThumbnail('https://i.imgur.com/AfFp7pu.png')
		.setImage('https://cdn-longterm.mee6.xyz/plugins/embeds/images/786354212686528543/b93da23083f1c38adf48ae50a7b99a88ebeea7b76e563ba06b887f98d79f9b37.png')
		.setTimestamp()

		const channel = client.channels.cache.get('1152993725996335134');
		channel.send({ embeds: [ exampleEmbed ] });
	});
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	const { cooldowns } = client;

	if (!cooldowns.has(command.data.name)) {
		cooldowns.set(command.data.name, new Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.data.name);
	const defaultCooldownDuration = 10;
	const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

	if (timestamps.has(interaction.user.id)) {
		const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

		if (now < expirationTime) {
			const expiredTimestamp = Math.round(expirationTime / 1000);
			return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, ephemeral: true });
		}
	}

	timestamps.set(interaction.user.id, now);
	setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

	const db = mysql.createPool({
		port: process.env.DATABASEPORT,
		host: process.env.DATABASEHOST,
		user: process.env.DATABASEUSER,
		password: process.env.DATABASEPASSWORD,
		database: process.env.DATABASENAME,
		multipleStatements: true
	  });

	  const searchForExistingGuild = 'SELECT * FROM serverSettings WHERE logsEnabled = ? AND guildID = ?';

	  db.query(searchForExistingGuild, [1, interaction.guildId], (err, results) => {
		  if (err) {
			console.error('Error executing query:', err);
		  }
		
		  if (results.length !== 0) {
			const logEmbed = new EmbedBuilder()
			  .setColor(0x0099FF)
			  .setTitle(`${interaction.user.username} used /${interaction.commandName}`)
			  .setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL() })
			  .setTimestamp()
			  .setFooter({ text: `The executed command name: /${interaction.commandName}` });
			  
			const channelName = results[0].logsChannel;
		
			const guild = interaction.guild;
			const channel = guild.channels.cache.find(ch => ch.name === channelName);
		
			if (!channel) {
			  console.log(`Channel "${channelName}" not found.`);
			} else {
			  channel.send({ embeds: [logEmbed] });
			}
		  }
	  });

	try {
		await command.execute(interaction, db);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
})

client.login(process.env.TOKEN);
