const { MessageEmbed } = require('discord.js');
const { log } = require('../assets/logger');
const { name, icon } = require('../package.json'); 

module.exports = {
    data: {
        name: 'ping',
        description: 'Ping command',
    },
    async execute(interaction) {
        try {
            log('INFO', 'Ping command executed', interaction.guild.name);

            // Calculate the bot's latency
            const latency = Math.abs(Date.now() - interaction.createdTimestamp);

            // Calculate bot uptime
            const uptime = process.uptime();
            const formattedUptime = formatUptime(uptime);

            // Create an embed with latency and uptime fields
            const embed = {
                color: 0x0099ff,
                title: 'Pong!',
                fields: [
                    { name: 'Bot Latency', value: `${latency}ms`, inline: true },
                    { name: 'Bot Uptime', value: formattedUptime, inline: true },
                ],
                footer: {
                    text: name,
                    icon_url: icon,
                },
            };

            // Reply to the interaction with the embedded message
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            log('ERROR', `Error executing ping command: ${error.message}`, interaction.guild.name);
            await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });
        }
    },
};

// Function to format uptime in a readable way
function formatUptime(uptime) {
    const seconds = Math.floor(uptime % 60);
    const minutes = Math.floor((uptime / 60) % 60);
    const hours = Math.floor(uptime / 3600);

    return `${hours}h ${minutes}m ${seconds}s`;
}
