# MC-Server-Scanner

<div align="center">
    <a href="https://discord.gg/Uy9m5TP5na"><img src="https://img.shields.io/discord/1005132317297221785?logo=discord" alt="Discord"/></a>
    <img src="https://img.shields.io/github/last-commit/kgurchiek/Minecraft-Server-Scanner-Discord-Bot" alt="GitHub last commit"/>
    <img src="https://img.shields.io/github/languages/code-size/kgurchiek/Minecraft-Server-Scanner-Discord-Bot" alt="GitHub code size in bytes"/>
    <br>
    <img src="https://raw.githubusercontent.com/kgurchiek/Minecraft-Server-Scanner-Discord-Bot/main/Icon.PNG" alt="Minecraft Server Scanner Icon" width="20%"/>
</div>

## About

This is the full code for a Node.js Minecraft server scanner Discord bot I made. This bot itself doesn't do the scanning, it just displays the scanned servers from my database, which is actively expanded by a seperate scanning program. You can access this yourself at https://api.cornbread2100.com/scannedServers.

If you find any bugs, please report them in the [official discord](https://discord.gg/TSWcF2m67m).

You can contact me via discord: Cornbread 2100#0001

## Hosting the bot yourself
**If you just want to use the bot, you don't have to host it, you can try it out in its [official Discord server](https://discord.gg/TSWcF2m67m)** 

### Configuration
Enter the bot's token and client id from the [Discord Developer Portal](https://discord.com/developers/) in config.json. In order to make subsequent searches considerably faster, search results are temporarily saved. If it has been a while, the results will be fetched again. In the config, refreshDelay controlls how many seconds to wait before fetching the database again. About 600 (10 minutes) is recommended.

### Usage
You'll need Node.js version 16.9.0 or later to operate the bot. Run "node deploy-commands.js" in your terminal before launching the bot. The slash instructions will then be registered; otherwise, they won't show up in Discord. Run "node index.js" to start the bot once you're ready. You'll also need to install discord.js v14 and node-fetch version 2.6.6.

## Commands

### /help
Sends the bot's list of commands

### /stats
Sends some stats about the bot

### /random
Fetches a random Minecraft server

### /ping \<ip\> \[port\]
Fetches info from a given Minecraft server

#### Arguments:
##### ip
The ip address of the server
    
##### port
The port of the server. Defaults to 25565.

### /auth \<ip\> \<version\> \[port\]
Checks if a server requires account authentication

#### arguments:
##### ip
The ip address of the server.

##### version
The Minecraft version to attempt a join from
    
##### port
The port of the server. Defaults to 25565
ㅤ
### /search \[minonline\] \[maxonline\] \[playercap\] \[isfull\] \[version\] \[hasimage\] \[description\] \[strictdescription\] \[player\]
Searches the database for a server with specific properties

#### arguments:

##### playerCap (integer)
The maximum player capacity of the server

##### minonline (integer)
The minimum number of players online

##### maxonline (integer)
The maximum number of players online (Not to be confused with the server's maximum player capacity (playerCap))

##### isfull (true/false)
Whether or not the server is full

##### version (regex)
The version of the server

##### hasimage (true/false)
Whether or not the server has a custom thumbnail image

##### description (regex)
The description of the server

##### strictdescription (true/false)
(Used with the description argument) If true, the server's description has to perfectly match the description argument. If false, the server's description only has to contain the description argument

##### player (player name)
Searches for the server a player is currently playing on. Note: this is very often inaccurate, as servers will send custom responses instead of a real player list, and not all servers send a player list. The player list also has a limited size, so players in big serverss won't be found.
