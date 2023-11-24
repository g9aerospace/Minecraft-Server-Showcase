require('dotenv').config();
const fs = require('fs');
const util = require('minecraft-server-util');
const { createCanvas } = require('canvas');
const { Client, MessageEmbed, Intents } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.once('ready', () => {
    console.log('Logged in as ' + client.user.tag);

    // Path to the JSON file inside the userdata folder
    const filePath = 'userdata/928267278540242964.json';

    // Read the JSON file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading JSON file:', err);
            return;
        }

        try {
            // Parse JSON data
            const userData = JSON.parse(data);

            // Extract server IP and port
            const { address } = userData;
            const [ip, portString] = address.split(':');
            const port = parseInt(portString, 10);  // Parse the port to a number

            // Ping server to check if it's reachable
            util.status(ip, port)
                .then(async (result) => {
                    console.log('Server is reachable!');

                    // Extract MOTD from the response
                    const motd = result.motd.clean || 'A Minecraft Server';

                    // Check if MOTD is a non-empty string
                    if (typeof motd === 'string' && motd.trim() !== '') {
                        // Create a canvas
                        const canvas = createCanvas(400, 100);
                        const ctx = canvas.getContext('2d');

                        // Set the background color
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        // Set the text color and font
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = '20px Arial';

                        // Draw the MOTD on the canvas
                        ctx.fillText(motd, 10, 50);

                        // Save the canvas as an image
                        const buffer = canvas.toBuffer('image/png');
                        fs.writeFileSync('motd_image.png', buffer);

                        console.log('MOTD image generated and saved as motd_image.png');

                        // Send MOTD as an embed to the specified channel
                        const channel = client.channels.cache.get(process.env.CHANNEL_ID);
                        if (channel) {
                            const embed = new MessageEmbed()
                                .setTitle('Minecraft Server Information')
                                .setDescription(`MOTD: ${motd}`)
                                .addFields(
                                    { name: 'Online Players', value: result.players.online, inline: true },
                                    { name: 'Max Players', value: result.players.max, inline: true },
                                    { name: 'Version', value: result.version.name, inline: true },
                                    { name: 'Protocol', value: result.version.protocol, inline: true }
                                )
                                .setImage('attachment://motd_image.png')
                                .setColor('#0099ff');

                            channel.send({ embeds: [embed], files: [{ attachment: 'motd_image.png', name: 'motd_image.png' }] });
                        } else {
                            console.error(`Channel with ID ${process.env.CHANNEL_ID} not found.`);
                        }
                    } else {
                        console.error('Invalid MOTD received from the server:', motd);
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });
});

client.login(process.env.BOT_TOKEN);
