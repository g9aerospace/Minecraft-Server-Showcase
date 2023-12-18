const { Client, Intents, WebhookClient } = require('discord.js');
const { config } = require('dotenv');
const fs = require('fs');

config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const { BOT_TOKEN, GUILD_ID, WEBHOOK_URL } = process.env;

// Ensure the bot.log file exists
fs.writeFileSync('bot.log', '', 'utf8');

client.once('ready', () => {
  log('Bot is ready.');
  registerSlashCommands();

  // Set up periodic log sending
  setInterval(sendLogToWebhook, 600000); // 10 minutes interval (in milliseconds)
});

client.on('interactionCreate', async (interaction) => {
  // Log every interaction
  log(`Interaction received: ${interaction.type} | ID: ${interaction.id} | User: ${interaction.user.tag}`);

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
  try {
    const webhookClient = new WebhookClient({ url: WEBHOOK_URL });
    webhookClient.send({
      content: logMessage,
    });
  } catch (webhookError) {
    console.error(`Error sending log to webhook: ${webhookError}`);
  }
}

// Function to send log file to a webhook
function sendLogToWebhook() {
  try {
    const timestamp = new Date().toISOString();
    const fileContent = fs.readFileSync('bot.log', 'utf8');

    const webhookClient = new WebhookClient({ url: WEBHOOK_URL });
    webhookClient.send({
      content: `Bot Log - ${timestamp}`,
      files: [{ attachment: Buffer.from(fileContent), name: 'bot.log' }],
    });

    log('Log file sent to webhook successfully.');
  } catch (error) {
    log(`Error sending log file to webhook: ${error}`, 'error');
  }
}
