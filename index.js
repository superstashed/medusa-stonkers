// #region discord stuff
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const axios = require('axios')

const { medusa, discord } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
	console.log('Successfully logged in (Discord)');
  if(discord.presence.activity.enabled) {
    axios.get(`${medusa.baseUrl}/store/products`)
    .then(res => {
      console.log('Received products from Medusa')
      client.user.setPresence({
        activities: [{ name: `over ${res.data.products.length} products`, type: ActivityType.Watching }],
        status: 'dnd',
      });
    })
    .catch(err => console.log(err))
  }
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const { commandName } = interaction;

    switch (commandName) {
        case 'ping':
            await interaction.reply(`🏓! Latency is ***${Math.abs(Date.now() - interaction.createdTimestamp)}ms***. API Latency is ***${Math.round(client.ws.ping)}ms***.`)
            break;
        case 'order':
            let id = interaction.options.getString('id');
            axios.get(`${medusa.baseUrl}/store/orders/${id}`)
            .then(res => {
                console.log('Received order info from Medusa');

                let embed = new EmbedBuilder()
                .setTitle(`Order #${res.data.order.id}`)
                .setDescription(`**Status:** ${res.data.order.status}\n**Total:** ${res.data.order.total}\n**Items:** ${res.data.order.items.length}`)
                .setTimestamp(res.data.order.created_at)
                .setColor(0x00AE86)
                
                interaction.reply({content: `Order ID: ${res.data.order.id}`, embeds: [embed]});
            })
            break;
    }
});
// #endregion

client.login(discord.token);
