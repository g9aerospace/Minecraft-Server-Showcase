const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('showcase')
    .setDescription('Showcase Minecraft server information'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const filePath = `./servers/${userId}.json`;

    try {
      if (!fs.existsSync(filePath)) {
        await interaction.reply('You have not added any server information. Use the `/addserver` command to add server details.');
        return;
      }

      const userData = fs.readFileSync(filePath, 'utf8');
      const serverData = JSON.parse(userData);
      const { address, message: userMessage } = serverData;

      const apiUrl = `https://api.mcsrvstat.us/2/${address}`;
      const response = await axios.get(apiUrl);

      if (response.status !== 200 || !response.data.online) {
        await interaction.reply('There was an error querying the server information. Please make sure the server is online and the address is correct.');
        return;
      }

      const { players, version, icon, motd, software } = response.data;
      const motdText = motd.clean.length > 0 ? motd.clean[0] : 'No MOTD available';
      console.log('MOTD Queried:', motdText);

      // Check if the Minecraft server is online
      if (response.data.online) {
        const whitelistedIps = fs.readFileSync('whitelisted-ips.txt', 'utf8').split('\n').map(ip => ip.trim());
        const resolvedIp = await axios.get(`https://api.mcsrvstat.us/2/${address}`);
        const serverRootDomain = resolvedIp.data.ip || '';

        if (!whitelistedIps.includes(serverRootDomain)) {
          await interaction.reply('The server IP does not match any whitelisted IP. Server information will not be showcased.');
          return;
        }
      }

      const user = interaction.user;

      // Generate Minecraft-style MOTD image with dirt background
      const motdImageUrl = `https://via.placeholder.com/400x20/0099FF/FFFFFF?text=${encodeURIComponent(motdText)}&bg=https://via.placeholder.com/400x20/8B4513/8B4513`;

      const embed = new MessageEmbed()
        .setTitle('Minecraft Server Showcase')
        .setColor('#0099FF')
        .addFields(
          { name: 'Server IP', value: address, inline: true },
          { name: 'Players Online', value: `${players.online}/${players.max}`, inline: true },
          { name: 'Version', value: version, inline: true },
          { name: 'User Message', value: userMessage || 'No custom message provided' },
          { name: 'Software', value: software || 'Unknown', inline: true }
        )
        .setImage(motdImageUrl)
        .setThumbnail(icon ? `https://api.mcsrvstat.us/icon/${address}` : 'https://via.placeholder.com/64')
        .setFooter(user.username, user.displayAvatarURL({ dynamic: true }));

      const targetChannelId = process.env.CHANNEL_ID;
      const targetChannel = await interaction.client.channels.fetch(targetChannelId);
      const sentMessage = await targetChannel.send({ embeds: [embed] });

      await interaction.reply(`Server information sent to <#${targetChannelId}>. [View Message](${sentMessage.url})`);
    } catch (error) {
      console.error(`Error showcasing server for user ${userId}: ${error}`);
      await interaction.reply('There was an error showcasing the server information.');
    }
  },
};
