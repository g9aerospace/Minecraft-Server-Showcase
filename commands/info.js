const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageAttachment } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Get information about the bot and its author'),

  async execute(interaction) {
    // Calculate uptime
    const uptime = process.uptime();
    const uptimeString = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;

    const embed = new MessageEmbed()
      .setTitle('Embernodes Showcase')
      .setColor(0x3498db)
      .addField('About', 'Embernodes Showcase aims to help users showcase their Embernodes server with ease. Version: 1.0.0')
      .addField('Author', 'G9 Aerospace is a fellow YouTuber who playes games and loves to code')
      .addField('Uptime', uptimeString)
      .setFooter('Embernodes', 'attachment://embernodes.png');

    const imageAttachment = new MessageAttachment('./embernodes.png');

    interaction.reply({
      embeds: [embed],
      files: [imageAttachment],
      components: [
        {
          type: 'ACTION_ROW',
          components: [
            {
              type: 'BUTTON',
              style: 'LINK',
              label: 'GitHub',
              url: 'https://github.com/g9militantsYT/Minecraft-Server-Showcase/tree/Embernodes',
            },
            {
              type: 'BUTTON',
              style: 'LINK',
              label: 'Author website',
              url: 'https://g9aerospace.in/',
            },
          ],
        },
      ],
    });
  },
};
