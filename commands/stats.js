// Imports
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require("node-fetch")
var serverListRaw;
var serverList;
var lastFetch;

function timeSinceDate(date1) {
  if (date1 == null) {
    date1 = new Date();
  }
  var date2 = new Date();
  var date1Total = date1.getSeconds() + date1.getMinutes() * 60 + date1.getHours() * 3600 + date1.getDay() * 86400;
  var date2Total = date2.getSeconds() + date2.getMinutes() * 60 + date2.getHours() * 3600 + date2.getDay() * 86400;

  return date2Total - date1Total;
}

module.exports = {
	// Sets up the command
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Sends helpful info about the bot'),
	async execute(interaction) {
    await interaction.reply({ content: 'Retrieving stats...', ephemeral: true });
		if (lastFetch == null || timeSinceDate(lastFetch) > 600) {
      lastFetch = new Date();
      serverListRaw = await fetch('https://api.cornbread2100.com/serverList');
      serverList = await serverListRaw.json();
    }
		var totalSeconds = (interaction.client.uptime / 1000);
    const days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const exampleEmbed = new EmbedBuilder()
	  .setColor("#02a337")
      .setTitle('Statistics')
      .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'})
        // Adds more fields to the embed
      .addFields(
        { name: 'Total Servers', value: String(serverList.length) },
	      { name: 'Uptime:', value: `${hours}:${minutes}:${seconds}  ${days} Days`}
	    )
      	// Send the embed to the user
        await interaction.editReply({ content: '', embeds: [exampleEmbed], ephemeral:true });
    },
};