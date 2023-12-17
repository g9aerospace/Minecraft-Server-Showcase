const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addserver')
    .setDescription('Add server information')
    .addStringOption(option =>
      option.setName('address')
        .setDescription('Server Address (IP:Port or Domain)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Custom Message')
        .setRequired(true)),
  async execute(interaction) {
    const userId = interaction.user.id;
    let address = interaction.options.getString('address');
    
    // Check if the address contains a port, if not, check if it looks like a SRV record
    if (!address.includes(':')) {
      const isSRVRecord = address.startsWith('_') && address.includes('.');
      
      if (!isSRVRecord) {
        // Notify the user that they provided an address without a port and suggest it might be a SRV record
        await interaction.reply({
          content: 'You provided a server address without specifying a port. This may function improperly if it\'s not a SRV record. If it is a SRV record, you can ignore this message.',
          ephemeral: true,
        });
        return;
      }

      // If it's a SRV record, append a default port (e.g., 80)
      address += ':80';
    }

    const serverData = {
      address,
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
