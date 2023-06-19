const config = require("./config.json");
const fs = require('node:fs');
const path = require('node:path');
const { Client, Partials, Collection, Events, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const { MongoClient } = require('mongodb');
const mongoClient = new MongoClient("mongodb+srv://public:public@mcss.4nrik58.mongodb.net/?retryWrites=true&w=majority");
const scannedServersDB = mongoClient.db("MCSS").collection("scannedServers");

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

// When the client is ready, log a message to the console (NOT in the Discord server)
client.once(Events.ClientReady, () => {
  // Logs how many servers the bot is logged in to
  console.log(`[Bot]: ${client.user.tag}`)
  console.log("[Servers]: " + client.guilds.cache.size);
  (async () => { client.user.setPresence({ activities: [{ name: `${await scannedServersDB.countDocuments()} Minecraft servers`, type: ActivityType.Watching }]}); })();
  setInterval(async () => {
    client.user.setPresence({ activities: [{ name: `${await scannedServersDB.countDocuments()} Minecraft servers`, type: ActivityType.Watching }]});
  }, 60000)
});

// When a chat input command is received, attempt to execute it
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.log('[Error]:');
      console.log(error);
      var errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .addFields({ name: 'Error', value: error.toString() })
      try {
        await interaction.reply({ embeds: [errorEmbed] })
      } catch (err) {
        await interaction.editReply({ content: '', embeds: [errorEmbed] })
      }
    }
  } else if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.autocomplete(interaction);
    } catch (error) {}
  }
});

// Log the bot into the Discord API
client.login(config.token);

module.exports = {
  client,
  scannedServersDB
}