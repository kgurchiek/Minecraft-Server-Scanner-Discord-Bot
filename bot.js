const config = require("./config.json");
const fs = require('node:fs');
const path = require('node:path');
const { Client, Partials, Collection, Events, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const buttonCallbacks = {};

// Catch all errors
process.on('uncaughtException', console.error);

// Initialize Discord.js (Along with the commands)
const client = new Client({ partials: [Partials.Channel], intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages] });
client.commands = new Collection();

// Reads the files in the commands directory
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Iterate over each command file, require it, and add it to the 'client.commands' collection
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
    console.log("[Loaded]: " + file);
}

let totalServers;
function updateTotalServers(newTotalServers) {
    if (typeof newTotalServers == 'number' && newTotalServers != totalServers) {
        totalServers = newTotalServers;
        if (totalServers != null && totalBedrock != null) client.user.setPresence({ activities: [{ name: `${(totalServers + totalBedrock).toLocaleString()} MC Servers`, type: ActivityType.Watching }]});
    }
}

let totalBedrock;
function updateTotalBedrock(newTotalBedrock) {
    if (typeof newTotalBedrock == 'number' && newTotalBedrock != totalBedrock) {
        totalBedrock = newTotalBedrock;
        if (totalServers != null && totalBedrock != null) client.user.setPresence({ activities: [{ name: `${(totalServers + totalBedrock).toLocaleString()} MC Servers`, type: ActivityType.Watching }]});
    }
}

// When the client is ready, log a message to the console
client.once(Events.ClientReady, async () => {
    // Logs how many servers the bot is logged in to
    console.log(`[Bot]: ${client.user.tag}`)
    console.log("[Servers]: " + (await client.shard.fetchClientValues('guilds.cache.size')).reduce((a, b) => a + b, 0));
});

process.on('message', (message) => {
    switch (message.type) {
        case 'updateCount': {
            updateTotalServers(message.count);
            break;
        }
        case 'updateBedrockCount': {
            updateTotalBedrock(message.count);
            break;
        }
    }
});

// When a chat input command is received, attempt to execute it
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, buttonCallbacks, client, totalServers, updateTotalServers, totalBedrock, updateTotalBedrock);
        } catch (error) {
            console.log('[Error]:');
            console.log(error);
            var errorEmbed = new EmbedBuilder()
                .setColor("#ff0000")
                .addFields({ name: 'Error', value: error.toString() })
            if (interaction.replied || interaction.deferred) await interaction.editReply({ embeds: [errorEmbed] })
            else await interaction.reply({ content: '', embeds: [errorEmbed] })
        }
    } else if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.autocomplete(interaction);
        } catch (error) {}
    } else if (interaction.isButton()) {
        if (buttonCallbacks[interaction.customId]) buttonCallbacks[interaction.customId](interaction);
        else {
            const command = client.commands.get(interaction.customId.split('-')[0]);
            if (command?.buttonHandler) command.buttonHandler(interaction);
        }
    }
});

// Log the bot into the Discord API
client.login(config.token);
