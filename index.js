const { ShardingManager } = require('discord.js');
const config = require('./config.json');

const manager = new ShardingManager('./bot.js', { token: config.token });
let shards = [];
manager.on('shardCreate', shard => {
    console.log(`Launched shard ${shard.id}`);
    shards.push(shard);
});
manager.spawn();

async function updateCount() {
    result = await (await fetch(`${config.api}/count`)).json();
    if (typeof result == 'number') for (const shard of shards) shard.send({ type: 'updateCount', count: result });
}

updateCount();
setInterval(updateCount, 60000);