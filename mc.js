// mc.js
const { Client, Intents, MessageEmbed } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const dns = require('dns');

require('dotenv').config();

const mcBot = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
  ],
});

mcBot.login(process.env.BOT_TOKEN);

// Set up a Set to track users who completed the form
const usersWhoCompletedForm = new Set();
const userLastShowcaseTime = new Map();
const SHOWCASE_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

mcBot.once('ready', async () => {
  try {
    // Purge messages in PANEL Channel
    const panelChannel = await mcBot.channels.fetch(process.env.PANEL_CHANNEL_ID);

    try {
      const messages = await panelChannel.messages.fetch({ limit: 100 });
      await panelChannel.bulkDelete(messages);
    } catch (error) {
      console.error('Error purging messages:', error);
    }

    // Send form with "Edit" and "Send" buttons
    const formMessage = await panelChannel.send({
      content: 'Please click the buttons to provide or view your Minecraft server information.',
      components: [
        {
          type: 'ACTION_ROW',
          components: [
            {
              type: 'BUTTON',
              style: 'PRIMARY',
              customId: 'provide_info',
              label: 'Add/Edit Server Info',
            },
            {
              type: 'BUTTON',
              style: 'PRIMARY',
              customId: 'view_info',
              label: 'Showcase your server!',
            },
          ],
        },
      ],
    });

    // Event listener for button click
    mcBot.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;
      const user = await interaction.user.fetch();

      // Handle "View Server Info" button click
      if (interaction.customId === 'view_info') {
        // Check if the user has showcased their server within the cooldown period
        const lastShowcaseTime = userLastShowcaseTime.get(user.id) || 0;
        const timeSinceLastShowcase = Date.now() - lastShowcaseTime;

        if (timeSinceLastShowcase < SHOWCASE_COOLDOWN) {
          const remainingCooldown = SHOWCASE_COOLDOWN - timeSinceLastShowcase;
          const remainingCooldownHours = Math.ceil(remainingCooldown / (60 * 60 * 1000));

          await user.send(`You can showcase your server only once every 24 hours. Please wait for ${remainingCooldownHours} hours before showcasing again.`);
          return;
        }

        // Fetch the existing user data from the file
        const userDataFilePath = `userdata/${user.id}.json`;

        try {
          // Send an embed with pre-existing data
          const existingUserData = readUserData(userDataFilePath, user);
          if (!existingUserData) return;

          const embedChannel = await mcBot.channels.fetch(process.env.CHANNEL_ID);

          const embed = new MessageEmbed()
            .setTitle(`Server Info: ${existingUserData.address || 'Not provided'}`)
            .setDescription(existingUserData.inviteMessage || 'No invite message provided')
            .setFooter(`Submitted by: ${user.tag}`, user.displayAvatarURL());

          await embedChannel.send({ embeds: [embed] });

          // Update the last showcase time for the user
          userLastShowcaseTime.set(user.id, Date.now());
        } catch (error) {
          console.error('Error reading existing user data:', error);
          await user.send('An error occurred while trying to retrieve your existing data. Please try again later.');
        }
      }

      // Handle "Provide Server Info" button click
      if (interaction.customId === 'provide_info') {
        // Check if the user has already completed the form
        if (usersWhoCompletedForm.has(user.id)) {
          // Inform the user that they can edit their previous submission
          await user.send('You have already completed the form. If you need to make changes, you can edit your previous message.');

          // Fetch the existing user data from the file
          const userDataFilePath = `userdata/${user.id}.json`;

          try {
            const existingUserData = readUserData(userDataFilePath, user);
            if (!existingUserData) return;

            // Inform the user about their existing data and provide an option to edit
            await user.send(`Existing Server Address: ${existingUserData.address || 'Not provided'}`);
            await user.send('If you want to edit the server address or invite message, click the "Edit" button below.');

            // Provide an edit button
            const editButtonMessage = await user.send({
              components: [
                {
                  type: 'ACTION_ROW',
                  components: [
                    {
                      type: 'BUTTON',
                      style: 'PRIMARY',
                      customId: 'edit_info',
                      label: 'Edit',
                    },
                  ],
                },
              ],
            });

            // Event listener for the edit button click
            const filterEditButton = (buttonInteraction) => buttonInteraction.customId === 'edit_info' && buttonInteraction.user.id === user.id;
            const editButtonInteraction = await editButtonMessage.awaitMessageComponent({ filter: filterEditButton, time: 60000 });

            // Check if the user clicked the edit button
            if (editButtonInteraction) {
              // Allow the user to edit their previous message
              await user.send('Please provide the updated address of your Minecraft server in the format domain:port or ip:port, whichever suits you.');

              const filterEditAddress = (msg) => msg.author.id === user.id;
              const responseEditAddress = await user.dmChannel.awaitMessages({ filter: filterEditAddress, max: 1, time: 60000, errors: ['time'] });

              const updatedAddress = responseEditAddress.first().content;

              // Ask for an updated invite message
              await user.send('Please provide the updated Invite Message without any IP addresses.');

              const filterEditInviteMessage = (msg) => msg.author.id === user.id;
              const responseEditInviteMessage = await user.dmChannel.awaitMessages({
                filter: filterEditInviteMessage,
                max: 1,
                time: 60000,
                errors: ['time'],
              });

              const updatedInviteMessage = responseEditInviteMessage.first().content;

              // Update the existing user data
              existingUserData.address = updatedAddress;
              existingUserData.inviteMessage = updatedInviteMessage;
              fs.writeFileSync(userDataFilePath, JSON.stringify(existingUserData));

              await user.send('Your server address and invite message have been updated. Thank you!');
            } else {
              // Handle the case where the user didn't click the edit button
              await user.send('You chose not to edit your previous message. If you have any other questions, feel free to ask.');
            }
          } catch (error) {
            console.error('Error reading existing user data:', error);
            await user.send('An error occurred while trying to retrieve your existing data. Please try again later.');
          }
          return;
        }

        // Mark the user as having completed the form
        usersWhoCompletedForm.add(user.id);

        // DM the user and ask for server information
        await user.send('Please provide the address of your Minecraft server in the format domain:port or ip:port, whichever suits you.');

        const filter = (msg) => msg.author.id === user.id;
        const response = await user.dmChannel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });

        const userProvidedAddress = response.first().content;

        // Separate IP and port
        const [userProvidedIP, userProvidedPort] = userProvidedAddress.split(':');
        const dnsQuery = userProvidedIP;  // Only pass the IP address for DNS resolution

        // Resolve IP address
        dns.resolve4(dnsQuery, async (err, addresses) => {
          if (err) {
            console.error(err);
            await user.send('Error resolving the provided address. Please use a proper IP address/domain.');
            return;
          }

          // Check if the resolved IP matches 2.223.144.35
          const isValidIP = addresses.includes('2.223.144.35');

          if (isValidIP) {
            await user.send('Please provide the Invite Message without any IP addresses.');

            const inviteMessageResponse = await user.dmChannel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
            const inviteMessage = inviteMessageResponse.first().content;

            // Save user data to a file
            const userData = {
              userId: user.id,
              address: userProvidedAddress,
              inviteMessage: inviteMessage,
            };

            fs.writeFileSync(`userdata/${user.id}.json`, JSON.stringify(userData));

            await user.send('Thank you for providing the information. Your data has been recorded.');

            // Send an embed to the specified channel
            const embedChannel = await mcBot.channels.fetch(process.env.CHANNEL_ID);

            const embed = new MessageEmbed()
              .setTitle(`Server Info: ${userProvidedAddress}`)
              .setDescription(inviteMessage)
              .setFooter(`Submitted by: ${user.tag}`, user.displayAvatarURL());

            await embedChannel.send({ embeds: [embed] });

            // Update the last showcase time for the user
            userLastShowcaseTime.set(user.id, Date.now());
          } else {
            await user.send('The provided IP address/domain does not match with 2.223.144.35. Please use a proper IP address/domain.');
          }
        });
      }
    });

    console.log('MC bot is ready!');
  } catch (error) {
    console.error(error);
  }
});

// Log errors to a file
mcBot.on('error', (error) => {
  fs.appendFileSync('error.log', `[${new Date()}] ${error}\n`);
});

function readUserData(filePath, user) {
  try {
    const existingUserData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return existingUserData;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`User data file does not exist for user ${user.id}. Creating a new file.`);
      const defaultUserData = {
        userId: user.id,
        address: 'Not provided',
        inviteMessage: 'No invite message provided',
      };
      fs.writeFileSync(filePath, JSON.stringify(defaultUserData));
      return defaultUserData;
    }

    console.error(`Error reading existing user data for user ${user.id} at path ${filePath}:`, error);
    return null;
  }
}
