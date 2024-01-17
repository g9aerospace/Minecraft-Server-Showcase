const { MessageEmbed } = require('discord.js');
const { log } = require('../assets/logger');
const { name, icon } = require('../package.json');
const fs = require('fs');

module.exports = {
    data: {
        name: 'help',
        description: 'Display bot commands and usage',
    },
    async execute(interaction) {
        try {
            log('INFO', 'Help command execution started', interaction.guild.name);

            // Read the contents of the "commands" folder
            const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

            // Create an array to store command information
            const commandsInfo = [];

            // Loop through each command file to extract name and description
            for (const file of commandFiles) {
                const command = require(`./${file}`);
                commandsInfo.push({
                    name: command.data.name,
                    description: command.data.description,
                });
            }

            // Create the embed
            const embed = {
                color: 0x0099ff,
                title: 'Bot Commands',
                fields: commandsInfo.map(command => ({
                    name: `/${command.name}`,
                    value: command.description,
                    inline: false,
                })),
                footer: {
                    text: name,
                    icon_url: icon,
                },
            };

            // Log information about the generated embed
            log('INFO', 'Help embed created', interaction.guild.name);

            // Reply to the interaction with the embedded message using the created embed object
            await interaction.reply({ embeds: [embed] });

            // Log that the response was successfully sent
            log('INFO', 'Help command execution completed', interaction.guild.name);
        } catch (error) {
            // Log and handle errors gracefully
            log('ERROR', `Error executing help command: ${error.message}`, interaction.guild.name);

            // Reply to the interaction with an error message
            await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });

            // Log that an error response was sent
            log('ERROR', 'Error response sent to the interaction', interaction.guild.name);
        }
    },
};
