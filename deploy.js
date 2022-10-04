const { REST, SlashCommandBuilder, Routes } = require("discord.js");
const { discord } = require("./config.json");

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with bot ping"),

  new SlashCommandBuilder()
    .setName("product")
    .setDescription("Returns product information")
    .addStringOption((option) =>
      option.setName("query").setDescription("Search query").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("order")
    .setDescription("Returns order information")
    .addStringOption((option) =>
      option.setName("id").setDescription("Order ID").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("account-info")
    .setDescription("Returns information stored about you")
    .addStringOption((option) =>
      option
        .setName("e-mail")
        .setDescription("E-mail associated with the account")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("password")
        .setDescription("Password associated with your account")
        .setRequired(true)
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(discord.token);

rest
  .put(Routes.applicationGuildCommands(discord.clientId, discord.guildId), {
    body: commands,
  })
  .then((data) =>
    console.log(`Successfully registered ${data.length} application commands.`)
  )
  .catch(console.error);
