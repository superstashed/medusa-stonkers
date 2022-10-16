const {
    Client,
    GatewayIntentBits,
    PermissionFlagsBits,
    ActivityType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    SelectMenuBuilder,
} = require('discord.js');
const axios = require('axios');

const {
    clearConsole,
    medusa,
    discord,
    mysql
} = require('./config.json');

const client = new Client({intents: [GatewayIntentBits.Guilds]});

const database = require('mysql');
const connection = database.createPool({
    host: mysql.host,
    port: 3306,
    user: mysql.user,
    password: mysql.password,
    database: mysql.database,
});

client.once('ready', () => {
    if (clearConsole) console.clear();

    console.log('Successfully logged in (Discord)');
    if (discord.presence.activity.enabled) {
        axios
            .get(`${medusa.baseUrl}/store/products`)
            .then((res) => {
                console.log('Received products from Medusa');
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

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) {
        if (interaction.isButton()) {
            if (interaction.customId == 'create-ticket') {
                if (
                    interaction.guild.channels.cache.find(
                        (channel) => channel.name === `ticket-${interaction.user.id}`
                    )
                ) {
                    return interaction.reply({
                        content: 'You already have a ticket open!',
                        ephemeral: true,
                    });
                }
                interaction.guild.channels
                    .create({
                        name: `ticket-${interaction.user.id}`,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.roles.everyone,
                                deny: [PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: interaction.user.id,
                                allow: [PermissionFlagsBits.ViewChannel],
                            },
                        ],
                    })
                    .then((channel) => {
                        connection.query(
                            `SELECT *
                             FROM users
                             WHERE discord = '${interaction.user.id}'`,
                            (err, result) => {
                                if (err) throw err;
                                if (result.length == 0) {
                                    return interaction.reply({
                                        content: 'You don\'t have an account linked.',
                                        ephemeral: true,
                                    });
                                }
                                let account = result[0];
                                axios
                                    .get(`${medusa.baseUrl}/store/auth`, {
                                        headers: {
                                            Cookie: `connect.sid=${account.cookie}`,
                                        },
                                    })
                                    .then((res) => {
                                        const customer = res.data.customer;

                                        const embed = new EmbedBuilder()
                                            .setTitle('New ticket')
                                            .setDescription(
                                                `Hello ${interaction.user.username}, welcome to your customer support request.`
                                            )
                                            .addFields(
                                                {
                                                    name: 'First name',
                                                    value: `${customer.first_name}`,
                                                    inline: true,
                                                },
                                                {
                                                    name: 'Last name',
                                                    value: `${customer.last_name}`,
                                                    inline: true,
                                                },
                                                {
                                                    name: 'E-mail',
                                                    value: `${customer.email}`,
                                                    inline: true,
                                                }
                                            )
                                            .setColor('#00ff00')
                                            .setTimestamp();

                                        const row = new ActionRowBuilder().addComponents(
                                            new ButtonBuilder()
                                                .setLabel('Close ticket')
                                                .setStyle('Danger')
                                                .setEmoji('🔒')
                                                .setCustomId('close-ticket')
                                        );

                                        channel.send({
                                            embeds: [embed],
                                            components: [row],
                                        });

                                        interaction.reply({
                                            content: `Successfully created ticket <#${channel.id}>`,
                                            ephemeral: true,
                                        });
                                    })
                                    .catch((err) => {
                                        console.error(err);
                                        interaction.reply({
                                            content:
                                                'Your cookie might\'ve expired. Please /login again.',
                                            ephemeral: true,
                                        });
                                        channel.delete();
                                    });
                            }
                        );
                    });
            }

            if (interaction.customId == 'close-ticket') {
                if (discord.saveTickets) {
                    interaction.reply('Saving ticket and closing it...');
                    let fs = require('fs');
                    let channel = interaction.channel;
                    let messages = await channel.messages.fetch({cache: false});
                    let text = '';
                    messages.forEach((message) => {
                        text += `<h1>${message.author.username}#${message.author.discriminator}</h1><p>${message.content}</p>`;
                    });
                    fs.writeFile(
                        `./tickets/${interaction.user.id}-${Math.random() * 1000}.html`,
                        `${text} + <style>body{background-color: #1a1a1c;font-family: Arial, Helvetica, sans-serif;color: white;}h1{font-size: x-large;margin-left: 5%;}p{margin-left: 7%;}</style>`,
                        (err) => {
                            if (err) throw err;
                            console.log('Saved ticket');
                        }
                    );
                } else {
                    interaction.reply('Closing ticket...');
                }
                setTimeout(() => {
                    interaction.channel.delete();
                }, 10000);
            }
        }
    }
    if (interaction.isSelectMenu()) {
        if (interaction.customId.startsWith('prod')) {
            axios
                .get(`${medusa.baseUrl}/store/products/${interaction.values[0]}`)
                .then((res) => {
                    let variant = res.data.product.variants[0];

                    let embed = new EmbedBuilder()
                        .setThumbnail(res.data.product.thumbnail)
                        .setTitle(res.data.product.title)
                        .setDescription(
                            `${res.data.product.description}`
                        )
                        .setFooter({
                            text: `${variant.prices[0].amount / 100} ${
                                variant.prices[0].currency_code
                            }`
                        })
                        .setColor(0x00ae86);

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: true,
                    });
                })
                .catch((err) => {
                    interaction.reply({
                        content: 'I have encountered an error.',
                        ephemeral: true,
                    });
                });
        }

        if (interaction.customId.startsWith('order')) {
            axios
                .get(
                    `${medusa.baseUrl}/store/orders/${interaction.values[0]}`
                )
                .then((res) => {
                    let order = res.data.order;
                    let date = new Date(order.created_at);

                    let embed = new EmbedBuilder()
                        .setTitle(`Order ${order.id}`)
                        .setDescription(
                            `Status: ${order.status}\n${order.items
                                .map((item) => {
                                    return `**${item.title}** - ${item.quantity}x\n`;
                                })
                                .join('')}`
                        )
                        .addFields(
                            {
                                name: 'Name',
                                value: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`,
                                inline: true,
                            },
                            {
                                name: 'Purchase date',
                                value: `${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`,
                                inline: true,
                            },
                            {
                                name: 'Shipping address',
                                value: `${order.shipping_address.address_1} ${order.shipping_address.address_2} ${order.shipping_address.postal_code}\n${order.shipping_address.city} :flag_${order.shipping_address.country_code}:`,
                                inline: true,
                            },
                            {
                                name: 'Subtotal',
                                value: `${order.subtotal / 100} ${order.currency_code}`,
                                inline: true,
                            },
                            {
                                name: 'Shipping price',
                                value: `${order.shipping_price / 100} ${order.currency_code}`,
                                inline: true,
                            },
                            {
                                name: 'Total',
                                value: `${order.total / 100} ${order.currency_code}`,
                                inline: true,
                            }
                        )
                        .setColor(0x00ae86);

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: true,
                    });
                })
        }
    }

    const {commandName} = interaction;

    switch (commandName) {
        case 'ping':
            await interaction.reply({
                content: `🏓Latency is ***${Math.abs(
                    Date.now() - interaction.createdTimestamp
                )}ms***. API Latency is ***${Math.round(client.ws.ping)}ms***.`,
                ephemeral: true,
            });
            break;

        case 'create-support-message':
            if (interaction.member.permissions.has('ADMINISTRATOR')) {
                const embed = new EmbedBuilder()
                    .setTitle('Customer Support')
                    .setAuthor({name: interaction.guild.name})
                    .setDescription(
                        'Create a ticket by clicking on one of the buttons below.'
                    )
                    .setColor(0x00ff00);

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('create-ticket')
                        .setLabel('Create Ticket')
                        .setEmoji('🎫')
                        .setStyle('Success')
                );
                await interaction.reply({
                    embeds: [embed],
                    components: [row],
                });
            } else {
                interaction.reply({
                    content: 'You don\'t have permission to use this command!',
                    ephemeral: true,
                });
            }
            break;

        case 'product':
            let query = interaction.options.getString('query');
            if (!query) {
                axios
                    .get(`${medusa.baseUrl}/store/products`).then(res => {

                    let options = [];
                    let i = 0;
                    while (i < res.data.products.length) {

                        options[i] = {
                            label: `${res.data.products[i].title}`,
                            description: `${res.data.products[i].description.substring(0, 100)}`,
                            value: `${res.data.products[i].id}`,
                        }
                        i++
                        if (i == res.data.products.length) {
                            const row = new ActionRowBuilder()
                                .addComponents(
                                    new SelectMenuBuilder()
                                        .setCustomId('product_sm')
                                        .setPlaceholder('List of products')
                                        .addOptions(options)
                                );
                            interaction.reply({
                                components: [row],
                                ephemeral: true
                            })
                        }
                    }
                })
            } else {
                if (query.startsWith('prod')) {
                    axios
                        .get(`${medusa.baseUrl}/store/products/${query}`)
                        .then((res) => {
                            let variant = res.data.product.variants[0];

                            let embed = new EmbedBuilder()
                                .setThumbnail(res.data.product.thumbnail)
                                .setDescription(
                                    `${res.data.product.id}\n\n${res.data.product.description}`
                                )
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
                            interaction.reply({
                                content: 'I have encountered an error.',
                                ephemeral: true,
                            });
                        });
                } else {
                    axios
                        .get(`${medusa.baseUrl}/store/products?title=${query}`)
                        .then((res) => {
                            if (!res.data.products[0]) return interaction.reply({
                                content: 'That product does not exist!',
                                ephemeral: true,
                            })

                            let count = 0;
                            res.data.products.forEach((product) => {
                                if (product.title == query) {
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
            }
            break;

        case 'orders':
            if (!interaction.options.getString('id')) {
                connection.query(
                    `SELECT *
                     FROM users
                     WHERE discord = '${interaction.user.id}'`,
                    (err, result) => {
                        if (err) throw err;
                        if (result.length == 0) {
                            interaction.reply({
                                content: 'You don\'t have an account linked.',
                                ephemeral: true,
                            });
                        } else {
                            let account = result[0];
                            let axiosCfg = {
                                headers: {
                                    Cookie: `connect.sid=${account.cookie}`,
                                },
                            };

                            axios
                                .get(`${medusa.baseUrl}/store/auth`, axiosCfg)
                                .then((res) => {
                                    let orders = res.data.customer.orders;
                                    if (!orders.length) {
                                        interaction.reply({
                                            content: 'You have no orders.',
                                            ephemeral: true,
                                        });
                                    } else {

                                        let options = [];
                                        let i = 0;
                                        while (i < orders.length) {
                                            options[i] = {
                                                label: `${orders[i].id}`,
                                                description: `${orders[i].status}`,
                                                value: `${orders[i].id}`,
                                            }

                                            i++
                                            if (i == orders.length) {
                                                const row = new ActionRowBuilder()
                                                    .addComponents(
                                                        new SelectMenuBuilder()
                                                            .setCustomId('orders_sm')
                                                            .setPlaceholder('List of orders')
                                                            .addOptions(options)
                                                    );
                                                interaction.reply({
                                                    components: [row],
                                                    ephemeral: true
                                                })
                                            }
                                        }
                                    }
                                })
                                .catch((err) => {
                                    interaction.reply({
                                        content:
                                            'Your cookie might\'ve expired. Please /login again.',
                                        ephemeral: true,
                                    });
                                });
                        }
                    }
                );
            } else {
                axios
                    .get(
                        `${medusa.baseUrl}/store/orders/${interaction.options.getString(
                            'id'
                        )}`
                    )
                    .then((res) => {
                        let order = res.data.order;
                        let date = new Date(order.created_at);

                        let embed = new EmbedBuilder()
                            .setTitle(`Order ${order.id}`)
                            .setDescription(
                                `Status: ${order.status}\n${order.items
                                    .map((item) => {
                                        return `**${item.title}** - ${item.quantity}x\n`;
                                    })
                                    .join('')}`
                            )
                            .addFields(
                                {
                                    name: 'Name',
                                    value: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`,
                                    inline: true,
                                },
                                {
                                    name: 'Purchase date',
                                    value: `${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`,
                                    inline: true,
                                },
                                {
                                    name: 'Shipping address',
                                    value: `${order.shipping_address.address_1} ${order.shipping_address.address_2} ${order.shipping_address.postal_code}\n${order.shipping_address.city} :flag_${order.shipping_address.country_code}:`,
                                    inline: true,
                                },
                                {
                                    name: 'Subtotal',
                                    value: `${order.subtotal / 100} ${order.currency_code}`,
                                    inline: true,
                                },
                                {
                                    name: 'Shipping price',
                                    value: `${order.shipping_price / 100} ${order.currency_code}`,
                                    inline: true,
                                },
                                {
                                    name: 'Total',
                                    value: `${order.total / 100} ${order.currency_code}`,
                                    inline: true,
                                }
                            )
                            .setColor(0x00ae86);

                        interaction.reply({
                            embeds: [embed],
                            ephemeral: true,
                        });
                    })
                    .catch((err) => {
                        interaction.reply({
                            content: 'That order ID does not exist!',
                            ephemeral: true,
                        });
                    });
            }
            break;

        case 'account-info':
            connection.query(
                `SELECT *
                 FROM users
                 WHERE discord = '${interaction.user.id}'`,
                (err, result) => {
                    if (err) throw err;
                    if (result.length == 0) {
                        interaction.reply({
                            content: 'You don\'t have an account linked.',
                            ephemeral: true,
                        });
                    } else {
                        let account = result[0];
                        let axiosCfg = {
                            headers: {
                                Cookie: `connect.sid=${account.cookie}`,
                            },
                        };

                        function country() {
                            if (!account.billing_address) {
                                return ':flag_white:';
                            } else {
                                return `:flag_${account.billing_address.country_code}:`;
                            }
                        }

                        axios
                            .get(`${medusa.baseUrl}/store/auth/`, axiosCfg)
                            .then((res) => {
                                let account = res.data.customer;

                                let unixCreatedAt = Date.parse(account.created_at);
                                let createdAt = new Date(unixCreatedAt);

                                let embed = new EmbedBuilder()
                                    .setTitle(`Account ID: ${account.id}`)
                                    .setDescription(
                                        `Account created at ${createdAt.getDate()}.${createdAt.getMonth()}.${createdAt.getFullYear()}`
                                    )
                                    .setColor(0x00ae86)
                                    .addFields(
                                        {
                                            name: 'First name',
                                            value: `${account.first_name}`,
                                            inline: true,
                                        },
                                        {
                                            name: 'Last name',
                                            value: `${account.last_name}`,
                                            inline: true,
                                        },
                                        {
                                            name: 'E-mail',
                                            value: `${account.email}`,
                                            inline: true,
                                        },
                                        {
                                            name: 'Phone',
                                            value: `${account.phone}`,
                                            inline: true,
                                        },
                                        {
                                            name: 'Orders',
                                            value: `${account.orders.length}`,
                                            inline: true,
                                        },
                                        {
                                            name: 'Billing Country',
                                            value: country(),
                                            inline: true,
                                        }
                                    );

                                interaction.reply({
                                    embeds: [embed],
                                    ephemeral: true
                                });
                            })
                            .catch((err) => {
                                interaction.reply({
                                    content: 'Your cookie might\'ve expired. Please /login again.',
                                    ephemeral: true,
                                });
                            });
                    }
                }
            );
            break;

        case 'login':
            let email = interaction.options.getString('e-mail');
            let password = interaction.options.getString('password');

            axios
                .post(`${medusa.baseUrl}/store/auth`, {
                    email: email,
                    password: password,
                })
                .then((res) => {
                    var cookie = res.headers['set-cookie'][0];
                    var token = cookie.substring(12)
                        .split(';')[0];

                    let embed = new EmbedBuilder()
                        .setTitle(`Logged in as ${email}`)
                        .setDescription(
                            `You can now safely use any command that requires authentication until 24 hours from now.`
                        )
                        .setColor(0x00ae86);

                    // if the user already exists in the database, update the token
                    connection.query(
                        `SELECT *
                         FROM users
                         WHERE discord = '${interaction.user.id}'`,
                        (err, result) => {
                            if (err) throw err;
                            if (result.length > 0) {
                                connection.query(
                                    `UPDATE users
                                     SET cookie = '${token}'
                                     WHERE discord = '${interaction.user.id}'`,
                                    (err, result) => {
                                        if (err) throw err;
                                    }
                                );
                            } else {
                                // if the user doesn't exist in the database, add them
                                connection.query(
                                    `INSERT INTO users (discord, cookie)
                                     VALUES ('${interaction.user.id}', '${token}')`,
                                    (err, result) => {
                                        if (err) throw err;
                                        console.log('Added one user to the database');
                                    }
                                );
                            }
                        }
                    );

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                })
                .catch((err) => {
                    let embed = new EmbedBuilder()
                        .setTitle(`Failed to log in`)
                        .setDescription(`Please check your credentials and try again.`)
                        .setColor(0xff0000);

                    interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                });

            break;
    }
});

client.login(discord.token);
