# MC-Server-Scanner

<div align="center">
    <a href="https://discord.gg/Uy9m5TP5na"><img src="https://img.shields.io/discord/1005132317297221785?logo=discord" alt="Discord"/></a>
    <img src="https://img.shields.io/github/last-commit/kgurchiek/Minecraft-Server-Scanner-Discord-Bot" alt="GitHub last commit"/>
    <img src="https://img.shields.io/github/languages/code-size/kgurchiek/Minecraft-Server-Scanner-Discord-Bot" alt="GitHub code size in bytes"/>
    <br>
    <img src="https://raw.githubusercontent.com/kgurchiek/Minecraft-Server-Scanner-Discord-Bot/main/Icon.PNG" alt="Minecraft Server Scanner Icon" width="20%"/>
</div>

## About

This is the full code for a Node.js Minecraft server scanner Discord bot I made. This bot itself doesn't do the scanning, it just pings servers in the existing database, which is actively expanded by a seperate scanning program. (The code for the server scanner can be found here: https://github.com/kgurchiek/New-Minecraft-Server-IP-Scanner)

If you find any bugs, please report them in the [official discord](https://discord.gg/TSWcF2m67m).

You can contact me via discord: Cornbread 2100#0001

## Hosting the bot yourself
**If you just want to use the bot, you don't have to host it, you can try it out in its [official Discord server](https://discord.gg/TSWcF2m67m)** 

### Configuration
Enter the client id for the bot from the [Discord Developer Portal](https://discord.com/developers/) in config.json. Then, Create a file called .env and then add `token="<token>"` to .env and replace \<token\> with the token to your bot, adjust maxPings, pingTimeout, and refreshSearchTime as necessary:
#### maxPings
##### (How many servers are pinged at once)
If you have fast internet, you can set this pretty high (around 5000). If you have slower internet, you'll want it lower (around 1000). The higher it is, the less time a /search will take, but it will also be less accurate, especially if you have slower internet.

#### pingTimeout
##### (How long to wait for a response before deciding a server is offline)
A range of 2000–3000 (2–3 seconds) is advised. Setting this lower will speed up a /search, but you risk excluding some slower servers whose responses take a little longer. Please note that this is in milliseconds, to prevent any confusion.

#### refreshSearchTime
##### (How long /search results are saved in memory)
In order to make subsequent searches considerably faster, search results are momentarily saved. If it has been a while, as determined by refreshSearchTime, the results will be re-scanned. The advised number is 300 (5 minutes). Remember that the longer this is, the more inaccurate the results are likely to be, but the shorter it is, the longer the gap between scans will be. Remember that this is in seconds.

### Usage
You'll need Node.js version 16.9.0 or later to operate the bot. Run "node deploy-commands.js" in your terminal before launching the bot. The slash instructions will then be registered; otherwise, they won't show up in Discord. Run "node index.js" to start the bot once you're ready.

## Commands

### /help
Sends the bot's list of commands

### /stats
Sends some stats about the bot

### /randserver
Fetches a random Minecraft server

### /pingserver \<ip\> \<port\>
Fetches the current status of a server

#### Arguments:
##### ip
The ip address of the server
    
##### port
The port of the server

### /getplayers \<ip\> \<port\>
Attempts to fetch a list of players on a server

#### arguments:
##### ip
The ip address of the server
    
##### port
The port of the server
ㅤ
### /search <scan> [minonline] [maxonline] [playercap] [isfull] [version] [hasimage] [description] [strictdescription] [player]
Searches the database for a server with specific properties

#### arguments:
##### scan (integer)
How many servers to scan in the search. Use /stats to find the total servers available for scan.

##### playerCap (integer)
The maximum player capacity of the server

##### minonline (integer)
The minimum number of players online

##### maxonline (integer)
The maximum number of players online (Not to be confused with the server's maximum player capacity (playerCap))

##### isfull (true/false)
Whether or not the server is full

##### version (version number)
The version of the server

##### hasimage (true/false)
Whether or not the server has a custom thumbnail image

##### description (text)
The description of the server

##### strictdescription (true/false)
(Used with the description argument) If true, the server's description has to perfectly match the description argument. If false, the server's description only has to contain the description argument

##### player (player name)
Searches for the server a player is currently playing on
