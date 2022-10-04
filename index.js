const {
  Client,
  GatewayIntentBits,
  ActivityType,
  EmbedBuilder,
} = require("discord.js");
const axios = require("axios");

const { clearConsole, medusa, discord, mysql } = require("./config.json");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const database = require("mysql")
const connection = database.createPool({
  host: mysql.host,
  port: 3306,
  user: mysql.user,
  password: mysql.password,
  database: mysql.database
})
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
              .setDescription(`${res.data.product.id}\n\n${res.data.product.description}`)
              .setFooter({
                text: `${variant.prices[0].amount / 100} ${
                  variant.prices[0].currency_code
                }`,
              })
              .setColor(0x00ae86);

            interaction.reply({
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
                  .setTitle(`${product.title}`)
                  .setDescription(`${product.id}\n\n${product.description}`)
                  .setFooter({
                    text: `${variant.prices[0].amount / 100} ${
                      variant.prices[0].currency_code
                    }`,
                  })
                  .setColor(0x00ae86);

                interaction.reply({
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
      if (!orderId.startsWith("order_")) orderId = `order_${orderId}`;

      axios.get(`${medusa.baseUrl}/store/orders/${orderId}`).then((res) => {
        let order = res.data.order;
        let currency = res.data.order.currency_code;

        let fields = [
          {
            name: "Country",
            value: `:flag_${order.shipping_address.country_code}:`,
            inline: true,
          },
          {
            name: "First name",
            value: `${order.shipping_address.first_name}`,
            inline: true,
          },
          {
            name: "Last name",
            value: `${order.shipping_address.last_name}`,
            inline: true,
          },

          { name: "Items", value: `${order.items.length}`, inline: true },
          {
            name: "Total",
            value: `${order.total / 100} ${currency}`,
            inline: true,
          },
          {
            name: "Subtotal",
            value: `${order.subtotal / 100} ${currency}`,
            inline: true,
          },
          {
            name: "Discount",
            value: `${order.discount_total / 100} ${currency}`,
            inline: true,
          },
          {
            name: "Tax",
            value: `${order.tax_total / 100} ${currency}`,
            inline: true,
          },
          {
            name: "Shipping",
            value: `${order.shipping_total / 100} ${currency}`,
            inline: true,
          },
        ];

        console.log("Received order info from Medusa");
        let embed = new EmbedBuilder()
          .setTitle(`Order ID: ${order.id}`)
          .setDescription(
            `Order Status: ${order.status}\nPayment: ${order.payment_status}`
          )
          .setColor(0x00ae86)
          .addFields(fields);
        interaction.reply({ embeds: [embed], ephemeral: true });
      });
      break;

    case "account-info":
      connection.query(
        `SELECT * FROM users WHERE discord = '${interaction.user.id}'`,
        (err, result) => {
          if (err) throw err;
          if (result.length < 1) {
            interaction.reply({
              content: "You don't have an account linked.",
              ephemeral: true,
            });
          } else {
            let account = result[0];
            let axiosCfg = {
              headers: {
                Cookie: `connect.sid=${account.cookie}`
              }
            };

            function country() {
              if(!account.billing_address) return ":flag_white:";
              else return `:flag_${account.billing_address.country_code}:`;              
            }

            axios
              .get(`${medusa.baseUrl}/store/auth/`, axiosCfg)
              .then((res) => {
                let account = res.data.customer;
                let fields = [
                  {
                    name: "First name",
                    value: `${account.first_name}`,
                    inline: true,
                  },
                  {
                    name: "Last name",
                    value: `${account.last_name}`,
                    inline: true,
                  },
                  {
                    name: "E-mail",
                    value: `${account.email}`,
                    inline: true,
                  },
                  {
                    name: "Phone",
                    value: `${account.phone}`,
                    inline: true,
                  },
                  {
                    name: "Orders",
                    value: `${account.orders.length}`,
                    inline: true,
                  },
                  {
                    name: "Billing Country",
                    value: country(),
                    inline: true,
                  }
                ]

                let unixCreatedAt = Date.parse(account.created_at);
                let createdAt = new Date(unixCreatedAt);
      
                let embed = new EmbedBuilder()
                  .setTitle(`Account ID: ${account.id}`)
                  .setDescription(`Account created at ${createdAt.getDate()}.${createdAt.getMonth()}.${createdAt.getFullYear()}`)
                  .setColor(0x00ae86)
                  .addFields(fields);
      
                interaction.reply({ embeds: [embed], ephemeral: true });
              })
              .catch((err) => {
                console.log(err);
                interaction.reply({
                  content: "Your cookie might've expired. Please /login again.",
                  ephemeral: true,
                });
              });
          }
        });
    break;

    case "login":
      let email = interaction.options.getString("e-mail");
      let password = interaction.options.getString("password");

      axios
        .post(`${medusa.baseUrl}/store/auth`, {
          email: email,
          password: password,
        })
        .then((res) => {

          console.log("Received account info from Medusa");
          var cookie = res.headers["set-cookie"][0];
          var token = cookie.substring(12).split(";")[0];

          let embed = new EmbedBuilder()
            .setTitle(`Logged in as ${email}`)
            .setDescription(`You can now safely use any command that requires authentication until 24 hours from now.`)
            .setColor(0x00ae86);

          // if the user already exists in the database, update the token
          connection.query(`SELECT * FROM users WHERE discord = '${interaction.user.id}'`, (err, result) => {
            if (err) throw err;
            if (result.length > 0) {
              connection.query(`UPDATE users SET cookie = '${token}' WHERE discord = '${interaction.user.id}'`, (err, result) => {
                if (err) throw err;
              });
            } else {
              // if the user doesn't exist in the database, add them
              connection.query(`INSERT INTO users (discord, cookie) VALUES ('${interaction.user.id}', '${token}')`, (err, result) => {
                if (err) throw err;
                console.log("Added one user to the database");
              });
            }
          });

          interaction.reply({ embeds: [embed], ephemeral: true });
        })
        .catch((err) => {
          console.log(err);

          let embed = new EmbedBuilder()
            .setTitle(`Failed to log in`)
            .setDescription(`Please check your credentials and try again.`)
            .setColor(0xff0000);

          interaction.reply({ embeds: [embed], ephemeral: true });
        });

    break;
  }
});

client.login(discord.token);
