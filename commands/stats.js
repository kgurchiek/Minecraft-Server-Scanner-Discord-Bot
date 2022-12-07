const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { totalServers } = require('../serverList.json');
const { maxPings, pingTimeout } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Sends helpful info about the bot'),
	async execute(interaction) {
    const exampleEmbed = new EmbedBuilder()
	    .setColor("#02a337")
    	.setTitle('Statistics')
    	.setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */})
    	.addFields(
    		{ name: 'Total Servers', value: String(totalServers) },
			{ name: "Estimated Wait For Full Scan", value: String(pingTimeout * Math.ceil(totalServers / maxPings) / 1000) + ' seconds' }
		)
    	.setTimestamp()
    interaction.reply({ embeds: [exampleEmbed] });
	},
};