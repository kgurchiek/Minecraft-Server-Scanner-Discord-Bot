const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	// Defines help command
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Sends helpful info about the bot'),
	// Sends command list when triggered
	async execute(interaction) {
		// Embed with every command + descriptions
    const exampleEmbed = new EmbedBuilder()
	    .setColor("#02a337")
    	.setTitle('Help Menu')
    	.setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */})
    	.addFields(
			{ name: '/stats', value: 'Some basic stats about the bot\n' + 'ㅤ'},
    		{ name: '/randserver', value: 'Gets a random Minecraft server\n' + 'ㅤ' },
    		{ name: '/pingserver <ip> <port>', value: 'gets info from a server'},
				{ name: 'ip', value: 'The ip address of the server', inline: true },
				{ name: 'port', value: 'The port of the server\n' + 'ㅤ', inline: true },
			{ name: '/search [minonline] [maxonline] [playerCap] [isfull] [version] [hasImage] [description] [strictDescription]', value: 'searches for a server with specific properties'},
				{ name: 'minonline (integer)', value: 'The minimum number of players online', inline: true },
				{ name: 'maxonline (integer)', value: 'The maximum number of players online (not to be confused with the server\'s maximum player capacity (playerCap))', inline: true },
				{ name: 'playerCap (integer)', value: 'The maximum player capacity of the server', inline: true },
				{ name: 'isfull (true/false)', value: 'Whether or not the server is full', inline: true },
				{ name: 'version (version number)', value: 'The version of the server', inline: true },
				{ name: 'hasImage (true/false)', value: 'Whether or not the server has a custom thumbnail image', inline: true },
				{ name: 'description (text)', value: 'The description of the server', inline: true },
				{ name: 'strictDescription (true/false)', value: '(Used with the description argument) If true, the server\'s description has to perfectly match the description argument. If false, the server\'s description only has to contain the description argument.', inline: true },
			{ name: '/getplayers <ip> <port>', value: 'attempts to get a player list from a server'},
				{ name: 'ip', value: 'The ip address of the server', inline: true },
				{ name: 'port', value: 'The port of the server\n' + 'ㅤ', inline: true }
    	)
    	.setTimestamp()
    interaction.reply({ embeds: [exampleEmbed] });
	},
};
