const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, WebhookClient } = require('discord.js');
const fs = require('fs');
const fetch = require('node-fetch');

// Load environment variables
require('dotenv').config();

// Function to read whitelisted IPs from a file
function readWhitelistedIPs(filePath) {
  try {
    const ips = fs.readFileSync(filePath, 'utf-8').split('\n').map(ip => ip.trim());
    return ips.filter(Boolean); // Remove empty lines
  } catch (error) {
    logError('Error reading whitelisted IPs file', error);
    return [];
  }
}

// Array of allowed IP addresses read from the file
const allowedIPs = readWhitelistedIPs('./whitelisted-ips.txt');

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

      // Log user interaction
      logInfo(`User ${userId} invoked the showcase command.`);

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
              const serverAddress = `${serverData.ip}:${serverData.port}`;
              const embed = new MessageEmbed()
                .setColor('#00ff00')
                .setTitle(`${serverAddress}`)
                .setFooter(interaction.user.username, interaction.user.displayAvatarURL())
                .setThumbnail(`https://api.mcsrvstat.us/icon/${serverData.ip}:${serverData.port}`);

              // Add description for MOTD
              let motd = '';
              if (Array.isArray(serverDetails.motd)) {
                motd = serverDetails.motd.join('\n');
              } else if (typeof serverDetails.motd === 'object') {
                motd = serverDetails.motd.clean ? serverDetails.motd.clean.join('\n') : 'N/A';
              } else {
                motd = serverDetails.motd || 'N/A';
              }

              embed.setDescription(`\`\`\`${motd}\`\`\``);
              embed.addField('Message', serverData.message || 'N/A', false);
              embed.addField('Players', `${serverDetails.players.online}/${serverDetails.players.max}`, false);
              embed.addField('Version', serverDetails.version || 'N/A', false);

              // Add a new field for Server Software
              embed.addField('Server Software', serverDetails.software || 'N/A', false);

              // Send the embed to the specified channel
              const sentMessage = await channel.send({ embeds: [embed] });

              // Get the link to the sent message
              const embedLink = sentMessage.url;

              // Reply to the user's message with a confirmation and link to the embed
              await interaction.followUp(`Server information sent! [View Server Details](${embedLink})`);

              // Save the current execution time for the user
              commandTimeouts.set(userId, Date.now());

              // Log server information
              logInfo(`Server information sent by ${interaction.user.username} for ${serverAddress}`);

              // Log to webhook
              logToWebhook(embed, interaction.user.username, serverAddress);
            } else {
              logError(`Channel with ID ${channelId} not found.`);
              await interaction.followUp('There was an error showcasing server information.');
            }
          } catch (error) {
            logError(`Error fetching server details for user ${userId}`, error);
            await interaction.followUp('There was an error fetching server details from the Minecraft server.');

            // Log error to webhook
            logErrorToWebhook(error, interaction.user.username);
          }
        } else {
          await interaction.followUp('Invalid IP address. Please provide a valid IP address.');
        }
      } else {
        logInfo(`No server information found for user ${userId}.`);
        await interaction.followUp('No server information found. Use /addserver to add server information.');
      }

    } catch (error) {
      logError(`Error showcasing server information for user ${userId}`, error);
      await interaction.followUp('There was an error while showcasing server information.');

      // Log error to webhook
      logErrorToWebhook(error, interaction.user.username);
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
        software: data.software || 'N/A', // Added software field
      };
    } else {
      throw new Error('Server is offline or unreachable.');
    }
  } catch (error) {
    console.error(`Error fetching server details: ${error.message}`);
    throw new Error('Failed to fetch server details.');
  }
}

function logInfo(message) {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
}

function logError(message, error) {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
  console.error(error);
}

function logToWebhook(embed, username, serverAddress) {
  const webhookUrl = process.env.SHOWCASE_WEBHOOK_URL;

  if (webhookUrl) {
    const webhookClient = new WebhookClient({ url: webhookUrl });
    webhookClient.send({
      embeds: [embed],
      username: 'Showcase Logger',
      content: `Server information logged by ${username} for ${serverAddress}`,
    });
  } else {
    logError('SHOWCASE_WEBHOOK_URL not defined in the .env file. Unable to log to webhook.');
  }
}

function logErrorToWebhook(error, username) {
  const webhookUrl = process.env.SHOWCASE_WEBHOOK_URL;

  if (webhookUrl) {
    const webhookClient = new WebhookClient({ url: webhookUrl });
    webhookClient.send({
      content: `Error logged by ${username}: \`\`\`${error.message}\`\`\``,
      username: 'Showcase Error Logger',
    });
  } else {
    logError('SHOWCASE_WEBHOOK_URL not defined in the .env file. Unable to log error to webhook.');
  }
}
