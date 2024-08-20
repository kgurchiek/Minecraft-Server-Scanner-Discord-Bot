const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Sends helpful info about the bot'),
  async execute(interaction) {
    const exampleEmbed = new EmbedBuilder()
      .setColor("#02a337")
    	.setTitle('Help Menu')
    	.setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'})
    	.addFields(
				{ name: '/stats', value: 'Sends stats about the bot\n' + '​' },
				{ name: '/random', value: 'Gets a random online Minecraft server\n' + '​' },
				{ name: '/ping', value: 'Fetches info from a given Minecraft server'},
					{ name: 'ip', value: 'The ip address of the server', inline: true },
			  		{ name: 'port', value: 'The port of the server (defaults to 25565)\n' + '​', inline: true },
		   			{ name: '/search', value: 'searches for a server with specific properties'},
					{ name: 'playercount (range)', value: 'A range of how many players on on the server (e.g. 4, >10, <=5, 11-20)', inline: true },
					{ name: 'playercap (integer)', value: 'The maximum player capacity of the server', inline: true },
					{ name: 'isfull (true/false)', value: 'Whether or not the server is full', inline: true },
					{ name: 'player (player name)', value: 'A player that is currently playing on the server', inline: true },
					{ name: 'playerhistory (player name)', value: 'The name of a player that has been on the server in the past', inline: true },
					{ name: 'version (regex)', value: 'The version of the server', inline: true },
					{ name: 'hasimage (true/false)', value: 'Whether or not the server has a custom favicon', inline: true },
					{ name: 'description (regex)', value: 'The description of the server', inline: true },
					{ name: 'hasplayerlist (boolean)', value: 'Whether or not the server has player list enabled', inline: true },
					{ name: 'seenafter (unix timestamp)', value: `The oldest time a server can be last seen. This doesn't mean the server is offline, it could be that the ping was lost due to packet loss. Recommended: ${Math.round(new Date().getTime() / 1000) - 3600} (1 hour ago)\n` + '​', inline: true },
					{ name: 'iprange (ip subnet)', value: 'The ip subnet a server\'s ip has to be within', inline: true },
					{ name: 'port (integer)', value: 'The port the server is hosted on', inline: true },
					{ name: 'country (country name)', value: 'The country the server is hosted in', inline: true },
					{ name: 'org (organization name, uses regex)', value: 'The organization the ip belongs to', inline: true },
					{ name: 'cracked (true/false)', value: 'Whether or not the server is cracked (offline mode)\n' + '​', inline: true },
				{ name: '/streamsnipe', value: 'Gets servers that live Twitch streamers are playing on' + '​', inline: true },
					{ name: 'language (language name)', value: 'The language of the Twitch stream (you must use the autocomplete for it to work)\n' + '​', inline: true }
		);
      interaction.reply({ embeds: [exampleEmbed], ephemeral: true });
   }
}
