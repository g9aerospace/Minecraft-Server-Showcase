const { Client, Intents, MessageAttachment } = require('discord.js');
const dotenv = require('dotenv');
const dns = require('dns');
const winston = require('winston');
const axios = require('axios');
const mcPing = require('mc-ping-updated');
const { createCanvas, loadImage, registerFont } = require('canvas');

dotenv.config();

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
  ],
});

// Read channel ID from environment variable
const monitoredChannelId = process.env.CHANNEL_ID;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || message.channel.id !== monitoredChannelId) {
    // Ignore messages from bots and channels other than the specified one
    return;
  }

  const userDomainAndPorts = extractAllDomainsAndPorts(message.content);

  if (!userDomainAndPorts.length) {
    const errorMessage = `Invalid user input: ${message.content}`;
    logError(errorMessage);
    sendSummary(webhookUrlInvalidInput, errorMessage);
    message.reply('Please provide a valid domain and port in the format: `domain:port`');
    return;
  }

  for (const userDomainAndPort of userDomainAndPorts) {
    const { domain, port } = userDomainAndPort;

    if (!domain) {
      const errorMessage = 'Invalid user input: Missing domain';
      logError(errorMessage);
      sendSummary(webhookUrlInvalidInput, errorMessage);
      message.reply('Please provide a valid domain in the format: `domain:port`');
      return;
    }

    if (!port) {
      const errorMessage = 'Invalid user input: Missing port';
      logError(errorMessage);
      sendSummary(webhookUrlInvalidInput, errorMessage);
      message.reply('Please provide a valid port in the format: `domain:port`');
      return;
    }

    try {
      const startTime = new Date();
      const userDomainIP = await resolveIP(domain);
      const endTime = new Date();
      const processingTime = endTime - startTime;

      const preSpecifiedDomains = ['2.223.144.35'];
      const domainToIPMap = await resolveIPs(preSpecifiedDomains);
      const isValidIP = preSpecifiedDomains.some((domain) => domainToIPMap[domain] === userDomainIP);

      console.log(`isValidIP: ${isValidIP}`);

      if (isValidIP) {
        message.react('👍');

        const parsedPort = parseInt(port);

        console.log(`Parsed port: ${parsedPort}`);
        console.log(`Parsed port type: ${typeof parsedPort}`);
        console.log(`Parsed port value: ${parsedPort}`);
        console.log(`Condition: ${parsedPort === 25565}`);

        if (!isNaN(parsedPort)) {
          console.log('Inside block for Minecraft server port');
          try {
            const serverDetails = await queryMinecraftServer(domain, parsedPort);
            console.log('After querying Minecraft server');
        
            const motd = serverDetails.description.text;
            const playersOnline = serverDetails.players ? serverDetails.players.online : 'N/A';
        
            console.log(`MOTD: ${motd}`);
            console.log(`Players Online: ${playersOnline}`);

            // Load the background image
            const backgroundImage = await loadImage('minecraft_background.png');

            // Create a canvas and set its dimensions
            const canvas = createCanvas(400, 100);
            const context = canvas.getContext('2d');

            // Draw the background image on the canvas
            context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

            // Set the font for MOTD
            context.font = '20px Minecraft';

            // Set the text color
            context.fillStyle = '#ffffff'; // Set it to the color used in Minecraft MOTD

            // Draw the MOTD text on the canvas
            context.fillText(motd, 10, 30);

            // Convert the canvas to a buffer
            const buffer = canvas.toBuffer();

            // Create an embed for sending the MOTD as an image attachment
            const embed = {
              title: `${domain}:${parsedPort}`,
              description: `${message.content}`,
              fields: [
                {
                  name: 'Players Online',
                  value: playersOnline.toString(), // Convert to string to ensure it's a valid field value
                  inline: true, // You can adjust this based on your embed design
                },
              ],
              footer: {
                text: message.author.username,
              },
              image: {
                url: `attachment://motd.png`,
              },
            };

            // Send the embed with the image attachment
            const attachment = new MessageAttachment(buffer, 'motd.png');
            message.channel.send({ embeds: [embed], files: [attachment] });

          } catch (error) {
            console.log(`Error querying Minecraft server: ${error.message}`);
            logError(`Error querying Minecraft server: ${error.message}`);
            sendSummary(webhookUrlError, `Error querying Minecraft server: ${error.message}`);
            message.react('❌');
            return;
          }
        } else {
          console.log('Parsed port is not a valid integer. Skipping Minecraft server details.');
        }
      } else {
        message.react('❌');
        const errorMessage = `Processed message with invalid domain. User provided domain: ${domain}, Invalid IP: ${userDomainIP}, Processing Time: ${processingTime}ms`;
        logError(errorMessage);
        sendSummary(webhookUrlInvalidInput, errorMessage);
      }
    } catch (error) {
      const errorMessage = `Error processing message: ${error.message}`;
      logError(errorMessage);
      sendSummary(webhookUrlInvalidInput, errorMessage);
      message.react('❌');
    }
  }
});



function extractAllDomainsAndPorts(message) {
  const matches = message.match(/\b([^\s]+?):(\d+)\b/g);
  if (matches) {
    return matches.map(match => {
      const [_, domain, port] = match.match(/([^\s]+?):(\d+)/);
      if (isValidDomain(domain)) {
        return { domain, port };
      }
      return null;
    }).filter(Boolean);
  }
  return [];
}

function isValidDomain(domain) {
  return domain.includes('.');
}

async function resolveIPs(domains) {
  const promises = domains.map((domain) => resolveIP(domain));
  const results = await Promise.all(promises);
  return domains.reduce((acc, domain, index) => {
    acc[domain] = results[index];
    return acc;
  }, {});
}

function resolveIP(domain) {
  return new Promise((resolve, reject) => {
    dns.resolve(domain, 'A', (error, addresses) => {
      if (error) {
        reject(error);
      } else {
        resolve(addresses[0]);
      }
    });
  });
}

async function queryMinecraftServer(domain, port) {
  return new Promise((resolve, reject) => {
    mcPing(domain, port, (err, res) => {
      if (err) {
        logError(`Error querying Minecraft server for ${domain}:${port}: ${err.message}`);
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

async function sendSummary(webhookUrl, summary) {
  try {
    await axios.post(webhookUrl, { content: summary });
  } catch (error) {
    logger.error(`Failed to send summary to webhook (${webhookUrl}): ${error.message}`);
  }
}

function logError(message) {
  logger.error(message);
}

client.login(process.env.BOT_TOKEN);
