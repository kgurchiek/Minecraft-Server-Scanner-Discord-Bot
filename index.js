const { ShardingManager } = require('discord.js');
const config = require('./config.json');

const manager = new ShardingManager('./bot.js', { token: config.token });
manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));
manager.spawn();

// async function updateCount() {
//     result = await (await fetch(`${config.api}/count`)).json();
//     if (typeof result == 'number') module.exports.totalServers = result;
// }

// updateCount();
// setInterval(updateCount, 60000);