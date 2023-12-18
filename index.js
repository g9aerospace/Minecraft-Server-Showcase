const { Client, Intents, WebhookClient } = require('discord.js');
const { config } = require('dotenv');
const fs = require('fs');

// Load environment variables from a .env file
config();

// Declare constants
const { BOT_TOKEN, GUILD_ID, WEBHOOK_URL } = process.env;

// Create an instance of the Discord client with necessary intents
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// Ensure the bot.log file exists
fs.writeFileSync('bot.log', '', 'utf8');

client.once('ready', () => {
  log('Bot is ready.');
  registerSlashCommands();
});

client.on('interactionCreate', async (interaction) => {
  // Log every interaction
  log(`Interaction received: ${interaction.type} | ID: ${interaction.id} | User: ${interaction.user.tag}`);

  // Log additional details for each interaction
  log(`Guild: ${interaction.guild ? interaction.guild.name : 'DM'}`);
  log(`Channel: ${interaction.channel.name} (${interaction.channel.type})`);
  log(`Command: ${interaction.commandName}`);
  log(`Options: ${JSON.stringify(interaction.options)}`);
  
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  // Log slash command usage
  log(`Slash Command received: ${commandName} from ${interaction.user.tag}`);

  if (!client.commands.has(commandName)) return;

  try {
    const startTimestamp = new Date();

    await client.commands.get(commandName).execute(interaction);

    const endTimestamp = new Date();
    const timeTaken = endTimestamp - startTimestamp;

    // Log bot's response with timestamp and time taken
    log(`Bot response for ${commandName} sent in ${timeTaken}ms`);
  } catch (error) {
    // Log errors in detail
    log(`Error executing command ${commandName}: ${error.stack}`, 'error');
    interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

client.login(BOT_TOKEN);

client.commands = new Map();

function registerSlashCommands() {
  const commands = [];

  const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
    log(`Command registered: ${command.data.name}`);
  }

  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    log(`Guild with ID ${GUILD_ID} not found.`);
    return;
  }

  guild.commands.set(commands)
    .then(() => log('Slash commands registered successfully!'))
    .catch(error => log(`Error registering slash commands: ${error}`, 'error'));
}

// Function to log messages with timestamp and write to file, console, and webhook
function log(message, logLevel = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${logLevel.toUpperCase()}] ${message}`;

  // Append the log to the bot.log file
  fs.appendFileSync('bot.log', logMessage + '\n', 'utf8');

  // Log to console
  if (logLevel === 'error') {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }

  // Log to webhook
  sendLogToWebhook(logMessage);
}

// Function to send log message to the webhook as embed
async function sendLogToWebhook(logMessage) {
  try {
    const webhookClient = new WebhookClient({ url: WEBHOOK_URL });

    // Split log message into lines
    const logLines = logMessage.split('\n');

    // Create an embed for each line of log
    for (const line of logLines) {
      const embed = {
        title: 'Log Message',
        description: line,
        color: getColorForLogLevel(line),
        timestamp: new Date(),
        footer: {
          text: 'Bot Log',
        },
      };

      await webhookClient.send({ embeds: [embed] });
    }
  } catch (webhookError) {
    console.error(`Error sending log to webhook: ${webhookError}`);
  }
}

// Function to determine color for embed based on log level
function getColorForLogLevel(logLine) {
  const logLevel = logLine.match(/\[([^\]]+)\]/);
  if (logLevel) {
    switch (logLevel[1].toUpperCase()) {
      case 'ERROR':
        return 0xFF0000; // Red
      case 'INFO':
        return 0x00FF00; // Green
      // Add more cases for other log levels if needed
      default:
        return 0xFFFFFF; // White (default)
    }
  }
  return 0xFFFFFF; // White (default)
}
