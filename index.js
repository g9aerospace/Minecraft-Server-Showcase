const { Client, Intents } = require('discord.js');
const dotenv = require('dotenv');
const dns = require('dns');
const winston = require('winston');

// Load environment variables from .env file
dotenv.config();

// Create a new instance of the Discord.js client with intents
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,         // Enable guild-related events
    Intents.FLAGS.GUILD_MESSAGES, // Enable message-related events
    // Add other intents your bot requires
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

// Event listener when the bot is ready
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Event listener for incoming messages
client.on('messageCreate', async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Check if the message is in the specified channel
  const channelId = process.env.CHANNEL_ID;
  if (message.channel.id !== channelId) return;

  // Get the content of the user's message
  const userMessageContent = message.content.trim();

  // Extract domain and port from the user's message
  const userDomainAndPort = extractDomainAndPort(userMessageContent);

  if (!userDomainAndPort) {
    // Invalid user input
    logError('Invalid user input', userMessageContent);
    // Ask the user to provide a valid domain and port
    message.reply('Please provide a valid domain and port in the format: `domain:port`');
    return;
  }

  // Check if domain or port is missing and ask for the missing information
  const { domain, port } = userDomainAndPort;
  if (!domain) {
    message.reply('Please provide a valid domain in the format: `domain:port`');
    return;
  }

  if (!port) {
    message.reply('Please provide a valid port in the format: `domain:port`');
    return;
  }

  try {
    // Resolve IP addresses for pre-specified domains
    const preSpecifiedDomains = ['hel1.bbn.one', 'sgp1.bbn.one', 'mum1.bbn.one', 'fsn1.bbn.one'];
    const domainToIPMap = await resolveIPs(preSpecifiedDomains);

    // Resolve IP address for the user-provided domain
    const userDomain = userDomainAndPort.domain;
    const userDomainIP = await resolveIP(userDomain);

    // Check if the user-provided IP matches any of the pre-specified domains
    const isValidIP = preSpecifiedDomains.some((domain) => domainToIPMap[domain] === userDomainIP);

    // React to the message based on the result
    if (isValidIP) {
      // Scenario A: User-provided IP matches a pre-specified domain
      message.react('👍');
    } else {
      // Scenario B: User-provided IP does not match any pre-specified domain
      message.react('❌');
    }
  } catch (error) {
    // Handle errors
    logError('Error processing message', error.message);
    message.react('❌');
  }
});

// Function to extract domain and port from the user's message
function extractDomainAndPort(message) {
  const match = message.match(/^(.+?):(\d+)$/);
  if (match) {
    const domain = match[1];
    const port = match[2];

    // Validate domain (you might want to use a more robust validation method)
    if (isValidDomain(domain)) {
      return { domain, port };
    }
  }
  return null;
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
    dns.resolve(domain, (error, addresses) => {
      if (error) {
        reject(error);
      } else {
        resolve(addresses[0]);
      }
    });
  });
}

// Function to log errors with details
function logError(message, details) {
  logger.error(`${message}: ${details}`);
}

// Login to Discord with the bot token
client.login(process.env.BOT_TOKEN);
