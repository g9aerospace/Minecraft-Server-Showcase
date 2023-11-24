// commands/listservers.js
const { CommandInteraction } = require('discord.js');
const util = require('minecraft-server-util');

module.exports = {
  data: {
    name: 'listservers',
    description: 'List all active Minecraft servers on the specified IP address.',
  },
  async execute(interaction) {
    try {
      // Define the IP address to query
      const ipAddress = '2.223.144.35';

      // Array to store information about active servers
      const activeServers = [];

      // Iterate through all possible ports (0 to 65535)
      for (let port = 0; port <= 65535; port++) {
        try {
          const status = await util.status(ipAddress, { port });

          // Check if the server is online
          if (status.online) {
            activeServers.push({
              address: `${ipAddress}:${port}`,
              motd: status.description.text,
            });
          }
        } catch (error) {
          // Log errors but continue with the next port
          console.error(`Error querying server on port ${port}:`, error.message);
        }
      }

      // Check if any servers are online
      if (activeServers.length > 0) {
        // Format the server information for display
        const serverList = activeServers
          .map(server => `**${server.address}**: ${server.motd}`)
          .join('\n');

        // Reply with the list of active servers
        await interaction.reply(`Active Minecraft Servers:\n${serverList}`);
      } else {
        // Reply if no servers are online
        await interaction.reply('No active Minecraft servers found.');
      }
    } catch (error) {
      // Log any unexpected errors
      console.error('Error executing /listservers command:', error.message);
      await interaction.reply('An error occurred while executing the command.');
    }
  },
};
