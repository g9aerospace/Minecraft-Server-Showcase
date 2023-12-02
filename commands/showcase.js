const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const fetch = require('node-fetch');

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
        const resolvedIP = await resolveIP(serverData.ip);

        // Check if the resolved IP matches any allowed IP
        if (allowedIPs.includes(resolvedIP)) {
          try {
            // Fetch MOTD from the Minecraft server
            const motd = await fetchMOTD(serverData.ip, serverData.port);

            // Assuming CHANNEL_ID is defined in your .env file
            const channelId = process.env.CHANNEL_ID;
            const channel = interaction.client.channels.cache.get(channelId);

            if (channel) {
              const message = `Server Information for User ${interaction.user.tag}:
                IP: ${serverData.ip}
                Port: ${serverData.port}
                Message: ${serverData.message}
                MOTD: ${motd}`;

              channel.send(message);
              interaction.reply('Server information showcased successfully!');
            } else {
              console.error(`Channel with ID ${channelId} not found.`);
              interaction.reply('There was an error showcasing server information.');
            }
          } catch (error) {
            console.error(`Error fetching MOTD for user ${userId}: ${error}`);
            interaction.reply('There was an error fetching the MOTD from the Minecraft server.');
          }
        } else {
          interaction.reply('Invalid IP address. Please provide a valid IP address.');
        }
      } else {
        interaction.reply('No server information found. Use /addserver to add server information.');
      }
    } catch (error) {
      console.error(`Error showcasing server information for user ${userId}: ${error}`);
      interaction.reply('There was an error while showcasing server information.');
    }
  },
};

async function resolveIP(ip) {
  return new Promise((resolve, reject) => {
    require('dns').resolve4(ip, (err, addresses) => {
      if (err) reject(err);
      else resolve(addresses[0]);
    });
  });
}

async function fetchMOTD(ip, port) {
  const apiUrl = `https://api.mcsrvstat.us/2/${ip}:${port}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.online) {
      let motd;
      if (Array.isArray(data.motd)) {
        motd = data.motd.join(' ');
      } else if (typeof data.motd === 'object') {
        motd = data.motd.clean.join(' ');
      } else {
        motd = data.motd;
      }

      return motd;
    } else {
      throw new Error('Server is offline or unreachable.');
    }
  } catch (error) {
    throw new Error(`Error fetching MOTD: ${error.message}`);
  }
}
