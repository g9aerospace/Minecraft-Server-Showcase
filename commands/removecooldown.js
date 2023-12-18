const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');

require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removecooldown')
    .setDescription('Remove cooldown for a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to remove cooldown for')
        .setRequired(true)),

  async execute(interaction) {
    // Check if the user has any of the MANAGER_ROLES
    const managerRoleIds = process.env.MANAGER_ROLE_IDS.split(',');
    if (!managerRoleIds.some(roleId => interaction.member.roles.cache.has(roleId))) {
      await interaction.reply('You do not have permission to use this command.');
      return;
    }

    // Get the user mentioned in the command
    const targetUser = interaction.options.getUser('user');
    if (!targetUser) {
      await interaction.reply('Please mention a user for whom you want to remove the cooldown.');
      return;
    }

    const targetUserId = targetUser.id;

    // Remove the cooldown for the specified user
    try {
      const filePath = `./servers/${targetUserId}.json`;

      if (fs.existsSync(filePath)) {
        const userData = fs.readFileSync(filePath, 'utf8');
        const userObject = JSON.parse(userData);
        userObject.lastExecutionTime = 0; // Resetting the cooldown

        fs.writeFileSync(filePath, JSON.stringify(userObject, null, 2));

        await interaction.reply(`Cooldown removed for user ${targetUser.username}.`);
      } else {
        await interaction.reply(`User ${targetUser.username} does not have a cooldown.`);
      }
    } catch (error) {
      console.error(`Error removing cooldown for user ${targetUserId}:`, error);
      await interaction.reply('There was an error removing the cooldown.');
    }
  },
};
