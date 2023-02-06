const { token } = require("./config.json");
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');

//Init Discord.js and the commands
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Reads the files in the 'commands' dir
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Iterate over each command file, require it, and add it to the 'client.commands' Collection
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
  console.log("loaded " + file);
}

// When the client is ready, log a message to the console (NOT in the Discord server)
client.once(Events.ClientReady, () => {
	console.log("Bot online");
  
	// Log how many servers the bot is logged in to
  if (client.guilds.cache.size == 1)
  {
    console.log("Logged into 1 server");
  } else {
    console.log("Logged into " + client.guilds.cache.size + " servers");
  }
  
  isReady = true;
});

// When a chat input command is received, try to execute it
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

// Log the bot in to the Discord API
client.login(token);
