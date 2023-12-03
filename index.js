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
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  log(`Command received: ${commandName} from ${interaction.user.tag}`);

  if (!client.commands.has(commandName)) return;

  try {
    await client.commands.get(commandName).execute(interaction);
  } catch (error) {
    log(`Error executing command ${commandName}: ${error}`);
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
    .catch(error => log(`Error registering slash commands: ${error}`));
}

// Function to log messages with timestamp and write to file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);

  // Append the log to the bot.log file
  fs.appendFileSync('bot.log', logMessage + '\n', 'utf8');
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
    log(`Error sending log file to webhook: ${error}`);
  }
}
