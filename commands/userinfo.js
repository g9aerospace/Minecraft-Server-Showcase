// userinfo.js

const { MessageEmbed } = require('discord.js');
const { log } = require('../assets/logger');
const { name, icon } = require('../package.json');
const fs = require('fs').promises;

module.exports = {
    data: {
        name: 'userinfo',
        description: 'Display user information.',
        options: [
            {
                type: 6,  // Correct type for USER
                name: 'user',
                description: 'The user to get information about.',
                required: false,
            },
        ],
    },
    async execute(interaction) {
        try {
            log('INFO', 'Userinfo command executed', interaction.guild.name);

            // Check if a user is mentioned
            const mentionedUser = interaction.options.getUser('user');
            const targetUser = mentionedUser || interaction.user;

            // Read data from the user's JSON file in the "users" folder
            const filePath = `./users/${targetUser.id}.json`;

            try {
                const userData = await fs.readFile(filePath, 'utf-8');
                const { serverName, serverAddress, message } = JSON.parse(userData);

                // Create an embed with user details and data from the JSON file
                const embed = {
                    color: 0x0099ff,
                    title: `User Information for ${targetUser.username}`,
                    fields: [
                        { name: 'Server Name', value: serverName || 'Not specified', inline: false },
                        { name: 'Address', value: '```' + (serverAddress || 'Not specified') + '```', inline: false },
                        { name: 'Message', value: message || 'No custom message', inline: false },
                    ],
                    footer: {
                        text: name,
                        icon_url: icon,
                    },
                };

                // Reply to the interaction with the embedded message
                await interaction.reply({ embeds: [embed], ephemeral: true });
            } catch (error) {
                // If the file doesn't exist or there is an error reading it
                log('ERROR', `Error reading data for user ${targetUser.id}: ${error.message}`, interaction.guild.name);
                console.error(error);
                await interaction.reply({ content: 'No user data found.', ephemeral: true });
            }

        } catch (error) {
            log('ERROR', `Error executing userinfo command: ${error.message}`, interaction.guild.name);
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });
        }
    },
};
