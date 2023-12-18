const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addserver')
    .setDescription('Add or update server information')
    .addStringOption(option =>
      option.setName('address')
        .setDescription('Server Address (IP:Port or Domain)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Custom Message')
        .setRequired(true)),
  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const address = interaction.options.getString('address');
      const userMessage = interaction.options.getString('message');

      const serverData = {
        address,
        message: userMessage,
      };

      const serversFolder = './servers';
      const filePath = `${serversFolder}/${userId}.json`;

      // Check if the file already exists
      if (fs.existsSync(filePath)) {
        // If the interaction has already been replied to, do nothing
        if (interaction.replied || interaction.deferred) return;

        // If the file exists, read the existing data
        const existingData = JSON.parse(fs.readFileSync(filePath));

        // Update the existing data with the new serverData
        Object.assign(existingData, serverData);

        // Write the updated data back to the file
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

        // Notify the user that their data has been updated
        await interaction.reply({
          content: 'Server information updated successfully!',
          ephemeral: true,
        });
      } else {
        // If the interaction has already been replied to, do nothing
        if (interaction.replied || interaction.deferred) return;

        // If the file doesn't exist, create a new one with the provided data
        fs.writeFileSync(filePath, JSON.stringify(serverData, null, 2));

        // Notify the user that their data has been added
        await interaction.reply({
          content: 'Server information added successfully!',
          ephemeral: true,
        });
      }

      // Log information to console
      console.log(`Server information processed for user ${userId}.`);
      console.log('Server Data:', serverData);

    } catch (error) {
      console.error(`Error processing server information for user ${interaction.user.id}:`, error);
      await interaction.reply('There was an error while processing server information.');
    }
  },
};
