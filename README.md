# MC-Server-Scanner

<div align="center">
    <a href="https://discord.gg/Uy9m5TP5na"><img src="https://img.shields.io/discord/1005132317297221785?logo=discord" alt="Discord"/></a>
    <img src="https://img.shields.io/github/last-commit/kgurchiek/Minecraft-Server-Scanner-Discord-Bot" alt="GitHub last commit"/>
    <img src="https://img.shields.io/github/languages/code-size/kgurchiek/Minecraft-Server-Scanner-Discord-Bot" alt="GitHub code size in bytes"/>
    <br>
    <img src="https://raw.githubusercontent.com/kgurchiek/Minecraft-Server-Scanner-Discord-Bot/main/Icon.PNG" alt="Minecraft Server Scanner Icon" width="20%"/>
</div>

> This product includes GeoLite2 data created by MaxMind, available from http://www.maxmind.com.

## About

This is the full code for a Node.js Minecraft server scanner Discord bot I made. This bot itself doesn't do the scanning, it just displays the scanned servers from my database, which is actively expanded by a seperate scanning program. You can access this yourself at https://api.cornbread2100.com/scannedServers.

If you find any bugs, please report them in the [official discord](https://discord.gg/TSWcF2m67m).

You can contact me via discord: cornbread2100

## Hosting the bot yourself

**If you just want to use the bot, you don't have to host it, you can try it out in its [official Discord server](https://discord.gg/TSWcF2m67m)**



Put the bot's token and client id from the [Discord Developer Portal](https://discord.com/developers/) into config.json. To make future searches much faster, search results are cached. If it has been a while, the results will be fetched again. In the config, refreshDelay controls how many seconds to wait before refreshing the database. Approximately 600 (10 minutes) is recommended.

### Usage

You'll need Node.js version v18 or later to run the bot. Run `node deploy-commands.js` in your terminal before launching the bot. This will register the slash commands, otherwise they won't show up in Discord. Run `node index.js` to launch the bot when you're ready. You'll need to install the 'maxmind' and discord.js v14 packages to run the bot. If you don't know how to do this, just run this command: `npm install maxmind discord.js`.

| Command | Description | Arguments |
| --- | --- | --- |
| /help | Shows the bot's list of commands | None |
| /stats | Sends some stats about the bot | None |
| /random | Fetches a random online Minecraft server | None |
| /ping | Fetches info from a given Minecraft server | ip (required), port (optional, defaults to 25565) |
| /search | Searches the database for a server with specific properties | playerCap (integer), minonline (integer), maxonline (integer), isfull (true/false), version (regex), hasimage (true/false), description (regex), strictdescription (true/false), player (player name), hasplayerlist (true/false), seenafter (unix timestamp), iprange (ip subnet), port (integer), country (country name), org (organization name, uses regex) |
| /streamsnipe | Searches the database for live Twitch streamers | language (language name) |

