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

### Configuration

Put the bot's token and client id from the [Discord Developer Portal](https://discord.com/developers/) into config.json. To make future searches much faster, search results are cached. If it has been a while, the results will be fetched again. In the config, refreshDelay controls how many seconds to wait before refreshing the database. Approximately 600 (10 minutes) is recommended.

### Usage

You'll need Node.js version v18 or later to run the bot. Run `node deploy-commands.js` in your terminal before launching the bot. This will register the slash commands, otherwise they won't show up in Discord. Run `node index.js` to launch the bot when you're ready. You'll need to install the 'maxmind' and discord.js v14 packages to run the bot. If you don't know how to do this, just run this command: `npm install maxmind discord.js`.

## Commands

### /help

Send the bot's command list

### /stats

Send some statistics about the bot

### /random

Get a random Minecraft online server

### /ping \<ip\> \[port\]

Gets info from a specific Minecraft server

#### Arguments:

##### ip

The IP address of the server

##### port

The port of the server. Defaults to 25565.
ㅤ

### /search \[minonline\] \[maxonline\] \[playercap\] \[isfull\] \[version\] \[hasimage\] \[description\] \[strictdescription\] \[player\]

Searches the database for a server with certain properties

#### arguments:

##### playerCap (integer)

The maximum number of players on the server

##### minonline (integer)

The minimum number of online players

##### maxonline (integer)

The maximum number of players online (not to be confused with the maximum player capacity of the server (playerCap))

##### isfull (true/false)

Whether the server is full or not

##### version (regex)

The version of the server

##### hasimage (true/false)

Whether the server has a custom favicon or not

##### description (regex)

The description of the server

##### strictdescription (true/false)

(Used with the description argument) If true, the server's description must match the description argument exactly. If false, the server's description must only match the description argument.

##### player (player name)

Searches for the server on which a player is currently playing. Note: this is very often inaccurate, as servers send custom responses instead of a real player list, and not all servers send a player list. The player list is also limited in size, so players on large servers won't be found.

##### hasplayerlist

Whether or not the server has player lists enabled. This is the default, but some servers turn it off, especially if they're popular (the player list is limited to 12 players, so servers that are typically more active than 12 players will turn it off).

##### seenafter (Unix timestamp)

The oldest time a sever can be last seen. This doesn't mean the server is offline, it could be that the ping was lost due to packet loss.

##### iprange (ip subnet)

The ip subnet a server's ip must be within.

##### port (integer)

The port on which the server is hosted

##### country (country name)

The country where the server is hosted

##### org (organisation name, using regex)

The organisation to which the IP belongs

### /streamsnipe \[language\]

Searches the database for live Twitch streamers

#### language (language name)

The language of the stream

