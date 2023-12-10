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
      await interaction.deferReply({ ephemeral: true }); // Set ephemeral to true

      // Get the selected user ID
      const targetUser = interaction.options.getUser('target');
      const targetUserId = targetUser.id;
      const targetUsername = targetUser.username;

      // Check if the user has server information
      const filePath = `./servers/${targetUserId}.json`;

      if (fs.existsSync(filePath)) {
        // Read server information from the file
        const serverData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // Construct the server information as a hidden text message
        const serverInfoText = `**Server Information for ${targetUsername}**\n\n` +
          `> **Server IP:** ${serverData.ip || 'Not provided'}\n` +
          `> **Server Port:** ${serverData.port || 'Not provided'}\n` +
          `> **Message:** ${serverData.message || 'Not provided'}`;

        // Send the hidden text message
        await interaction.followUp({ content: serverInfoText, ephemeral: true });
      } else {
        await interaction.followUp({ content: `No server information found for ${targetUsername}.`, ephemeral: true });
      }
    } catch (error) {
      console.error(`Error in userinfo command: ${error}`);
      await interaction.followUp({ content: 'There was an error while processing the command.', ephemeral: true });
    }
  },
};
