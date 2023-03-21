const { REST, Routes } = require('discord.js');
const { token, clientId } = require('./config.json');
const fs = require('node:fs');

const commands = [];
// Grabs the command files from the commands directory
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// Deploy the commands to the bot
(async () => {
	try {
		console.log(`[Refreshing]: ${commands.length}`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

		console.log(`[Refreshed]: ${data.length}`);
	} catch (error) {
		// Catches & logs any errors into the console
		console.error(error);
	}
})();
