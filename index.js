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

// Function to register all commands
async function registerCommands(guild) {
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        try {
            await guild.commands.create(command.data);
            log('INFO', `Slash command loaded/reloaded in guild ${guild.name}: ${command.data.name}`);
        } catch (error) {
            log('ERROR', `Error loading/reloading command '${command.data.name}': ${error.message}`);
        }
    }
}

client.once('ready', async () => {
    log('INFO', `Logged in as ${client.user.tag}`);
    log('INFO', 'Bot is now ready.');

    try {
        const guildId = process.env.GUILD_ID;
        const guild = await client.guilds.fetch(guildId);
        await guild.commands.set([]);

        // Register all commands on startup
        await registerCommands(guild);

        log('INFO', 'All commands registered successfully.');

    } catch (error) {
        log('ERROR', 'Error during startup:', error.message);
    }
});

// Handle interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand() && !interaction.isModalSubmit()) return;

  if (interaction.isCommand()) {
      const { commandName } = interaction;

      try {
          // Dynamically handle commands based on the command name
          const command = require(`./commands/${commandName}.js`);
          await command.execute(interaction);
      } catch (error) {
          await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });
      }
  }

  if (interaction.isModalSubmit() && interaction.customId === 'addServerCommand') {
      // Extract data from modal submissions
      const serverName = interaction.fields.getTextInputValue('nameInput');
      const serverAddress = interaction.fields.getTextInputValue('addressInput');
      const message = interaction.fields.getTextInputValue('messageInput');

      // Save data to a JSON file named after the user's userId in the users folder
      const userId = interaction.user.id;
      const userData = { serverName, serverAddress, message };

      // Specify the file path
      const filePath = `./users/${userId}.json`;

      try {
          // Ensure the "users" directory exists, create it if not
          await fs.promises.mkdir('./users', { recursive: true });

          // Write the data to the JSON file
          await fs.promises.writeFile(filePath, JSON.stringify(userData, null, 2));
      } catch (error) {
          await interaction.reply({ content: 'There was an error while processing your request.', ephemeral: true });
          return;
      }

      // Reply to the user
      await interaction.reply({ content: 'Server information received and saved successfully!', ephemeral: true });
  }
});
client.login(process.env.BOT_TOKEN);
