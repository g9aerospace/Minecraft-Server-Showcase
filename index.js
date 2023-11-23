require('dotenv').config();
const { Client, Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.MESSAGE_CONTENT,
  ],
});

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

client.on('interactionCreate', async (interaction) => {
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

client.login(process.env.BOT_TOKEN);
