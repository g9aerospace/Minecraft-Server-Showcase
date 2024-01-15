const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const { log } = require('./assets/logger');

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', async () => {
  log('INFO', `Logged in as ${client.user.tag}`);
  log('INFO', 'Bot is now ready.');

  const guildId = process.env.GUILD_ID;

  const guild = await client.guilds.fetch(guildId);
  await guild.commands.set([]);

  const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    await guild.commands.create(command.data);
    log('INFO', `Slash command loaded/reloaded in guild ${guild.name}: ${file}`);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

client.login(process.env.BOT_TOKEN);
