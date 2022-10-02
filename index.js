// #region discord stuff
const { Client, GatewayIntentBits } = require('discord.js');
import Medusa from "@medusajs/medusa-js"

const { medusa, discord } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
	console.log('Successfully logged in (Discord)');
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const { commandName } = interaction;

    switch (commandName) {
        case 'ping':
            await interaction.reply(`🏓! Latency is ***${Math.abs(Date.now() - interaction.createdTimestamp)}ms***. API Latency is ***${Math.round(client.ws.ping)}ms***.`)
            break;
    }
});
// #endregion

// #region let the spaghetti code begin!
const store = new Medusa({
    maxRetries: medusa.maxRetries,
    baseUrl: medusa.baseUrl
})
// #endregion

client.login(discord.token);
