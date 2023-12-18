const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, WebhookClient } = require('discord.js');
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

      // Log everything to bot.log, console, and webhook
      log(`Processing server information for user ${userId}.`, 'info');
      log('Server Data:', serverData, 'info');

      // Check if the file already exists
      if (fs.existsSync(filePath)) {
        // If the interaction has already been replied to, do nothing
        if (interaction.replied || interaction.deferred) return;

        // If the file exists, read the existing data
        const existingData = JSON.parse(fs.readFileSync(filePath));

        // Log existing data
        log('Existing Server Data:', existingData, 'info');

        // Update the existing data with the new serverData
        Object.assign(existingData, serverData);

        // Write the updated data back to the file
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

        // Notify the user that their data has been updated
        await interaction.reply({
          content: 'Server information updated successfully!',
          ephemeral: true,
        });

        // Log information to console
        log('Server information updated successfully!', 'info');
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

        // Log information to console
        log('Server information added successfully!', 'info');
      }

    } catch (error) {
      // Log errors in detail
      log(`Error processing server information for user ${interaction.user.id}: ${error.stack}`, 'error');
      await interaction.reply('There was an error while processing server information.');

      // Log detailed error to console
      console.error('Detailed Error:', error);
    }
  },
};

// Function to log messages with timestamp and write to file, console, and webhook
function log(message, logLevel = 'info') {
  const timestamp = new Date().toISOString();
  const formattedLogLevel = typeof logLevel === 'string' ? logLevel : 'info';
  const logMessage = `[${timestamp}] [${formattedLogLevel.toUpperCase()}] ${message}`;

  // Append the log to the bot.log file
  fs.appendFileSync('/bot.log', logMessage + '\n', 'utf8');

  // Log to console
  if (formattedLogLevel.toLowerCase() === 'error') {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }

  // Log to webhook
  try {
    const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_URL });
    webhookClient.send({
      content: logMessage,
    });
  } catch (webhookError) {
    // Log webhook error to console
    console.error(`Error sending log to webhook: ${webhookError}`);
  }
}
