// Imports
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	// Sets up the command
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Sends helpful info about the bot'),
	async execute(interaction) {
    const { client, scannedServersDB } = require('../index.js');

    // Status message
    await interaction.reply({ content: 'Retrieving stats...', ephemeral: true });
		
    const userTag = await client.users.fetch("720658048611516559");
    const totalServers = await scannedServersDB.countDocuments();
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
        { name: 'Author:', value: userTag.tag },
        { name: 'Total Servers:', value: String(totalServers) },
	      { name: 'Bot Stats:', value: `In ${client.guilds.cache.size} Discord servers. Uptime: ${days} days and ${hours}:${minutes}:${seconds}.`}
	    )
      	// Send the embed to the user
        await interaction.editReply({ content: '', embeds: [exampleEmbed], ephemeral:true });
    },
};