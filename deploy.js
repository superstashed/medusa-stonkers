const { REST, SlashCommandBuilder, Routes } = require("discord.js");
const { discord } = require("./config.json");

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

// Read command files and add them to the client.commands collection
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection
  // With the key as the command name and the value as the exported module
  commands.push(command.data.toJSON());
}


const rest = new REST({ version: "10" }).setToken(discord.token);

rest
  .put(Routes.applicationGuildCommands(discord.clientId, discord.guildId), {
    body: commands,
  })
  .then((data) =>
    console.log(`Successfully registered ${data.length} application commands.`)
  )
  .catch(console.error);
