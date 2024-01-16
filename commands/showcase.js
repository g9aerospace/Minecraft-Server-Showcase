// commands/showcase.js

const { MessageEmbed } = require('discord.js');
const fs = require('fs').promises;
const { log } = require('../assets/logger');
const { name, icon } = require('../package.json');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    data: {
        name: 'showcase',
        description: 'Showcase user data.',
    },
    async execute(interaction) {
        try {
            // Get user ID
            const userId = interaction.user.id;

            // Specify the file path
            const filePath = `./users/${userId}.json`;

            // Read data from the JSON file
            const userData = await fs.readFile(filePath, 'utf8');
            const userDataJson = JSON.parse(userData);

            // Create an embed with user data using Direct Object Initialization
            const embed = {
                color: 0x0099ff,
                title: 'User Showcase',
                fields: [
                    { name: 'Server Name', value: userDataJson.serverName, inline: true },
                    { name: 'Server Address', value: userDataJson.serverAddress, inline: true },
                    { name: 'Additional Message', value: userDataJson.message },
                ],
                footer: {
                    text: name,
                    icon_url: icon,
                },
            };

            // Send the embed to the showcase webhook
            const showcaseWebhookUrl = process.env.SHOWCASE_WEBHOOK_URL;

            if (showcaseWebhookUrl) {
                await sendToWebhook(showcaseWebhookUrl, embed);
                await interaction.reply('User showcase sent successfully!');
            } else {
                log('ERROR', 'SHOWCASE_WEBHOOK_URL is not defined in the environment variables.');
                await interaction.reply('Failed to send user showcase. Please check the bot configuration.');
            }

        } catch (error) {
            log('ERROR', `Error in executing showcase command: ${error.message}`);
            await interaction.reply('There was an error while processing the showcase command.');
        }
    },
};

async function sendToWebhook(webhookUrl, embed) {
    try {
        await axios.post(webhookUrl, {
            embeds: [embed],
        });

        log('INFO', 'User showcase sent to webhook successfully');
    } catch (error) {
        log('ERROR', `Failed to send user showcase to webhook: ${error.message}`);
        throw new Error('Failed to send user showcase to webhook');
    }
}
