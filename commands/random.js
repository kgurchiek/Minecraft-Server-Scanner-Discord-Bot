// Imports
const wait = require('node:timers/promises').setTimeout;
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require("node-fetch");
const { getDescription, getVersion } = require('./commonFunctions.js')

module.exports = {
  // Define 'randserver' command
  data: new SlashCommandBuilder()
    .setName('random')
	  .setDescription('Gets a random Minecraft server'),
  async execute(interaction) {
    // Status message
    await interaction.reply("Getting a server, please wait...");

    // Import server data
    const { scannedServers } = require('../index.js');
    if (scannedServers == null) {
      var errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .addFields({ name: 'Error', value: 'Fetching api, try again in a few seconds.' })
      await interaction.editReply({ embeds: [errorEmbed] })
      return;
    }
    
    // Generate a random number to select a server from the list of successful pings
    var index = Math.round((Math.random() * scannedServers.length));
    var newEmbed = new EmbedBuilder()
        .setColor("#02a337")
        .setTitle('Search Results')
        .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
        .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${scannedServers[index].ip}&port=${scannedServers[index].port}`)
        .addFields(
          { name: 'Result ' + 1 + '/' + scannedServers.length, value: 'ㅤ' },
          { name: 'IP', value: scannedServers[index].ip },
          { name: 'Port', value: (scannedServers[index].port + '') },
          { name: 'Version', value: cleanVersion(scannedServers[index].version) },
          { name: 'Description', value: getDescription(scannedServers[index].description) }
        )
        .setTimestamp()

      var playersString = `${scannedServers[index].players.online}/${scannedServers[index].players.max}`
      if (scannedServers[index].players.sample != null) {
        for (var i = 0; i < scannedServers[index].players.sample.length; i++) {
          playersString += `\n${scannedServers[index].players.sample[i].name}\n${scannedServers[index].players.sample[i].id}`;
          if (i + 1 < scannedServers[index].players.sample.length) playersString += '\n'
        }
      }

      newEmbed.addFields(
        { name: 'Players', value: playersString },
        { name: 'Last Seen', value: `<t:${scannedServers[index].lastSeen}:f>` }
      )

    interaction.editReply({ content:'', embeds: [newEmbed] });
  },
}
