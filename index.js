const { REST, Routes, ShardingManager } = require('discord.js');
const config = require('./config.json');
const fs = require('node:fs');


// Deploy slash commands
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}
const rest = new REST({ version: '10' }).setToken(config.discord.token);
(async () => {
	try {
		console.log(`[Refreshing]: ${commands.length}`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
            Routes.applicationCommands(config.discord.clientId),
            { body: commands },
        );

		console.log(`[Refreshed]: ${data.length}`);
	} catch (error) {
		// Catches & logs any errors into the console
		console.error(error);
	}
})();


const manager = new ShardingManager('./bot.js', { token: config.discord.token });
let shards = [];
manager.on('shardCreate', shard => {
    console.log(`Launched shard ${shard.id}`);
    shards.push(shard);
});
manager.spawn();

async function updateCount() {
    let result = (await (await fetch(`${config.api}/count`)).json()).data;
    if (typeof result == 'number') for (const shard of shards) shard.send({ type: 'updateCount', count: result });
}

async function updateBedrockCount() {
    let result = (await (await fetch(`${config.api}/bedrockCount`)).json()).data;
    if (typeof result == 'number') for (const shard of shards) shard.send({ type: 'updateBedrockCount', count: result });
}

if (config.discord.stats) {
    updateCount();
    setInterval(updateCount, 60000);
    updateBedrockCount();
    setInterval(updateBedrockCount, 60000);
}


let twitchAccessToken;
let accessTokenTimeout = 0;
async function refreshAccessToken() {
    if (Math.floor((new Date()).getTime() / 1000) >= accessTokenTimeout - 21600) {
        const twitchResponse = await (await fetch(`https://id.twitch.tv/oauth2/token?client_id=${config.twitch.clientId}&client_secret=${config.twitch.secret}&grant_type=client_credentials`, {
            method: 'POST'
        })).json();
        twitchAccessToken = twitchResponse.access_token;
        accessTokenTimeout = (new Date()).getTime() / 1000 + twitchResponse.expires_in;
    }
}

async function fetchStreams() {
   if (twitchAccessToken == null) await (new Promise(resolve => setInterval(() => { if (twitchAccessToken != null) resolve(); }, 100)));
    
    let streams = [];
    const options = {
        method: 'GET',
        headers: {
            'Client-ID': config.twitch.clientId,
            'Authorization': `Bearer ${twitchAccessToken}`
        }
    }
    let response = await (await fetch('https://api.twitch.tv/helix/streams?game_id=27471&first=100', options)).json();
    streams = response.data;
    do {
        try {
            response = await (await fetch(`https://api.twitch.tv/helix/streams?game_id=27471&first=100&after=${response.pagination.cursor}`, options)).json();
            streams = streams.concat(response.data);
        } catch (err) {}
    } while (response.pagination?.cursor != null)
    for (const shard of shards) shard.send({ type: 'twitchStreams', streams });

    results = (await (await fetch(`${config.api}/servers?includePlayers=true&limit=1000`, {
        method: 'POST',
        body: JSON.stringify({
            onlinePlayer: {
                caseInsensitive: true,
                data: streams.map(a => a.user_name)
            }
        })
    })).json()).data;

    for (let result of results) {
        result.streams = streams
            .filter(a => result.playerHistory.filter(a => a.lastSession == result.lastSeen).map(a => a.name.toLowerCase()).includes(a.user_name.toLowerCase()))
            .filter((a, i, arr) => !arr.slice(0, i).some(b => a.user_name == b.user_name))
            .slice(0, 10);
    }
    results = results.filter(a => a.streams.length > 0);
    for (const shard of shards) shard.send({ type: 'twitchResults', results });
}

if (config.twitch.enabled) {
    refreshAccessToken();
    setInterval(refreshAccessToken, 7200);
    fetchStreams();
    setInterval(fetchStreams, 10000);
}