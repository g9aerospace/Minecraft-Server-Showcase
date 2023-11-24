const fs = require('fs');
const util = require('util');
const { Client, Intents } = require('discord.js');
const { ping } = require('minecraft-ping');
require('dotenv').config();

// Configure Discord client
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.MESSAGE_CONTENT,
  ],
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

// Log errors to a file
const logError = (error) => {
  const errorMessage = `[${new Date().toLocaleString()}] Error: ${error}\n`;
  fs.appendFileSync('error.log', errorMessage);
  console.error(errorMessage);
};

// Function to query Minecraft server
const queryMinecraftServer = async (ip, port) => {
  const pingPromise = util.promisify(ping);

  try {
    const result = await pingPromise({ host: ip, port });
    return result;
  } catch (error) {
    logError(`Failed to query Minecraft server: ${error}`);
    return null;
  }
};

// Function to send Minecraft server info to Discord channel
const sendMinecraftInfoToChannel = async (channel, serverInfo) => {
    try {
      const { description, players, version } = serverInfo;
      const motd = description && description.text ? description.text : 'No MOTD available';
      const onlinePlayers = players && players.online ? players.online : 0;
      const maxPlayers = players && players.max ? players.max : 0;
      const serverVersion = version && version.name ? version.name : 'Unknown';
  
      const message = `**Minecraft Server Info**
        MOTD: ${motd}
        Version: ${serverVersion}
        Players Online: ${onlinePlayers}/${maxPlayers}`;
  
      await channel.send(message);
    } catch (error) {
      logError(`Failed to send message to Discord channel: ${error}`);
    }
  };
  
  
  

// Event listener when the bot is ready
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Read JSON file from the userdata folder
  const userDataPath = './userdata/928267278540242964.json'; // Update with your actual path
  try {
    const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
    const { address } = userData;
    const [ip, port] = address.split(':');

    // Query Minecraft server
    const serverInfo = await queryMinecraftServer(ip, parseInt(port, 10));

    // Send info to Discord channel
    if (serverInfo) {
      const channel = client.channels.cache.get(CHANNEL_ID);
      if (channel) {
        sendMinecraftInfoToChannel(channel, serverInfo);
      } else {
        logError(`Invalid Discord channel ID: ${CHANNEL_ID}`);
      }
    }
  } catch (error) {
    logError(`Failed to read JSON file or parse data: ${error}`);
  }
});

// Login to Discord
client.login(BOT_TOKEN);
