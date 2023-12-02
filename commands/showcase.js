const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const dns = require('dns');

// Array of allowed IP addresses
const allowedIPs = ['51.255.80.17', '46.250.234.25', '46.250.234.35', '2.223.144.35'];

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

        // Resolve IP address
        dns.resolve4(serverData.ip, (err, addresses) => {
          if (err) {
            console.error(`Error resolving IP address for user ${userId}: ${err}`);
            interaction.reply('There was an error resolving the IP address. Try adding your server again with the addserver command!');
            return;
          }

          const resolvedIP = addresses[0];

          // Check if the resolved IP matches any allowed IP
          if (allowedIPs.includes(resolvedIP)) {
            // Assuming CHANNEL_ID is defined in your .env file
            const channelId = process.env.CHANNEL_ID;
            const channel = interaction.client.channels.cache.get(channelId);

            if (channel) {
              channel.send(`Server Information for User ${interaction.user.tag}:
                IP: ${serverData.ip}
                Port: ${serverData.port}
                Message: ${serverData.message}`);
              interaction.reply('Server information showcased successfully!');
            } else {
              console.error(`Channel with ID ${channelId} not found.`);
              interaction.reply('There was an error showcasing server information.');
            }
          } else {
            interaction.reply('Invalid IP address. Please provide a valid IP address.');
          }
        });
      } else {
        interaction.reply('No server information found. Use /addserver to add server information.');
      }
    } catch (error) {
      console.error(`Error showcasing server information for user ${userId}: ${error}`);
      interaction.reply('There was an error while showcasing server information.');
    }
  },
};
