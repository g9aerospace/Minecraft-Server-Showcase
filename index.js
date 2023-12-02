const { Client, Intents } = require('discord.js');
const { config } = require('dotenv');
const fs = require('fs');

config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const { BOT_TOKEN, GUILD_ID } = process.env;

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  registerSlashCommands();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  console.log(`Command received: ${commandName} from ${interaction.user.tag}`);

  if (!client.commands.has(commandName)) return;

  try {
    await client.commands.get(commandName).execute(interaction);
  } catch (error) {
    console.error(`Error executing command ${commandName}: ${error}`);
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
    console.log(`Command registered: ${command.data.name}`);
  }

  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    console.error(`Guild with ID ${GUILD_ID} not found.`);
    return;
  }

  guild.commands.set(commands)
    .then(() => console.log('Slash commands registered successfully!'))
    .catch(error => console.error(`Error registering slash commands: ${error}`));
}
