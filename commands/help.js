// commands/help.js
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays a help message'),
  async execute(interaction) {
    const helpMessage = 'This is a simple help message. Customize it as needed.';
    await interaction.reply(helpMessage);
  },
};
