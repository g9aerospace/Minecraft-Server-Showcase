module.exports = {
    data: {
        name: 'ping',
        description: 'Ping command',
    },
    async execute(interaction) {
        // Create an embed using an object
        const embed = {
            color: 0x0099ff,
            title: 'Pong!',
            description: 'This is a ping command response.',
        };

        // Reply to the interaction with the embedded message
        await interaction.reply({ embeds: [embed] });
    },
};
