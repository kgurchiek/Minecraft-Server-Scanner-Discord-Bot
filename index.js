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
    let result = (await (await fetch(`${config.api}/count`)).json()).data;
    if (typeof result == 'number') for (const shard of shards) shard.send({ type: 'updateCount', count: result });
}

async function updateBedrockCount() {
    let result = (await (await fetch(`${config.api}/bedrockCount`)).json()).data;
    if (typeof result == 'number') for (const shard of shards) shard.send({ type: 'updateBedrockCount', count: result });
}

updateCount();
setInterval(updateCount, 60000);
updateBedrockCount();
setInterval(updateBedrockCount, 60000);