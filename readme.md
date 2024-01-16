# Minecraft Server Showcase Bot

[![GitHub issues](https://img.shields.io/github/issues/g9militantsYT/Minecraft-Server-Showcase)](https://github.com/g9militantsYT/Minecraft-Server-Showcase/issues)
[![GitHub stars](https://img.shields.io/github/stars/g9militantsYT/Minecraft-Server-Showcase)](https://github.com/g9militantsYT/Minecraft-Server-Showcase/stargazers)

The Minecraft Server Showcase Bot is a feature-rich Discord bot designed to enhance the experience of showcasing and exploring Minecraft servers. It provides a seamless way for users to share server information and retrieve details about various Minecraft servers.

## Features

- **Interactive Server Showcase:** Users can showcase their Minecraft servers with a simple command, providing key information like server name, description, and IP address.

- **Query Server Information:** Users can easily query server information, including the Message of the Day (MOTD), player count, and other relevant details.

- **Error Handling:** The bot automatically logs and reports errors, ensuring a smooth and reliable user experience.

- **Permission Management:** Define manager roles that have control over specific bot functionalities, allowing for easy customization based on your Discord server's needs.

## Installation

To install the bot, follow these steps:

1. **Clone the repository:**
    ```bash
    git clone https://github.com/g9militantsYT/Minecraft-Server-Showcase.git
    cd Minecraft-Server-Showcase
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Set up environment variables:**
    Create a `.env` file and add the following:
    ```env
    BOT_TOKEN=
    GUILD_ID=
    CLIENT_ID=
    CHANNEL_ID=
    MANAGER_ROLE_IDS=
    WEBHOOK_URL=
    SHOWCASE_WEBHOOK_URL=
    ```
    Enter the appropriate values. You can have as many manager roles as needed; separate their role IDs with commas.

4. **Run the bot:**
    ```bash
    node .
    ```

## Usage

Explore a variety of commands to make the most out of the Minecraft Server Showcase Bot:

1. **Add or Update Server Information:**
    ```
    /addserver
    ```

2. **Get Information about Available Commands:**
    ```
    /help
    ```

3. **Get Information about the Bot and its Author:**
    ```
    /info
    ```

4. **Remove Cooldown for a User:**
    ```
    /removecooldown
    ```

5. **Showcase Minecraft Server Information:**
    ```
    /showcase
    ```

6. **Fetch Server Information:**
    ```
    /userinfo
    ```

7. **Show Whitelisted IPs:**
    ```
    /whitelistedips
    ```

Feel free to explore these commands to make the most out of the Minecraft Server Showcase Bot.

## Support and Feedback

If you encounter any issues or have suggestions, please open an issue on the [GitHub repository](https://github.com/g9militantsYT/Minecraft-Server-Showcase/issues).

## Additional Links

- [Website](https://g9aerospace.in/)
- [YouTube](https://www.youtube.com/@G9AEROSPACEYT)
