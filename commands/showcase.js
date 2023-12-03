const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const fetch = require('node-fetch');

// Array of allowed IP addresses
const allowedIPs = ['51.255.80.17', '46.250.234.25', '46.250.234.35', '2.223.144.35'];

// Map to store the last execution time for each user
const commandTimeouts = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('showcase')
    .setDescription('Showcase server information in a channel'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const filePath = `./servers/${userId}.json`;

    try {
      // Check if the user is within the timeout period
      const lastExecutionTime = commandTimeouts.get(userId);
      if (lastExecutionTime && Date.now() - lastExecutionTime < 24 * 60 * 60 * 1000) {
        const remainingTime = 24 * 60 * 60 * 1000 - (Date.now() - lastExecutionTime);
        await interaction.reply(`You are still on timeout. Please wait ${Math.ceil(remainingTime / (60 * 60 * 1000))} hours before using this command again.`);
        return;
      }

      // Defer the initial reply before performing the operation
      await interaction.deferReply();

      if (fs.existsSync(filePath)) {
        const serverData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const resolvedIP = await resolveIP(serverData.ip);

        if (allowedIPs.includes(resolvedIP)) {
          try {
            const serverDetails = await fetchServerDetails(serverData.ip, serverData.port);

            // Assuming CHANNEL_ID is defined in your .env file
            const channelId = process.env.CHANNEL_ID;
            const channel = interaction.client.channels.cache.get(channelId);

            if (channel) {
              const embed = new MessageEmbed()
                .setColor('#00ff00')
                .setFooter(interaction.user.username, interaction.user.displayAvatarURL())
                .setThumbnail(`https://api.mcsrvstat.us/icon/${serverData.ip}:${serverData.port}`);

              // Add fields for server information
              if (typeof serverData.ip === 'string' && serverData.ip.trim() !== '' && typeof serverData.port === 'number') {
                const serverAddress = `${serverData.ip}:${serverData.port}`;
                embed.addField('Server Address', '```' + serverAddress + '```', false);
              }

              embed.addField('Message', serverData.message || 'N/A', false);
              embed.addField('Players', `${serverDetails.players.online}/${serverDetails.players.max}`, false);
              embed.addField('Version', serverDetails.version || 'N/A', false);

              let motd = '';
              if (Array.isArray(serverDetails.motd)) {
                motd = serverDetails.motd.join('\n');
              } else if (typeof serverDetails.motd === 'object') {
                motd = serverDetails.motd.clean ? serverDetails.motd.clean.join('\n') : 'N/A';
              } else {
                motd = serverDetails.motd || 'N/A';
              }

              embed.addField('MOTD', '```' + motd + '```', false);

              // Send the embed to the specified channel
              const sentMessage = await channel.send({ embeds: [embed] });

              // Get the link to the sent message
              const embedLink = sentMessage.url;

              // Reply to the user's message with a confirmation and link to the embed
              await interaction.followUp(`Server information sent! [View Server Details](${embedLink})`);
            } else {
              console.error(`Channel with ID ${channelId} not found.`);
              await interaction.followUp('There was an error showcasing server information.');
            }
          } catch (error) {
            console.error(`Error fetching server details for user ${userId}: ${error}`);
            await interaction.followUp('There was an error fetching server details from the Minecraft server.');
          }
        } else {
          await interaction.followUp('Invalid IP address. Please provide a valid IP address.');
        }
      } else {
        await interaction.followUp('No server information found. Use /addserver to add server information.');
      }

      // Save the current execution time for the user
      commandTimeouts.set(userId, Date.now());

    } catch (error) {
      console.error(`Error showcasing server information for user ${userId}: ${error}`);
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
        icon: data.icon,
      };
    } else {
      throw new Error('Server is offline or unreachable.');
    }
  } catch (error) {
    console.error(`Error fetching server details: ${error.message}`);
    throw new Error('Failed to fetch server details.');
  }
}
