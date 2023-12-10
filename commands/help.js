// commands/help.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays a help message'),
  async execute(interaction) {
    const embed = new MessageEmbed()
      .setTitle('Command Help')
      .setDescription('Here are the available commands and their descriptions:')
      .addFields(
        { name: '/addserver', value: '> Set the user\'s server to showcase, in the database' },
        { name: '/showcase', value: '> Showcase your own server' },
        { name: '/userinfo', value: '> Obtain details of a user\'s server from the database' },
        { name: '/whitelistedips', value: '> Obtain a list of currently whitelisted IPs that can be showcased' },
      )
      .setColor('#3498db') // Set the color to a shade of blue
      .setFooter('Embernodes', 'attachment://embernodes.png'); // Set footer text and icon

    await interaction.reply({ embeds: [embed], files: ['./embernodes.png'] });
  },
};
