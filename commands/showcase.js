const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
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
      // Defer the initial reply before performing the operation
      await interaction.deferReply();

      if (fs.existsSync(filePath)) {
        const serverData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // Resolve IP address
        const resolvedIP = await resolveIP(serverData.ip);

        // Check if the resolved IP matches any allowed IP
        if (allowedIPs.includes(resolvedIP)) {
          try {
            // Fetch detailed server information
            const serverDetails = await fetchServerDetails(serverData.ip, serverData.port);

            // Assuming CHANNEL_ID is defined in your .env file
            const channelId = process.env.CHANNEL_ID;
            const channel = interaction.client.channels.cache.get(channelId);

            if (channel) {
              // Create a new MessageEmbed with Minecraft-themed styling
              const embed = new MessageEmbed()
                .setColor('#00ff00') // Set the embed color to green
                .setTitle(`Server Information for User ${interaction.user.tag}`)
                .setFooter(interaction.user.username, interaction.user.displayAvatarURL()) // Set the embed footer to the user's username and avatar
                .setThumbnail(`https://api.mcsrvstat.us/icon/${serverData.ip}:${serverData.port}`); // Set embed thumbnail to the Minecraft server's icon (if available)

                // Add fields for server information
              // Display "Server Address" field at the beginning
              if (typeof serverData.ip === 'string' && serverData.ip.trim() !== '' && typeof serverData.port === 'number') {
                const serverAddress = `${serverData.ip}:${serverData.port}`;
                embed.addField('Server Address', '```' + serverAddress + '```', false); // Set inline to false and wrap Server Address in a code block
              }

              // Add other fields
              embed.addField('Message', serverData.message || 'N/A', false);
              embed.addField('Players', `${serverDetails.players.online}/${serverDetails.players.max}`, false);
              embed.addField('Version', serverDetails.version || 'N/A', false);

              // Handle MOTD based on its type
              let motd = '';
              if (Array.isArray(serverDetails.motd)) {
                motd = serverDetails.motd.join('\n'); // Join MOTD lines with line breaks
              } else if (typeof serverDetails.motd === 'object') {
                motd = serverDetails.motd.clean ? serverDetails.motd.clean.join('\n') : 'N/A';
              } else {
                motd = serverDetails.motd || 'N/A';
              }

              // Add the Minecraft-themed MOTD to the embed description
              embed.addField('MOTD', '```' + motd + '```', false); // Set inline to false

              // Send the embed as the follow-up message
              await interaction.followUp({ embeds: [embed] });
            } else {
              console.error(`Channel with ID ${channelId} not found.`);
              // Send an error follow-up message
              await interaction.followUp('There was an error showcasing server information.');
            }
          } catch (error) {
            console.error(`Error fetching server details for user ${userId}: ${error}`);
            // Send an error follow-up message
            await interaction.followUp('There was an error fetching server details from the Minecraft server.');
          }
        } else {
          // Send an error follow-up message
          await interaction.followUp('Invalid IP address. Please provide a valid IP address.');
        }
      } else {
        // Send an error follow-up message
        await interaction.followUp('No server information found. Use /addserver to add server information.');
      }
    } catch (error) {
      console.error(`Error showcasing server information for user ${userId}: ${error}`);
      // Send an error follow-up message
      await interaction.followUp('There was an error while showcasing server information.');
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

async function fetchServerDetails(ip, port) {
  const apiUrl = `https://api.mcsrvstat.us/2/${ip}:${port}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch server details. Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.online) {
      return {
        motd: Array.isArray(data.motd) ? data.motd.join(' ') : data.motd,
        players: {
          online: data.players.online,
          max: data.players.max,
        },
        version: data.version,
        icon: data.icon, // Add icon property to the returned object
      };
    } else {
      throw new Error('Server is offline or unreachable.');
    }
  } catch (error) {
    console.error(`Error fetching server details: ${error.message}`);
    throw new Error('Failed to fetch server details.');
  }
}
