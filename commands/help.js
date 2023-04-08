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
    	  { name: '/stats', value: 'Sends stats about the bot\n' + '​' },
		    { name: '/random', value: 'Gets a random Minecraft server\n' + '​' },
    		{ name: '/ping <ip> [port]', value: 'Fetches info from a given Minecraft server'},
    		  { name: 'ip', value: 'The ip address of the server', inline: true },
			    { name: 'port', value: 'The port of the server (defaults to 25565)\n' + '​', inline: true },
				{ name: '/auth <ip> <version> [port]', value: 'Checks if a server requires account authentication'},
    			{ name: 'ip', value: 'The ip address of the server', inline: true },
					{ name: 'version', value: 'The Minecraft version to attempt a join from', inline: true },
			    { name: 'port', value: 'The port of the server (defaults to 25565)\n' + '​', inline: true },
		    { name: '/search [minonline] [maxonline] [playerCap] [isfull] [version] [hasImage] [description] [strictDescription]', value: 'searches for a server with specific properties'},
			    { name: 'minonline (integer)', value: 'The minimum number of players online', inline: true },
			    { name: 'maxonline (integer)', value: 'The maximum number of players online (not to be confused with the server\'s maximum player capacity (playerCap))', inline: true },
			    { name: 'playercap (integer)', value: 'The maximum player capacity of the server', inline: true },
          { name: 'isfull (true/false)', value: 'Whether or not the server is full', inline: true },
			    { name: 'version (version number)', value: 'The version of the server', inline: true },
          { name: 'hasimage (true/false)', value: 'Whether or not the server has a custom thumbnail image', inline: true },
          { name: 'description (text)', value: 'The description of the server', inline: true },
          { name: 'strictdescription (true/false)', value: 'If true, the server\'s description has to perfectly match the description argument. If false, the server\'s description only has to contain the description argument.', inline: true },
          { name: 'player (player name)', value: 'The name of a player to search for\n' + '​', inline: true }
		)
    interaction.reply({ embeds: [exampleEmbed], ephemeral:true });
	},
};
