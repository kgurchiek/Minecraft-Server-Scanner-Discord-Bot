# MC server scanner discord bot

<div align="center">
    <a href="https://discord.gg/Uy9m5TP5na"><img src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"/></a>
    <a href="https://www.buymeacoffee.com/cornbread2100"><img src="https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee"/></a>
    <a href="https://www.mongodb.com"><img src="https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white&style=for-the-badge" alt="MongoDB"/></a>
    <a href="https://nodejs.org/en"><img src="https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white&style=for-the-badge" alt="Node.js"/></a>
    <a href="https://github.com/kgurchiek/Minecraft-Server-Scanner-Discord-Bot"><img src="https://img.shields.io/github/last-commit/kgurchiek/Minecraft-Server-Scanner-Discord-Bot?style=for-the-badge&logo=github&logoColor=white&logoWidth=20"/></a>
    <br>
    <img src="https://raw.githubusercontent.com/kgurchiek/Minecraft-Server-Scanner-Discord-Bot/main/Icon.PNG" alt="Minecraft Server Scanner Logo" width="20%"/>
</div>

> [!NOTE]
> This product includes GeoLite2 data created by [MaxMind](https://www.maxmind.com).

## 📝 About

This is the complete code for a Node.js Minecraft server scanner discord bot I made. This bot doesn't do the scanning itself, it just displays the scanned servers in my database, which is actively extended by a separate scanning program. You can access the data [here](https://api.cornbread2100.com/scannedServers).

If you find any bugs, please report them in the [official discord server](https://discord.gg/TSWcF2m67m).

You can contact me via discord: [cornbread2100](https://discord.com/users/720658048611516559)

## 🌐 Hosting the bot yourself

> [!IMPORTANT]
> You can try the bot on its [official Discord server](https://discord.gg/TSWcF2m67m) without hosting it.

Put the bot's token and client id from the [Discord Developer Portal](https://discord.com/developers) into config.json. To make future searches much faster, search results are cached. If it has been a while, the results will be fetched again.

You'll need Node.js version v18 or later to run the bot. Run `node deploy-commands.js` in your terminal before running the bot. This will register the slash commands, otherwise they won't show up in Discord.

> [!WARNING]
> Don't forget to give the Discord bot the right permissions in the URL generator, the required permissions for this bot are: `bot` and `applications.commands`.

You'll also need to install the 'maxmind' and 'discord.js' (v14) package to run the bot. If you don't know how to do this, just run this command: `npm i maxmind discord.js`. Run `node index.js` to start the bot when you're ready. 

## 💻 Usage

| Command | Description | Arguments |
| --- | --- | --- |
| /help | Shows the bot's list of commands | None |
| /stats | Sends some stats about the bot | None |
| /random | Fetches a random online Minecraft server | None |
| /ping | Fetches info from a given Minecraft server | ip (required), port (optional, defaults to 25565) |
| /search | Searches the database for a server with specific properties | playerCap (integer), minonline (integer), maxonline (integer), isfull (true/false), version (regex), hasimage (true/false), description (regex), strictdescription (true/false), player (player name), hasplayerlist (true/false), seenafter (unix timestamp), iprange (ip subnet), port (integer), country (country name), org (organization name, uses regex) |
| /streamsnipe | Searches the database for live Twitch streamers | language (language name) |
