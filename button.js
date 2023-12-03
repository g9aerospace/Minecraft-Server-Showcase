const { MessageButton, MessageActionRow, MessageEmbed } = require('discord.js');
const fs = require('fs');

module.exports = {
  name: 'button',
  async execute(interaction) {
    const userId = interaction.user.id;
    const filePath = `./servers/${userId}.json`;

    try {
      // Check if the user already has server information
      if (fs.existsSync(filePath)) {
        await interaction.reply('You already have server information. If you want to update it, please use the slash command.');
        return;
      }

      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId('addServerButton')
            .setLabel('Add Server Information')
            .setStyle('PRIMARY'),
        );

      const embed = new MessageEmbed()
        .setColor('#3498db')
        .setTitle('Server Information')
        .setDescription('Click the button below to add your server information.');

      await interaction.reply({
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error(`Error handling button click for user ${userId}: ${error}`);
      await interaction.reply('There was an error handling the button click.');
    }
  },
};

// Listen for button interactions
module.exports.buttonInteraction = async (button) => {
  const userId = button.user.id;
  const filePath = `./servers/${userId}.json`;

  try {
    if (button.customId === 'addServerButton') {
      // Remove the button and update the interaction with a modal
      await button.deferUpdate();

      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId('confirmButton')
            .setLabel('Confirm')
            .setStyle('PRIMARY'),
          new MessageButton()
            .setCustomId('cancelButton')
            .setLabel('Cancel')
            .setStyle('DANGER'),
        );

      const embed = new MessageEmbed()
        .setColor('#3498db')
        .setTitle('Add Server Information')
        .setDescription('Please provide the required information for your server.');

      const modalMessage = await button.followUp({
        embeds: [embed],
        components: [row],
      });

      // Collect responses from the user in the modal
      const filter = (response) => response.user.id === userId;
      const collector = modalMessage.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async (response) => {
        if (response.customId === 'confirmButton') {
          // Process the collected data (IP, port, message)
          const ip = collector.collected.find(r => r.customId === 'ipField').values[0];
          const port = collector.collected.find(r => r.customId === 'portField').values[0];
          const message = collector.collected.find(r => r.customId === 'messageField').values[0];

          // Validate the collected data if needed

          // Save the server information to a JSON file
          const serverData = {
            ip,
            port: parseInt(port),
            message,
          };

          fs.writeFileSync(filePath, JSON.stringify(serverData, null, 2));

          // Send a confirmation message to the user
          await response.followUp('Server information added successfully!');
          collector.stop();
        } else if (response.customId === 'cancelButton') {
          // Handle cancellation
          await response.followUp('Server information addition has been cancelled.');
          collector.stop();
        }
      });

      collector.on('end', (collected, reason) => {
        if (reason === 'time') {
          // Handle timeout
          button.followUp('Server information addition timed out.');
        }
      });
    }
  } catch (error) {
    console.error(`Error handling button interaction for user ${userId}: ${error}`);
    await button.reply('There was an error handling the button interaction.');
  }
};
