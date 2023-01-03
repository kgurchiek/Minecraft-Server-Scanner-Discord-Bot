// Imports
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { totalServers } = require('../serverList.json');
const { maxPings, pingTimeout } = require('../config.json');

module.exports = {
	// Sets up the command
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Sends helpful info about the bot'),
	async execute(interaction) {
      const exampleEmbed = new EmbedBuilder()
	    .setColor("#02a337")
    	.setTitle('Statistics')
    	.setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'})
      // Adds more fields to the embed
    	.addFields(
    		{ name: 'Total Servers', value: String(totalServers) }
		)
    	.setTimestamp()
      // Send the embed back to the user
      interaction.reply({ embeds: [exampleEmbed] });
    },
};
