const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const axios = require('axios');
const { createCanvas } = require('canvas');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('randomserver')
    .setDescription('Get details of a random server'),

  async execute(interaction) {
    try {
      const serversFolder = path.join(__dirname, '../servers');

      // Read all files in the servers folder
      let serverFiles = fs.readdirSync(serversFolder).filter(file => file.endsWith('.json'));

      if (serverFiles.length === 0) {
        return interaction.reply('No server data found.');
      }

      let success = false;
      let serverData, apiUrl;

      // Keep trying until a working server is found or no more servers to try
      while (!success && serverFiles.length > 0) {
        // Choose a random server file
        const randomServerFile = serverFiles[Math.floor(Math.random() * serverFiles.length)];
        const serverFilePath = path.join(serversFolder, randomServerFile);

        // Read the content of the chosen server file
        serverData = require(serverFilePath);
        apiUrl = `https://api.mcsrvstat.us/2/${serverData.address}`;

        try {
          const response = await axios.get(apiUrl);

          if (response.status === 200 && response.data.online) {
            console.log('Minecraft Server Response:', response.data);
            success = true;
          } else {
            console.log(`Server ${serverData.address} is offline or cannot be queried. Trying another server...`);
            // Remove the current server file from the list
            serverFiles = serverFiles.filter(file => file !== randomServerFile);
          }
        } catch (apiError) {
          console.error(`Error querying server ${serverData.address}:`, apiError.message);
          // Remove the current server file from the list
          serverFiles = serverFiles.filter(file => file !== randomServerFile);
        }
      }

      if (!success) {
        return interaction.reply('No working server found.');
      }

      await interaction.reply('Getting details of a random server..');

      try {
        // Continue with the rest of the command logic (drawing canvas, creating embed, etc.)
        const apiUrl = `https://api.mcsrvstat.us/2/${serverData.address}`;
        const response = await axios.get(apiUrl);

        if (response.status !== 200 || !response.data.online) {
          throw new Error('Error querying server information.');
        }

        console.log('Minecraft Server Response:', response.data);

        const user = interaction.user;

        try {
          // Dynamically calculate canvas dimensions based on MOTD text length and retrieved image size
          const motdText = response.data.motd.clean.length > 0 ? response.data.motd.clean[0] : 'No MOTD available';
          const canvas = createCanvas(800, 100); // Set initial width, you can adjust this as needed
          const ctx = canvas.getContext('2d'); // Moved this line here

          ctx.fillStyle = '#2E1D10'; // Brown background
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const fontSize = calculateFontSize(ctx, motdText, 'Arial', canvas.width, 40);
          ctx.font = `${fontSize}px Arial`;

          ctx.fillStyle = '#FFFFFF'; // White font
          ctx.fillText(motdText, 10, 40);

          const motdImageBuffer = canvas.toBuffer();

          // Send the MOTD image as a PNG
          const motdImageAttachment = new MessageAttachment(motdImageBuffer, 'motd.png');

          const embed = new MessageEmbed()
            .setTitle('Minecraft Server Showcase')
            .setColor('#0099FF')
            .addFields(
              { name: 'Server IP', value: serverData.address, inline: true },
              { name: 'Players Online', value: `${response.data.players.online}/${response.data.players.max}`, inline: true },
              { name: 'Version', value: response.data.version, inline: true },
              { name: 'User Message', value: serverData.message || 'No custom message provided' },
              { name: 'Software', value: response.data.software || 'Unknown', inline: true }
            )
            .setImage('attachment://motd.png') // Set the image using the attachment
            .setThumbnail(response.data.icon ? `https://api.mcsrvstat.us/icon/${serverData.address}` : 'https://via.placeholder.com/64')
            .setFooter(user.username, user.displayAvatarURL({ dynamic: true }));

          await interaction.followUp({ embeds: [embed], files: [motdImageAttachment] });
          console.log('Interaction reply successful');
        } catch (embedError) {
          console.error('Embed Generation Error:', embedError.message);
          await interaction.followUp('There was an error generating the server information embed.');
        }
      } catch (apiError) {
        console.error('API Error:', apiError.message);
        await interaction.followUp('There was an error querying the server information.');
      }
    } catch (overallError) {
      console.error('Overall Error:', overallError.message);
      await interaction.followUp('There was an unexpected error executing the command.');
    }
  },
};

// Helper function
function calculateFontSize(ctx, text, font, maxWidth, initialFontSize) {
  let fontSize = initialFontSize;

  do {
    ctx.font = `${fontSize}px ${font}`;
    const textWidth = ctx.measureText(text + '69').width;
    if (textWidth <= maxWidth) {
      break;
    }
    fontSize--;
  } while (fontSize > 0);

  return fontSize;
}
