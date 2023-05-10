const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const { getDescription, getVersion } = require('../commonFunctions.js');

module.exports = {
  // Command options
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Fetches info from a given Minecraft server")
    .addStringOption(option =>
      option.setName("ip")
	    .setDescription("The ip of the server to ping")
      .setRequired(true))
    .addIntegerOption(option =>
      option.setName("port")
	    .setDescription("The port of the server to ping")),
    async execute(interaction) {
    // Ping status
    await interaction.reply("Pinging, please wait...");
	  // Fetch IP and Port from the command
    const ip = interaction.options.getString("ip");
    const port = interaction.options.getInteger("port") || 25565;

    fetch(`https://ping.cornbread2100.com/ping/?ip=${ip}&port=${port}`)
      .then(rawtext => rawtext.text())
      .then(text => {
        if (text == 'timeout') {
          var errorEmbed = new EmbedBuilder()
            .setColor("#ff0000")
            .addFields({ name: 'Error', value: "Timeout (is the server offline?)" })
          interaction.editReply({ content: '', embeds: [errorEmbed] })
        } else {
          response = JSON.parse(text);
          var newEmbed = new EmbedBuilder()
            .setColor("#02a337")
            .setTitle('Ping Result')
            .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'})
            .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${ip}&port=${port}`)
            .addFields(
              { name: 'IP', value: ip },
              { name: 'Port', value: port.toString() },
              { name: 'Version', value: getVersion(response.version) },
              { name: 'Description', value: getDescription(response.description) }
            )
            .setTimestamp()

          var playersString = `${response.players.online}/${response.players.max}`;
          if (response.players.sample != null) { 
            for (var i = 0; i < response.players.sample.length; i++) {
              playersString += `\n${response.players.sample[i].name} ${response.players.sample[i].id}`;
              if (i + 1 < response.players.sample.length) playersString += '\n';
            }
          }
          newEmbed.addFields({ name: 'Players', value: playersString })

          interaction.editReply({ content:'', embeds: [newEmbed] });
        }
      })
      .catch(error => {
        console.log(error);
        var errorEmbed = new EmbedBuilder()
          .setColor("#ff0000")
          .addFields({ name: 'Error', value: error.toString() })
        interaction.editReply({ content: '', embeds: [errorEmbed] })
      });
  }
}
