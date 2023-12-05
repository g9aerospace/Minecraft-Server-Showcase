# Minecraft Server Showcase Bot

[![GitHub issues](https://img.shields.io/github/issues/g9militantsYT/Minecraft-Server-Showcase)](https://github.com/g9militantsYT/Minecraft-Server-Showcase/issues)
[![GitHub stars](https://img.shields.io/github/stars/g9militantsYT/Minecraft-Server-Showcase)](https://github.com/g9militantsYT/Minecraft-Server-Showcase/stargazers)
[![GitHub license](https://img.shields.io/github/license/g9militantsYT/Minecraft-Server-Showcase)](https://github.com/g9militantsYT/Minecraft-Server-Showcase/blob/Embernodes/LICENSE)

The Minecraft Server Showcase Bot is a Discord bot that allows users to showcase Minecraft servers and retrieve information about them.

## Features

- Query Minecraft servers and display information with MOTD (Message of the Day).
- Handle user input for specifying domains and ports.
- Automatic error logging and reporting.

## Installation

To install the bot, follow these steps:

1. Clone the repository:

    ```
    git clone https://github.com/g9militantsYT/Minecraft-Server-Showcase.git
    cd Minecraft-Server-Showcase
    ```

2. Install dependencies:

    ```
    npm install
    ```

3. Set up environment variables:

    Create a .env file and add the following:

    ```
        BOT_TOKEN=
        CHANNEL_ID=
        WEBHOOK_URL=
        GUILD_ID=
        CHANNEL_ID=
        IMAGE_URL=
        PANEL_CHANNEL_ID=
        CLIENT_ID=
    ```

Enter the appropriate values


    Create a whitelisted-ips.txt and place the IP addresses used by the host in it. One IP per line.

4. Run the bot:

    ```
    node .
    ```

5. Usage

        /addserver
        Add server information
        /help
        Get information about available commands
        /showcase
        Showcase server information in a channel
        /userinfo
        Fetch server information of another user

6. Support and Feedback

    If you encounter any issues or have suggestions, feel free to open an issue.

## Additional Links

- [Website](https://g9aerospace.in/)
- [YouTube](https://www.youtube.com/@G9AEROSPACEYT)
