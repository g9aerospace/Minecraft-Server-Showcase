const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Fetch server information of another user')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Select a user')
        .setRequired(true)),

  async execute(interaction) {
    try {
      // Defer the initial reply before performing the operation
      await interaction.deferReply();

      // Get the selected user ID
      const targetUserId = interaction.options.getUser('target').id;

      // Check if the user has server information
      const filePath = `./servers/${targetUserId}.json`;

      if (fs.existsSync(filePath)) {
        // Read server information from the file
        const serverData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // Construct the server information as a text message
        const serverInfoText = `**Server Information**\n\n` +
          `> **Server IP:** ${serverData.ip || 'Not provided'}\n` +
          `> **Server Port:** ${serverData.port || 'Not provided'}\n` +
          `> **Message:** ${serverData.message || 'Not provided'}`;

        await interaction.followUp(serverInfoText);
      } else {
        await interaction.followUp('No server information found for the selected user.');
      }
    } catch (error) {
      console.error(`Error in userinfo command: ${error}`);
      await interaction.followUp('There was an error while processing the command.');
    }
  },
};