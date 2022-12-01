# MC-Server-Scanner

<div align="center">
    <a href="https://discord.gg/Uy9m5TP5na"><img src="https://img.shields.io/discord/1005132317297221785?logo=discord" alt="Discord"/></a>
    <img src="https://img.shields.io/github/last-commit/kgurchiek/Minecraft-Server-Scanner-Discord-Bot" alt="GitHub last commit"/>
    <img src="https://img.shields.io/github/languages/code-size/kgurchiek/Minecraft-Server-Scanner-Discord-Bot" alt="GitHub code size in bytes"/>
</div>

## About

This is the full code for a Minecraft server scanner Discord bot I made. This bot itself doesn't do the scanning, it just pings servers in the existing database, which is actively expanded by a seperate scanning program.

If you find any bugs, please report them in the official discord (link above).

You can contact me via discord: Cornbread 2100#8668

## Commands

### /help
Sends the bot's list of commands

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
### /search [minonline] [maxonline] [playerCap] [isfull] [version] [hasImage] [description] [strictDescription]
searches for a server with specific properties

#### arguments:    
#####minonline (integer)
The minimum number of players online

##### maxonline (integer)
The maximum number of players online (not to be confused with the server's maximum player capacity (playerCap))

##### playerCap (integer)
The maximum player capacity of the server

##### isfull (true/false)
Whether or not the server is full

##### version (version number)
The version of the server

##### hasImage (true/false)
Whether or not the server has a custom thumbnail image

##### description (text)
The description of the server

##### strictDescription (true/false)
(Used with the description argument) If true, the server's description has to perfectly match the description argument. If false, the server's description only has to contain the description argument.
