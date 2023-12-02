const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Replies with user information'),
  async execute(interaction) {
    const user = interaction.user;
    await interaction.reply(`Username: ${user.username}\nTag: ${user.tag}\nID: ${user.id}`);
  },
};
