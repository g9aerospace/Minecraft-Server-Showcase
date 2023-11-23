require('dotenv').config();
const { Client, Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

// Main bot setup
const mainBot = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.MESSAGE_CONTENT,
  ],
});

const mainCommands = [];
const mainCommandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of mainCommandFiles) {
  const command = require(`./commands/${file}`);
  mainCommands.push(command.data.toJSON());
}

const mainRest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await mainRest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: mainCommands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

mainBot.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  // Check if the user has the required role
  const requiredRole = process.env.ROLE_ID;
  if (!interaction.member.roles.cache.has(requiredRole)) {
    return interaction.reply({
      content: 'You do not have the required role to use this command.',
      ephemeral: true,
    });
  }

  try {
    // Execute the command dynamically based on the commandName
    const command = require(`./commands/${commandName}`);
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    return interaction.reply({ content: 'Error executing the command.', ephemeral: true });
  }
});

mainBot.login(process.env.BOT_TOKEN);

// Additional channel monitoring setup
const channelMonitor = require('./mc');
