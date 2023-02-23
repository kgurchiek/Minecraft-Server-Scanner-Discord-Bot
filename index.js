const config = require("./config.json");
const fs = require('node:fs');
const path = require('node:path');
const { Client, Partials, Collection, Events, GatewayIntentBits } = require('discord.js');

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

});

// When a chat input command is received, attempt to execute it
client.on(Events.InteractionCreate, async interaction => {
  try {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.log(`[Error]:${error}`);
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  } catch (error) {
    console.log(`[Error]:${error}`);
  }
});

// Log the bot into the Discord API
client.login(config.token);
