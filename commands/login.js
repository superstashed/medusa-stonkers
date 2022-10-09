const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data:     new SlashCommandBuilder()
    .setName("login")
    .setDescription("Link your Storefront account to your Discord account")
    .addStringOption((option) =>
      option
        .setName("e-mail")
        .setDescription("E-mail associated with the account")
        .setRequired(true)
    ).addStringOption((option) =>
    option
      .setName("password")
      .setDescription("Password associated with your account")
      .setRequired(true)
    )
};