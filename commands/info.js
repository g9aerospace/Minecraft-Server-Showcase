const { MessageEmbed } = require('discord.js');
const { log } = require('../assets/logger');
const { name, description, version, author, icon } = require('../package.json');

module.exports = {
    data: {
        name: 'info',
        description: 'Display bot information',
    },
    async execute(interaction) {
        try {
            log('INFO', 'Info command execution started', interaction.guild.name);

            // Create an embed with informative fields
            const embed = {
                color: 0x0099ff,
                title: 'Bot Information',
                fields: [
                    { name: 'Name', value: name, inline: false },
                    { name: 'Description', value: description, inline: false },
                    { name: 'Version', value: version, inline: false },
                    { name: 'Author', value: author, inline: false }
                ],
                footer: {
                    text: name,
                    icon_url: icon,
                },
            };

            // Log information about the generated embed
            log('INFO', 'Bot information embed created', interaction.guild.name);

            // Reply to the interaction with the embedded message
            await interaction.reply({ embeds: [embed] });

            // Log that the response was successfully sent
            log('INFO', 'Info command execution completed', interaction.guild.name);
        } catch (error) {
            // Log and handle errors gracefully
            log('ERROR', `Error executing info command: ${error.message}`, interaction.guild.name);

            // Reply to the interaction with an error message
            await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });

            // Log that an error response was sent
            log('ERROR', 'Error response sent to the interaction', interaction.guild.name);
        }
    },
};
