const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addserver')
    .setDescription('Add server information')
    .addStringOption(option =>
      option.setName('ip')
        .setDescription('Server IP')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('port')
        .setDescription('Server Port')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Custom Message')
        .setRequired(true)),
  async execute(interaction) {
    const userId = interaction.user.id;
    const serverData = {
      ip: interaction.options.getString('ip'),
      port: interaction.options.getInteger('port'),
      message: interaction.options.getString('message'),
    };

    try {
      const serversFolder = './servers';
      if (!fs.existsSync(serversFolder)) {
        fs.mkdirSync(serversFolder);
      }

      const filePath = `${serversFolder}/${userId}.json`;
      fs.writeFileSync(filePath, JSON.stringify(serverData, null, 2));

      // Create a MessageEmbed with blue color
      const embed = new MessageEmbed()
        .setTitle('Server Information')
        .setDescription('Server information added successfully!')
        .setFooter('Embernodes', 'attachment://embernodes.png')
        .setColor('BLUE'); // Set color to blue

      // Send the embed along with the image
      await interaction.reply({ embeds: [embed], files: ['./embernodes.png'] });
    } catch (error) {
      console.error(`Error adding server information for user ${userId}: ${error}`);
      await interaction.reply('There was an error while adding server information.');
    }
  },
};
