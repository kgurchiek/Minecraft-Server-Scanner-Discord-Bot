const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Sends helpful info about the bot'),
	async execute(interaction) {
    const exampleEmbed = new EmbedBuilder()
	    .setColor("#02a337")
    	.setTitle('Help Menu')
    	.setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */})
    	.addFields(
    		{ name: '/stats', value: 'Sends some interesting statistics about the bot, like total servers in the database and uptime.\n' + 'ㅤ' },
		{ name: '/random', value: 'Picks a random server from the database and fetches its data.\n' + 'ㅤ' },
    		{ name: '/pings <ip> <port>', value: 'Fetches some basic info from a specific server.'},
    			{ name: 'ip', value: 'The IP address of the server', inline: true },
			{ name: 'port', value: 'The server\'s port\n' + 'ㅤ', inline: true },
		{ name: '/players <ip> <port>', value: 'Attempts to fetch a list of every player on a server'},
    			{ name: 'ip', value: 'The IP address of the server', inline: true },
			{ name: 'port', value: 'The server\'s port\n' + 'ㅤ', inline: true }
		{ name: '/search <servers> [minOnline] [maxOnline] [playerCap] [isFull] [version] [hasImage] [description] [strictDescription]', value: 'Searches the database for a server with specific properties.'},
			{ name: 'servers (integer)', value: 'How many servers to scan in the search. Use /stats to find the total servers available for scan.', inline: true },
			{ name: 'minonline (integer)', value: 'The minimum number of players online', inline: true },
			{ name: 'maxonline (integer)', value: 'The maximum number of players online (Not to be confused with the server\'s maximum player capacity (playerCap).', inline: true },
			{ name: 'playerCap (integer)', value: 'The maximum player capacity of the server.', inline: true },
			{ name: 'isfull (true/false)', value: 'Whether or not the server is full.', inline: true },
			{ name: 'version (version number)', value: 'The version of Minecraft the server\'s running.', inline: true },
			{ name: 'hasImage (true/false)', value: 'Whether or not the server has a custom thumbnail image.', inline: true },
			{ name: 'description (text)', value: 'The description of the server.', inline: true },
			{ name: 'strictDescription (true/false)', value: 'If true, the server\'s description has to perfectly match the description argument. If false, the server\'s description only has to contain the description argument (Similar to a keyword search).', inline: true },
			{ name: 'player (player name)', value: 'The name of a player to search for\n' + 'ㅤ', inline: true }
		)
    interaction.reply({ embeds: [exampleEmbed], ephemeral:true });
	},
};
