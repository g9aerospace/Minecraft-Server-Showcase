const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('showcase')
    .setDescription('Showcase server information in a channel'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const filePath = `./servers/${userId}.json`;

    try {
      if (fs.existsSync(filePath)) {
        const serverData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // Assuming CHANNEL_ID is defined in your .env file
        const channelId = process.env.CHANNEL_ID;
        const channel = interaction.client.channels.cache.get(channelId);

        if (channel) {
          await channel.send(`Server Information for User ${interaction.user.tag}:
            IP: ${serverData.ip}
            Port: ${serverData.port}
            Message: ${serverData.message}`);
          await interaction.reply('Server information showcased successfully!');
        } else {
          console.error(`Channel with ID ${channelId} not found.`);
          await interaction.reply('There was an error showcasing server information.');
        }
      } else {
        await interaction.reply('No server information found. Use /addserver to add server information.');
      }
    } catch (error) {
      console.error(`Error showcasing server information for user ${userId}: ${error}`);
      await interaction.reply('There was an error while showcasing server information.');
    }
  },
};
