const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { log } = require('../assets/logger');

module.exports = {
    data: {
        name: 'addserver',
        description: 'Add a new server.',
    },
    async execute(interaction) {
        try {
            log('INFO', 'Command execution started: addserver');

            // Create the modal
            const modal = new ModalBuilder()
                .setCustomId('addServerCommand')
                .setTitle('Add Server');

            // Create the text input components
            const nameInput = new TextInputBuilder()
                .setCustomId('nameInput')
                .setLabel('Server Name')
                .setStyle(TextInputStyle.Short);

            const addressInput = new TextInputBuilder()
                .setCustomId('addressInput')
                .setLabel('Server Address')
                .setStyle(TextInputStyle.Short);

            const messageInput = new TextInputBuilder()
                .setCustomId('messageInput')
                .setLabel('Additional Message (max 100 characters)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100);

            // Add inputs to the modal
            const nameRow = new ActionRowBuilder().addComponents(nameInput);
            const addressRow = new ActionRowBuilder().addComponents(addressInput);
            const messageRow = new ActionRowBuilder().addComponents(messageInput);

            modal.addComponents(nameRow, addressRow, messageRow);

            // Show the modal to the user
            await interaction.showModal(modal);

            log('INFO', 'Modal displayed to user');

            log('INFO', 'Command execution completed: addserver');
        } catch (error) {
            log('ERROR', `Error executing addserver command: ${error.message}`);

            if (error instanceof DiscordAPIError) {
                log('ERROR', `Discord API Error: ${error.code}`);
            }

            if (error.response && error.response.data) {
                log('ERROR', `API Response Data: ${JSON.stringify(error.response.data)}`);
            }
        }
    },
};
