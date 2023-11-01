# MC-Server-Scanner

<div align="center">
    <a href="https://discord.gg/Uy9m5TP5na"><img src="https://img.shields.io/discord/1005132317297221785?logo=discord" alt="Discord"/></a>
    <img src="https://img.shields.io/github/last-commit/kgurchiek/Minecraft-Server-Scanner-Discord-Bot" alt="GitHub last commit"/>
    <img src="https://img.shields.io/github/languages/code-size/kgurchiek/Minecraft-Server-Scanner-Discord-Bot" alt="GitHub code size in bytes"/>
    <br>
    <img src="https://raw.githubusercontent.com/kgurchiek/Minecraft-Server-Scanner-Discord-Bot/main/ICON.png" alt="Minecraft Server Scanner Logo" width="20%"/>
</div>

> This product includes GeoLite2 data created by [MaxMind](https://www.maxmind.com).

## About

This is the complete code for a Node.js Minecraft server scanner discord bot I made. This bot doesn't do the scanning itself, it just displays the scanned servers in my database, which is actively extended by a separate scanning program. You can access it yourself at <https://api.cornbread2100.com/scannedServers>.

If you find any bugs, please report them in the [official discord server](https://discord.gg/TSWcF2m67m).

You can contact me via discord: [cornbread2100](https://discord.com/users/720658048611516559)

## Hosting the bot yourself

**If you just want to use the bot, you don't have to host it, you can try it out on its [official Discord server](https://discord.gg/TSWcF2m67m)**.

Put the bot's token and client id from the [Discord Developer Portal](https://discord.com/developers) into config.json. To make future searches much faster, search results are cached. If it has been a while, the results will be fetched again. In the config, `refreshDelay` controls how many seconds to wait before refreshing the database. Approximately 600 (10 minutes) is recommended.

You'll need Node.js version v18 or later to run the bot. Run `node deploy-commands.js` in your terminal before running the bot. This will register the slash commands, otherwise they won't show up in Discord. You'll need to install the 'maxmind' and discord.js v14 packages to run the bot. If you don't know how to do this, just run this command: `npm i maxmind discord.js`. Run `node index.js` to start the bot when you're ready. 

### Usage

| Command | Description | Arguments |
| --- | --- | --- |
| /help | Shows the bot's list of commands | None |
| /stats | Sends some stats about the bot | None |
| /random | Fetches a random online Minecraft server | None |
| /ping | Fetches info from a given Minecraft server | ip (required), port (optional, defaults to 25565) |
| /search | Searches the database for a server with specific properties | playerCap (integer), minonline (integer), maxonline (integer), isfull (true/false), version (regex), hasimage (true/false), description (regex), strictdescription (true/false), player (player name), hasplayerlist (true/false), seenafter (unix timestamp), iprange (ip subnet), port (integer), country (country name), org (organization name, uses regex) |
| /streamsnipe | Searches the database for live Twitch streamers | language (language name) |
