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

// Register commands dynamically
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
          console.error(`Error handling command '${commandName}': ${error.message}`);
          await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });
      }
  }

  if (interaction.isModalSubmit() && interaction.customId === 'addServerCommand') {
      // Extract data from modal submissions
      const serverName = interaction.fields.getTextInputValue('nameInput');
      const serverAddress = interaction.fields.getTextInputValue('addressInput');
      const message = interaction.fields.getTextInputValue('messageInput');

      // Do something with the submitted data
      console.log({ serverName, serverAddress, message });

      // Reply to the user
      await interaction.reply({ content: 'Server information received successfully!', ephemeral: true });
  }
});

client.login(process.env.BOT_TOKEN);
