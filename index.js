// Import necessary modules and environment variables
const { Client, Intents } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
  ],
});

// Import other files
const { handleCommand } = require('./commands');

// Event listener for 'ready'
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Event listener for 'messageCreate'
client.on('messageCreate', handleCommand);

// Log in to Discord
client.login(process.env.BOT_TOKEN);
