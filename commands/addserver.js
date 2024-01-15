const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');
const { log } = require('../assets/logger');

module.exports = {
    data: {
        name: 'addserver',
        description: 'Add a new server',
    },
    async execute(interaction) {
        try {
            log('INFO', 'Add Server command execution started', interaction.guild.name);

            // Create the modal
            const addServerModal = new ModalBuilder()
                .setCustomId('add_server_modal')
                .setTitle('Add Server');

            // Create the text input components
            const serverNameInput = new TextInputBuilder()
                .setCustomId('server_name_input')
                .setLabel('Server Name')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Enter server name')
                .setRequired(true);

            // An action row can hold multiple text inputs, 
            // but for simplicity, we use one action row for one text input in this example.
            const actionRow = new ActionRowBuilder().addComponents(serverNameInput);

            // Add the action row to the modal
            addServerModal.addComponents(actionRow);

            // Show the modal to the user
            await interaction.showModal(addServerModal);

            // Collect user input
            const collector = interaction.channel.createMessageComponentCollector({
                filter: i => i.customId === 'server_name_input' && i.user.id === interaction.user.id,
                time: 30000, // 30 seconds timeout
            });

            collector.on('collect', async i => {
                // Log the server name entered by the user
                const serverName = i.values[0];
                log('INFO', `Server name received: ${serverName}`, interaction.guild.name);

                // Reply to the interaction with a confirmation message
                await interaction.followUp(`Server name received: **${serverName}**`);

                // Log that the response was successfully processed
                log('INFO', 'Add Server command execution completed', interaction.guild.name);

                // Stop collecting input
                collector.stop();
            });

            collector.on('end', collected => {
                // Clean up the message and components after the collector ends
                interaction.editReply({ components: [] });
            });
        } catch (error) {
            // Log and handle errors gracefully
            log('ERROR', `Error executing Add Server command: ${error.message}`, interaction.guild.name);
            console.error(error);

            // Reply to the interaction with an error message
            await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });

            // Log that an error response was sent
            log('ERROR', 'Error response sent to the interaction', interaction.guild.name);
        }
    },
};
