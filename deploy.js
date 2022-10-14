const { REST, SlashCommandBuilder, Routes } = require("discord.js");
const { discord } = require("./config.json");

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
  .setDescription("Replies with bot ping"),

  new SlashCommandBuilder()
  .setName("create-support-message")
  .setDescription("Creates a support message"),

  new SlashCommandBuilder()
  .setName("product")
  .setDescription("Returns product information")
  .addStringOption((option) =>
  option.setName("query").setDescription("Search query").setRequired(true)
  ),

  new SlashCommandBuilder()
  .setName("orders")
  .setDescription("Returns order information")
  .addStringOption((option) =>
  option.setName("id").setDescription("Order ID")
  ),

  new SlashCommandBuilder()
  .setName("account-info")
  .setDescription("Returns account information"),

  new SlashCommandBuilder()
  .setName("login")
  .setDescription("Link your Storefront account to your Discord account")
  .addStringOption((option) =>
  option.setName("e-mail").setDescription("E-mail associated with the account").setRequired(true)
  )
  .addStringOption((option) =>
  option.setName("password").setDescription("Password associated with your account").setRequired(true)
  )
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
