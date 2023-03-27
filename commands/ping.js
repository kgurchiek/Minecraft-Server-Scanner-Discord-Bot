const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

function getDescription(response) {
  var description = "";
  if (response == null) {
    description = '​'; // zero width space
  } else if (response.extra != null && response.extra.length > 0) {
    if (response.extra[0].extra == null) {
      for (var i = 0; i < response.extra.length; i++) {
        description += response.extra[i].text;
      }
    } else {
      for (var i = 0; i < response.extra[0].extra.length; i++) {
        description += response.extra[0].extra[i].text;
      }
    }
  } else if (response.text != null) {
    description = response.text;
  } else if (response.translate != null) {
    description = response.translate;
  } else if (response[0] != null) {
    for (var i = 0; i < response.length; i++) {
      description += response[i].text;
    }
  } else if (response != null) {
    description = response;
  } else {
    description = "Couldn't get description";
  }

  if (description.length > 150) {
    description = description.substring(0, 150) + "...";
  }

  // Remove Minecraft color/formatting codes
  while (description.startsWith('§')) {
    description = description.substring(2, description.length);
  }

  if (description.split('§').length > 1) {
    var splitDescription = description.split('§');

    description = splitDescription[0];
    for (var i = 1; i < splitDescription.length; i++) {
      description += splitDescription[i].substring(1, splitDescription[i].length);
    }
  }

  if (description == '') {
    description = '​'; // zero width space
  }

  return String(description);
}

function cleanVersion(version) {
  version += "";
  if (version.length > 150) {
    version = version.substring(0, 150) + "...";
  }

  // Remove Minecraft color/formatting codes
  while (version.startsWith('§')) {
    version = version.substring(2, version.length);
  }

  if (version.split('§').length > 1) {
    var splitVersion = version.split('§');

    version = splitVersion[0];
    for (var i = 1; i < splitVersion.length; i++) {
      version += splitVersion[i].substring(1, splitVersion[i].length);
    }
  }

  if (version == '') {
    version = 'ㅤ';
  }

  return String(version);
}

module.exports = {
  // Command options
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Pings a server for info")
    .addStringOption(option =>
      option.setName("ip")
	    .setDescription("The ip of the server to ping")
      .setRequired(true))
    .addIntegerOption(option =>
      option.setName("port")
	    .setDescription("The port of the server to ping")),
    async execute(interaction) {
    // Ping status
    await interaction.reply("Pinging, Please wait.");
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
            .setTitle('Random Server')
            .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'})
            .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${ip}&port=${port}`)
            .addFields(
              { name: 'IP', value: ip },
              { name: 'Port', value: port.toString() },
              { name: 'Version', value: cleanVersion(response.version.name) },
              { name: 'Description', value: getDescription(response.description) },
              { name: 'Players', value: response.players.online + '/' + response.players.max }
            )
            .setTimestamp()

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
