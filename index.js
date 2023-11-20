const { Client, Intents } = require('discord.js');
const dotenv = require('dotenv');
const dns = require('dns');
const winston = require('winston');
const axios = require('axios');
const mcPing = require('mc-ping-updated');

// Load environment variables from .env file
dotenv.config();

// Create a new instance of the Discord.js client with intents
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,         // Enable guild-related events
    Intents.FLAGS.GUILD_MESSAGES, // Enable message-related events
  ],
});

// Configure Winston for logging
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

// Webhook URLs for summaries, invalid input, and errors
const webhookUrlSummary = process.env.WEBHOOK_URL_SUMMARY;
const webhookUrlInvalidInput = process.env.WEBHOOK_URL_INVALID_INPUT;
const webhookUrlError = process.env.WEBHOOK_URL_ERROR;

// Event listener when the bot is ready
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Event listener for incoming messages
client.on('messageCreate', async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Extract all domain and port pairs from the user's message
  const userDomainAndPorts = extractAllDomainsAndPorts(message.content);

  if (!userDomainAndPorts.length) {
    // Invalid user input
    const errorMessage = `Invalid user input: ${message.content}`;
    logError(errorMessage);
    sendSummary(webhookUrlInvalidInput, errorMessage);
    // Ask the user to provide a valid domain and port
    message.reply('Please provide a valid domain and port in the format: `domain:port`');
    return;
  }

  // Process each domain:port pair in the message separately
  for (const userDomainAndPort of userDomainAndPorts) {
    const { domain, port } = userDomainAndPort;

    // Check if domain or port is missing and ask for the missing information
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
      // Record the start time
      const startTime = new Date();

      // Resolve IP address for the user-provided domain
      const userDomainIP = await resolveIP(domain);

      // Record the end time
      const endTime = new Date();

      // Calculate the processing time
      const processingTime = endTime - startTime;

      // Resolve IP addresses for pre-specified domains
      const preSpecifiedDomains = ['hel1.bbn.one', 'sgp1.bbn.one', 'mum1.bbn.one', 'fsn1.bbn.one'];
      const domainToIPMap = await resolveIPs(preSpecifiedDomains);

      // Check if the user-provided IP matches any of the pre-specified domains
      const isValidIP = preSpecifiedDomains.some((domain) => domainToIPMap[domain] === userDomainIP);

      console.log(`isValidIP: ${isValidIP}`);  // Add this line for debugging

      // React to the message based on the result
      if (isValidIP) {
        // Scenario A: User-provided IP matches a pre-specified domain
        message.react('👍');

        console.log('Before checking port for Minecraft server');
        console.log('Before checking port for Minecraft server');
        // Check if the port is for a Minecraft server (default is 25565)
        if (port === '25565') {
          console.log('Inside block for Minecraft server port');
          try {
            // Query Minecraft server details
            const serverDetails = await queryMinecraftServer(domain, parseInt(port));
            console.log('After querying Minecraft server');

            // Send Minecraft server details to the channel
            console.log('Before sending Minecraft server details to the channel');
            const serverDetailsMessage = `Minecraft Server Details:\n` +
              `Server IP: ${serverDetails.host}\n` +
              `Server Port: ${serverDetails.port}\n` +
              `Version: ${serverDetails.version}\n` +
              `Players Online: ${serverDetails.players.online}/${serverDetails.players.max}`;
            message.channel.send(serverDetailsMessage);
            console.log('After sending Minecraft server details to the channel');
          } catch (error) {
            // Log any errors that occur during the Minecraft server query
            console.log(`Error querying Minecraft server: ${error.message}`);
            logError(`Error querying Minecraft server: ${error.message}`);
            sendSummary(webhookUrlError, `Error querying Minecraft server: ${error.message}`);
            message.react('❌');
            return; // Added to prevent further execution in case of an error
          }
        } else {
          console.log('Port is not for a Minecraft server');
        }

        const summary = `Processed message successfully. User provided domain: ${domain}, Valid IP: ${userDomainIP}, Processing Time: ${processingTime}ms`;
        sendSummary(webhookUrlSummary, summary);
      } else {
        // Scenario B: User-provided IP does not match any pre-specified domain
        message.react('❌');
        const errorMessage = `Processed message with invalid domain. User provided domain: ${domain}, Invalid IP: ${userDomainIP}, Processing Time: ${processingTime}ms`;
        logError(errorMessage);
        sendSummary(webhookUrlInvalidInput, errorMessage);
      }
    } catch (error) {
      // Handle errors
      const errorMessage = `Error processing message: ${error.message}`;
      logError(errorMessage);
      sendSummary(webhookUrlInvalidInput, errorMessage);
      message.react('❌');
    }
  }
});

// Function to extract all domain and port pairs from the user's message
function extractAllDomainsAndPorts(message) {
  const matches = message.match(/\b([^\s]+?):(\d+)\b/g);
  if (matches) {
    return matches.map(match => {
      const [_, domain, port] = match.match(/([^\s]+?):(\d+)/);
      // Validate domain (you might want to use a more robust validation method)
      if (isValidDomain(domain)) {
        return { domain, port };
      }
      return null;
    }).filter(Boolean); // Filter out null entries
  }
  return [];
}


// Function to validate a domain (you can customize this validation)
function isValidDomain(domain) {
  return domain.includes('.');
}

// Function to resolve IP addresses for an array of domains
async function resolveIPs(domains) {
  const promises = domains.map((domain) => resolveIP(domain));
  const results = await Promise.all(promises);
  return domains.reduce((acc, domain, index) => {
    acc[domain] = results[index];
    return acc;
  }, {});
}

// Function to resolve the IP address for a domain
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

// Function to query Minecraft server details
async function queryMinecraftServer(domain, port) {
  return new Promise((resolve, reject) => {
    mcPing(domain, port, (err, res) => {
      if (err) {
        // Log the error
        logError(`Error querying Minecraft server for ${domain}:${port}: ${err.message}`);
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

// Function to send a detailed summary to a webhook
async function sendSummary(webhookUrl, summary) {
  try {
    await axios.post(webhookUrl, { content: summary });
  } catch (error) {
    // Log the error if sending to webhook fails
    logger.error(`Failed to send summary to webhook (${webhookUrl}): ${error.message}`);
  }
}


// Function to log errors with details
function logError(message) {
  logger.error(message);
}

// Login to Discord with the bot token
client.login(process.env.BOT_TOKEN);
