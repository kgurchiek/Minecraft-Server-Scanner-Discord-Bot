# MC-Server-Scanner

<div align="center">
    <a href="https://discord.gg/Uy9m5TP5na"><img src="https://img.shields.io/discord/1005132317297221785?logo=discord" alt="Discord"/></a>
    <img src="https://img.shields.io/github/last-commit/kgurchiek/Minecraft-Server-Scanner-Discord-Bot" alt="GitHub last commit"/>
    <img src="https://img.shields.io/github/languages/code-size/kgurchiek/Minecraft-Server-Scanner-Discord-Bot" alt="GitHub code size in bytes"/>
    <br>
    <img src="https://raw.githubusercontent.com/kgurchiek/Minecraft-Server-Scanner-Discord-Bot/main/Icon.PNG" alt="Minecraft Server Scanner Icon" width="50%"/>
</div>

## About

This is the full code for a Node.js Minecraft server scanner Discord bot I made. This bot itself doesn't do the scanning, it just pings servers in the existing database, which is actively expanded by a seperate scanning program. (The code for the server scanner can be found here: https://github.com/kgurchiek/Minecraft-Server-IP-Scanner)

If you find any bugs, please report them in the [official discord](https://discord.gg/TSWcF2m67m).

You can contact me via discord: Cornbread 2100#8668

## Hosting the bot yourself
**If you just want to use the bot, you don't have to host it, you can try it out in its [official Discord server](https://discord.gg/TSWcF2m67m)** 

### Configuration
In config.json, fill in the bot's client id and token, found in the [Discord Developer Portal](https://discord.com/developers/applications). Then you'll want to change maxPings and pingTimeout to your liking:
#### maxPings
##### (how many servers are pinged at once)
If you have fast internet, you can set this pretty high (around 5000). If you have slower internet, you'll want it lower (around 1000). The higher it is, the less time a /search will take, but it will also be less accurate, especially if you have slower internet.

#### pingTimeout
##### (how long to wait for a response before deciding a server is offline)
about 2000-3000 (2-3 seconds) is recommmended. Setting this lower will make a /search faster, but you might leave out some slower servers that take a bit longer to respond.

### Usage
To run the bot, you'll need Node.js version 16.9.0 or higher. Before you host the bot, run `node deploy-commands.js` in your terminal. That will register the slash commands, otherwise they won't appear in discord. After that, run `node index.js` to run the bot.

## Commands

### /help
Sends the bot's list of commands

### /stats
Sends some stats about the bot

### /randserver
Gets a random Minecraft server
ㅤ
### /pingserver \<ip\> \<port\>
gets info from a server

#### arguments:
##### ip
The ip address of the server
    
##### port
The port of the server
ㅤ
### /search <scan> [minonline] [maxonline] [playercap] [isfull] [version] [hasimage] [description] [strictdescription] [player]
searches for a server with specific properties

#### arguments:
##### scan (integer)
How many servers to scan in the search. Use /stats to find the total servers available for scan.

##### minonline (integer)
The minimum number of players online

##### maxonline (integer)
The maximum number of players online (not to be confused with the server's maximum player capacity (playerCap))

##### playerCap (integer)
The maximum player capacity of the server

##### isfull (true/false)
Whether or not the server is full

##### version (version number)
The version of the server

##### hasimage (true/false)
Whether or not the server has a custom thumbnail image

##### description (text)
The description of the server

##### strictdescription (true/false)
(Used with the description argument) If true, the server's description has to perfectly match the description argument. If false, the server's description only has to contain the description argument.

##### player (player name)
Searches for the server a player is currently playing on.
