const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get information about available commands'),

  async execute(interaction) {
    try {
      // Defer the initial reply before performing the operation
      await interaction.deferReply();

      // Read command files from the 'commands' directory
      const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

      // Create an embed to display command information
      const helpEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Bot Commands Help')
        .setDescription('Here are the available commands and their descriptions:')
        .setTimestamp();

      // Loop through command files and add information to the embed
      for (const file of commandFiles) {
        const command = require(`./${file}`);
        helpEmbed.addField(`/${command.data.name}`, command.data.description);
      }

      // Send the embed to the user
      await interaction.followUp({ embeds: [helpEmbed] });
    } catch (error) {
      console.error(`Error in help command: ${error}`);
      await interaction.followUp('There was an error while processing the command.');
    }
  },
};
