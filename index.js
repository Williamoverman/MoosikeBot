const fs = require('node:fs');
const path = require('node:path');
const fetch = require('isomorphic-fetch');
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

	const logEmbed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`${interaction.user.username} used /${interaction.commandName}`)
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL() })
      .setTimestamp()
      .setFooter({ text: `The executed command name: /${interaction.commandName}` });
      
    const channelName = 'logs';
  
    const guild = interaction.guild;
    const channel = guild.channels.cache.find(ch => ch.name === channelName);
  
    if (!channel) {
    	console.log(`Channel "${channelName}" not found.`);
    }
  
    channel.send({ embeds: [logEmbed] });

	try {
		await command.execute(interaction);
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
