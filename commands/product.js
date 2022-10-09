const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("product")
    .setDescription("Returns product information")
    .addStringOption((option) =>
      option.setName("query").setDescription("Search query").setRequired(true)
    )
};