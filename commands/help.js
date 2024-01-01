const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get information about available commands'),

  execute(interaction) {
    try {
      // Log the command execution
      log(`Help command executed by ${interaction.user.tag}`);

      // Get a list of available commands
      const commands = getAvailableCommands();

      // Create an embed with command information
      const embed = new MessageEmbed()
        .setColor('#3498db') // Blue color
        .setTitle('Command Help')
        .setDescription('List of available commands and their descriptions:')
        .addFields(
          commands.map(command => ({
            name: `/${command.name}`,
            value: command.description,
          }))
        )
        .setFooter('Embernodes', 'attachment://embernodes.png');

      // Reply with the embed
      interaction.reply({ embeds: [embed], files: ['./embernodes.png'] });
    } catch (error) {
      console.error(`Error in help command: ${error}`);
      log(`Error in help command: ${error}`, 'error');
      interaction.reply('❗There was an error while processing the command. Please try again.');
    }
  },
};

// Function to get a list of available commands
function getAvailableCommands() {
  const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
  const commands = [];

  for (const file of commandFiles) {
    const command = require(`./${file}`);
    commands.push({
      name: command.data.name,
      description: command.data.description,
    });
  }

  return commands;
}

// Function to log messages with timestamp and write to a file
function log(message, logLevel = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${logLevel.toUpperCase()}] ${message}`;

  const logFilePath = './bot.log';

  // Append the log to the specified log file
  fs.appendFileSync(logFilePath, logMessage + '\n', 'utf8');

  // Log to console
  if (logLevel === 'error') {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }
}
