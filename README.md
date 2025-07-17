# Minecraft Server Scanner Discord Bot

<div align="center">
    <a href="https://discord.gg/Uy9m5TP5na"><img src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"/></a>
    <a href="https://www.buymeacoffee.com/cornbread2100"><img src="https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee"/></a>
    <a href="https://nodejs.org/en"><img src="https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white&style=for-the-badge" alt="Node.js"/></a>
    <a href="https://github.com/kgurchiek/Minecraft-Server-Scanner-Discord-Bot"><img src="https://img.shields.io/github/last-commit/kgurchiek/Minecraft-Server-Scanner-Discord-Bot?style=for-the-badge&logo=github&logoColor=white&logoWidth=20"/></a>
    <br>
    <br>
    <img src="https://raw.githubusercontent.com/kgurchiek/Minecraft-Server-Scanner-Discord-Bot/main/Icon.PNG" alt="Minecraft Server Scanner Logo" width="20%"/>
</div>

## 📝 About

This bot doesn't do the scanning itself, it just searches through servers from my database, which is actively collected by a separate scanning program. You can access it yourself at <https://api.cornbread2100.com/>. The scanning is done in two main parts: first, the [discovery scanner](https://github.com/kgurchiek/Minecraft-Server-Scanner) scans (almost) every IPv4 address to find Minecraft servers, which takes a few days. It checks for Minecraft servers by using Java Edition's [Server List Ping (SLP) protocol](https://minecraft.wiki/w/Java_Edition_protocol/Server_List_Ping) and Bedrock Edition's [RakNet Unconnected Ping Protocol](https://wiki.bedrock.dev/servers/raknet#unconnected-pings), which is how Minecraft clients fetch data from servers to display in the multiplayer menu (e.g. player count, favicon, etc.). Those results are sent to a [rescanner](https://github.com/kgurchiek/Minecraft-Server-Rescanner), which constantly scans back over the results to get updated info to save to a database. Some data isn't provided in the SLP response, so multiple different rescans are needed. For example, an extra scan is run once a day to check if Java Edition servers require account authentication, and an entirely separate scanner is run in parallel to check for whitelists.

If you find any bugs, please report them in the [official Discord server](https://discord.gg/TSWcF2m67m).

You can contact me via Discord: [cornbread2100](https://discord.com/users/720658048611516559)

## 🌐 Hosting the bot yourself

> [!IMPORTANT]
> You can try the bot on its [official Discord server](https://discord.gg/TSWcF2m67m) without hosting it yourself.

Put the bot's token and client id from the [Discord Developer Portal](https://discord.com/developers) into `config.json`. If you're running your own instance of the scanner, you can host your own api with https://github.com/kgurchiek/Minecraft-Server-Scanner-API and enter the url into `config.json`. You can also change `displayURL` to make the bot use a different url in the API links exposed to users. This is useful if you have a public endpoint but internally want the bot to make a local or private connection. 

You'll need to install Node.js version v18 or later to run the bot. Then install all required dependencies with `npm i` and run `node deploy-commands` in your terminal to register the slash commands, otherwise they won't show up in Discord. Once everything is set up, run `node index` to start the bot. Each command should load, and "\[Bot\]" will be logged when it's ready.

> [!WARNING]
> Don't forget to give the Discord bot the `bot` and `applications.commands` permissions in the URL generator.

## 💻 Usage

| Command | Description | Arguments |
| --- | --- | --- |
| /help | Shows the bot's list of commands | None |
| /stats | Sends some stats about the bot | None |
| /random | Fetches a random online Java Edition server | None |
| /ping | Fetches info from a given Java Edition server | ip (required), port (optional, defaults to 25565) |
| /bedrockping | Fetches info from a given Bedrock Edition server | ip (required), port (optional, defaults to 19132) |
| /search | Searches the database for a Java Edition server with specific properties | minimal (true/false), sort (autocomplete), page (integer), playercount (range), playercap (integer), isfull (true/false), player (player name), uuid (player uuid), playerhistory (player name), uuidhistory (player uuid), version (text), hasimage (true/false), description (text), hasplayerlist (true/false), seenafter (unix timestamp), iprange (ip subnet), port (integer), country (text), org (text), cracked (true/false), whitelist (true/false), vanilla (true/false) |
| /bedrocksearch | Searches the database for a Bedrock Edition server with specific properties | minimal (true/false), sort (autocomplete), page (integer), playercount (range), playercap (integer), isfull (true/false), version (text), description (text), seenafter (unix timestamp), iprange (ip subnet), port (integer), gamemode (text), country (text), org (text) |
