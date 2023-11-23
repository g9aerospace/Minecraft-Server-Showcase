// mc.js
const { Client, Intents, GatewayIntentBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const dns = require('dns');

require('dotenv').config();

// Discord bot setup
const mcBot = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
  ],
});

mcBot.login(process.env.BOT_TOKEN);

mcBot.once('ready', async () => {
  try {
    // Purge messages in PANEL_CHANNEL_ID
    const panelChannel = await mcBot.channels.fetch(process.env.PANEL_CHANNEL_ID);

    try {
      const messages = await panelChannel.messages.fetch({ limit: 100 });
      await panelChannel.bulkDelete(messages);
    } catch (error) {
      console.error('Error purging messages:', error);
    }

    // Send form with a button
    const formMessage = await panelChannel.send({
      content: 'Please click the button to provide your Minecraft server information.',
      components: [
        {
          type: 'ACTION_ROW',
          components: [
            {
              type: 'BUTTON',
              style: 'PRIMARY',
              customId: 'provide_info',
              label: 'Provide Server Info',
            },
          ],
        },
      ],
    });

    // Event listener for button click
    mcBot.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;
      if (interaction.customId === 'provide_info') {
        // DM the user and ask for server information
        const user = await interaction.user.fetch();
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
