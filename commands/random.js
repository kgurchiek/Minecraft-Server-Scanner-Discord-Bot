// Imports
const wait = require('node:timers/promises').setTimeout;
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require("node-fetch");

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
  } else if (Array.isArray(response)) {
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

  // Convert Minecraft color and formatting codes to ANSI format
  description = minecraftToAnsi(description);

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

  // Convert Minecraft color and formatting codes to ANSI format
  version = minecraftToAnsi(version);

  if (version == '') {
    version = '​'; //zero width space
  }

  return String(version);
}

function minecraftToAnsi(text) {
  colors = {
    "0": 30,
    "1": 34,
    "2": 32,
    "3": 36,
    "4": 31,
    "5": 35,
    "6": 33,
    "7": 37,
    "8": 30,
    "9": 34,
    "a": 32,
    "b": 36,
    "c": 31,
    "d": 35,
    "e": 33,
    "f": 37,
  }
  
  formats = {
    "l": 1,
    "m": 0,
    "n": 4,
    "r": 0,
  }
  
  result = '```ansi\n'
  splitText = text.split('§');
  if (splitText.length == 1) return text;
  color = 30;
  format = 0;
  if (text.startsWith('§')) {
    if (colors[text.charAt(1)] != null) {
      color = colors[text.charAt(1)];
    }

    if (formats[text.charAt(1)] != null) {
      format = formats[text.charAt(1)];
    }

    result += `\u001b[${format};${color}m` + String(splitText[0]).substring(1);
  } else {
    result += splitText[0];
  }
  for (var i = 1; i < splitText.length; i++) {
    if (colors[splitText[i].charAt(0)] != null) {
      color = colors[splitText[i].charAt(0)];
    }

    if (formats[splitText[i].charAt(0)] != null) {
      format = formats[splitText[i].charAt(0)];
    }

    result += `\u001b[${format};${color}m` + splitText[i].substring(1);
  }

  result += '```';
  return result;
}

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
      .setTitle('Random Server')
      .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'})
      .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${scannedServers[index].ip}&port=${scannedServers[index].port}`)
      .addFields(
        { name: 'IP', value: scannedServers[index].ip },
        { name: 'Port', value: String(scannedServers[index].port) },
        { name: 'Version', value: cleanVersion(scannedServers[index].version.name) },
        { name: 'Description', value: getDescription(scannedServers[index].description) },
        { name: 'Players', value: scannedServers[index].players.online + '/' + scannedServers[index].players.max }
      )
      .setTimestamp()

    interaction.editReply({ content:'', embeds: [newEmbed] });
  },
}
