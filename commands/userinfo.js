const { SlashCommandBuilder } = require('@discordjs/builders');
const { WebhookClient, MessageEmbed } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Fetch server information')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Select a user')
        .setRequired(false)),

  async execute(interaction) {
    try {
      // Defer the initial reply before performing the operation
      await interaction.deferReply({ ephemeral: true }); // Set ephemeral to true

      // Get the selected user ID or the ID of the user who executed the command
      const targetUser = interaction.options.getUser('target') || interaction.user;
      const targetUserId = targetUser.id;
      const targetUsername = targetUser.username;

      // Log the command execution
      log(`Userinfo command executed by ${interaction.user.tag} for user ${targetUser.tag}`);

      // Check if the user has server information
      const filePath = `./servers/${targetUserId}.json`;
      log(`Checking for server information file: ${filePath}`);

      if (fs.existsSync(filePath)) {
        // Read server information from the file
        const serverData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        log(`Server information found for user ${targetUser.tag}: ${JSON.stringify(serverData)}`);

        // Construct the server information as a hidden text message
        const serverInfoText = `**Server Information for ${targetUsername}**\n\n` +
          `> **Server Address:** ${serverData.address || 'Not provided'}\n` +
          `> **Message:** ${serverData.message || 'Not provided'}`;
        log(`Constructed server information text: ${serverInfoText}`);

        // Send the hidden text message
        await interaction.followUp({ content: serverInfoText, ephemeral: true });
        log(`Response sent for user ${targetUser.tag}`);

        // Log the successful command execution
        log(`Userinfo command successfully executed for user ${targetUser.tag}`);
      } else {
        await interaction.followUp({ content: `No server information found for ${targetUsername}.`, ephemeral: true });
        log(`No server information found for user ${targetUser.tag}`);

        // Log that no server information was found
        log(`No server information found for user ${targetUser.tag}`);
      }
    } catch (error) {
      console.error(`Error in userinfo command: ${error}`);
      await interaction.followUp({ content: 'There was an error while processing the command.', ephemeral: true });

      // Log the error
      log(`Error in userinfo command: ${error}`, 'error');
    }
  },
};

// Function to log messages with timestamp and write to file, console, and webhook
function log(message, logLevel = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${logLevel.toUpperCase()}] ${message}`;

  // Append the log to the bot.log file
  fs.appendFileSync('./bot.log', logMessage + '\n', 'utf8');

  // Log to console
  if (logLevel === 'error') {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }

  // Log to webhook with embeds
  try {
    // Assuming you have a webhook URL stored in the process.env.WEBHOOK_URL
    const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_URL });

    const embed = new MessageEmbed()
      .setColor(getLogLevelColor(logLevel))
      .setTitle(`${logLevel.toUpperCase()} Log`)
      .setDescription(`\`\`\`plaintext\n${logMessage}\n\`\`\``);

    webhookClient.send({ embeds: [embed] });
  } catch (webhookError) {
    console.error(`Error sending log to webhook: ${webhookError}`);
  }
}

// Helper function to get color based on log level
function getLogLevelColor(logLevel) {
  switch (logLevel) {
    case 'error':
      return '#FF0000'; // Red
    case 'warn':
      return '#FFA500'; // Orange
    case 'info':
      return '#00BFFF'; // Blue
    default:
      return '#808080'; // Gray for unknown log levels
  }
}
