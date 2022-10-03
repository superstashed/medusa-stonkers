const {
  Client,
  GatewayIntentBits,
  ActivityType,
  EmbedBuilder,
} = require("discord.js");
const axios = require("axios");

const { clearConsole, medusa, discord } = require("./config.json");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  if (clearConsole) console.clear();

  console.log("Successfully logged in (Discord)");
  if (discord.presence.activity.enabled) {
    axios
      .get(`${medusa.baseUrl}/store/products`)
      .then((res) => {
        console.log("Received products from Medusa");
        client.user.setPresence({
          activities: [
            {
              name: `over ${res.data.products.length} products`,
              type: ActivityType.Watching,
            },
          ],
          status: discord.presence.activity,
        });
      })
      .catch((err) => {
        console.error(err);
        console.log(
          `\n\nFailed to get products from Medusa, are you sure the baseUrl is correct?`
        );
      });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  switch (commandName) {
    case "ping":
      await interaction.reply({
        content: `🏓Latency is ***${Math.abs(
          Date.now() - interaction.createdTimestamp
        )}ms***. API Latency is ***${Math.round(client.ws.ping)}ms***.`,
        ephemeral: true,
      });
      break;

    case "product":
      let query = interaction.options.getString("query");
      if (query.startsWith("prod")) {
        axios
          .get(`${medusa.baseUrl}/store/products/${query}`)
          .then((res) => {
            console.log("Received product info from Medusa");
            let variant = res.data.product.variants[0];

            let embed = new EmbedBuilder()
              .setThumbnail(res.data.product.thumbnail)
              .setTitle(res.data.product.title)
              .setDescription(res.data.product.description)
              .setFooter({
                text: `${variant.prices[0].amount / 100} ${
                  variant.prices[0].currency_code
                }`,
              })
              .setColor(0x00ae86);

            interaction.reply({
              content: `Product ID: ${res.data.product.id}`,
              embeds: [embed],
              ephemeral: true,
            });
          })
          .catch((err) => {
            console.log(err);
            interaction.reply({
              content: "I have encountered an error.",
              ephemeral: true,
            });
          });
      } else {
        // i would have used "Search Products", but for some reason that doesn't return any hits so here I am searching for the title instead
        axios
          .get(`${medusa.baseUrl}/store/products?title=${query}`)
          .then((res) => {
            let count = 0;
            res.data.products.forEach((product) => {
              if (product.title == query) {
                console.log("Received product info from Medusa");
                let variant = product.variants[0];

                let embed = new EmbedBuilder()
                  .setThumbnail(product.thumbnail)
                  .setTitle(product.title)
                  .setDescription(product.description)
                  .setFooter({
                    text: `${variant.prices[0].amount / 100} ${
                      variant.prices[0].currency_code
                    }`,
                  })
                  .setColor(0x00ae86);

                interaction.reply({
                  content: `Product ID: ${product.id}`,
                  embeds: [embed],
                  ephemeral: true,
                });
              }
            });
          });
      }
      break;

    case "order":
      let orderId = interaction.options.getString("id");
      axios.get(`${medusa.baseUrl}/store/orders/${orderId}`).then((res) => {
        console.log("Received order info from Medusa");
        let order = res.data.order;
        let embed = new EmbedBuilder()
          .setTitle(`Order ID: ${order.id}`)
          .setDescription(`Order Status: ${order.status} - Payment: ${order.payment_status}`)
          .setColor(0x00ae86)
          .setFooter({
            text: `Total: ${order.total / 100} ${order.currency_code}`,
          })
          .addField({
            name: "Items",
            value: order.items
              .map((item) => `${item.title} - ${item.quantity}x`)
              .join("\n"),
          });
        interaction.reply({ embeds: [embed], ephemeral: true });
      });
      break;
  }
});

client.login(discord.token);
