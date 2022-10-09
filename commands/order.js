const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data:   new SlashCommandBuilder()
    .setName("orders")
    .setDescription("Returns order information")
    .addStringOption((option) =>
      option.setName("id").setDescription("Order ID")
    )
};