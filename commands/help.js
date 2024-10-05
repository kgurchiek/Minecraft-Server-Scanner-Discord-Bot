const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Sends helpful info about the bot'),
  async execute(interaction) {
		let embeds = [
			new EmbedBuilder()
				.setColor("#02a337")
				.setTitle('/stats')
				.setDescription('Displays stats about the bot'),
			new EmbedBuilder()
				.setColor("#02a337")
				.setTitle('/random')
				.setDescription('Gets a random online Minecraft server'),
			new EmbedBuilder()
				.setColor("#02a337")
				.setTitle('/ping')
				.setDescription('Fetches info from a given Minecraft Java server')
				.addFields(
					{ name: 'ip', value: 'The ip address of the server', inline: true },
					{ name: 'port', value: 'The port of the server (defaults to 25565)', inline: true }
				),
			new EmbedBuilder()
				.setColor("#02a337")
				.setTitle('/bedrockping')
				.setDescription('Fetches info from a given Minecraft Bedrock server')
				.addFields(
					{ name: 'ip', value: 'The ip address of the server', inline: true },
					{ name: 'port', value: 'The port of the server (defaults to 19132)', inline: true }
				),
			new EmbedBuilder()
				.setColor("#02a337")
				.setTitle('/search')
				.setDescription('Searches for a server with specific properties')
				.addFields(
					{ name: 'minimal', value: 'Only shows ip and port in preview (recommended for mobile users)', inline: true },
					{ name: 'skip', value: 'Skips to a page of results', inline: true },
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
					{ name: 'country (country name)', value: 'The country the server is hosted in (use the autocomplete options)', inline: true },
					{ name: 'org (organization name, uses regex)', value: 'The organization the ip belongs to', inline: true },
					{ name: 'cracked (true/false)', value: 'Whether or not the server is cracked (offline mode)\n', inline: true },
					{ name: 'whitelist (true/false)', value: 'Whether or not the server has a whitelist', inline: true },
				),
			new EmbedBuilder()
				.setColor("#02a337")
				.setTitle('/streamsnipe')
				.setDescription('Gets servers that live Twitch streamers are playing on')
				.addFields({ name: 'language (language name)', value: 'The language of the Twitch stream (you must use the autocomplete for it to work)', inline: true })
			]
    interaction.reply({ embeds, ephemeral: true });
	}
}
