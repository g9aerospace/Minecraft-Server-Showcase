const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelistedips')
    .setDescription('Show whitelisted IPs'),

  execute(interaction) {
    // Read whitelisted IPs from the file
    const filePath = './whitelisted-ips.txt';
    const whitelistedIPs = readWhitelistedIPs(filePath);

    // Create an embed with the whitelisted IPs
    const embed = new MessageEmbed()
      .setColor('#3498db') // Blue color
      .setTitle('Whitelisted IPs')
      .setDescription('List of whitelisted IPs:')
      .addField('IPs:', `\`\`\`\n${whitelistedIPs.join('\n')}\`\`\``)
      .setFooter('Embernodes', 'attachment://embernodes.png'); // Set footer with image attachment

    // Reply with the embed
    interaction.reply({ embeds: [embed], files: ['./embernodes.png'] });
  },
};

// Function to read whitelisted IPs from a file
function readWhitelistedIPs(filePath) {
  try {
    const ips = fs.readFileSync(filePath, 'utf-8').split('\n').map(ip => ip.trim());
    return ips.filter(Boolean); // Remove empty lines
  } catch (error) {
    console.error(`Error reading whitelisted IPs file: ${error.message}`);
    return [];
  }
}
