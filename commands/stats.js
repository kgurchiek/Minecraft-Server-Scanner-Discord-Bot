// Imports
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
const client = new MongoClient("mongodb://localhost");
const MCSS = client.db("MCSS");
const servers = MCSS.collection("servers");

var totalServers;
servers.find({ }).toArray().then((data) => {(totalServers = data.length)});

module.exports = {
	// Sets up the command
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Sends helpful info about the bot'),
	async execute(interaction) {
		let totalSeconds = (interaction.client.uptime / 1000);
        let days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = Math.floor(totalSeconds % 60);
        const exampleEmbed = new EmbedBuilder()
	  .setColor("#02a337")
    	  .setTitle('Statistics')
    	  .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'})
      	  // Adds more fields to the embed
    	  .addFields(
    	    { name: 'Total Servers', value: String(totalServers) },
	    { name: 'Uptime:', value: `${hours}:${minutes}:${seconds}  ${days} Days`}
	  )
      	// Send the embed to the user
        interaction.reply({ embeds: [exampleEmbed], ephemeral:true });
    },
};
