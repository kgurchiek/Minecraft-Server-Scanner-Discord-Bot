const { ShardingManager } = require('discord.js');
const config = require('./config.json');

const manager = new ShardingManager('./bot.js', { token: config.token });
manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));
manager.spawn();

(async () => {
    module.exports.totalServers = await (await fetch(`${config.api}/count`)).json();
    setInterval(async () => module.exports.totalServers = await (await fetch(`${config.api}/count`)).json(), 60000);
})();