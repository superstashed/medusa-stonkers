const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data:   new SlashCommandBuilder()
    .setName("create-support-message")
    .setDescription("Creates a support message"),
};