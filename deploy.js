const { REST, SlashCommandBuilder, Routes } = require('discord.js');
const { discord } = require('./config.json');

const commands = [
	new SlashCommandBuilder().setName('ping').setDescription('Replies with bot ping'),
]
	.map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(discord.token);

rest.put(Routes.applicationGuildCommands(discord.clientId, discord.guildId), { body: commands })
	.then((data) => console.log(`Successfully registered ${data.length} application commands.`))
	.catch(console.error);
