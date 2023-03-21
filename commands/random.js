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
  // Define 'randserver' command
  data: new SlashCommandBuilder()
    .setName('random')
	  .setDescription('Gets a random Minecraft server'),
  async execute(interaction) {
    // Status message
    await interaction.reply("Getting a server, please wait..."); 

    const serverListRaw = await fetch('https://api.cornbread2100.com/serverList');
    const serverList = await serverListRaw.json();
    
    function sendMessage() {
      // Generate a random number to select a server from the list of successful pings
      var matchNumber = Math.round((Math.random() * serverList.length));

      fetch(`https://ping.cornbread2100.com/ping/?ip=${serverList[matchNumber].ip}&port=${serverList[matchNumber].port}`)
      .then(rawtext => rawtext.text())
      .then(text => {
        //console.log(response);
        
        if (text == 'timeout') {
          sendMessage();
        } else {
          response = JSON.parse(text);
          var newEmbed = new EmbedBuilder()
            .setColor("#02a337")
            .setTitle('Random Server')
            .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'})
            .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${serverList[matchNumber].ip}&port=${serverList[matchNumber].port}`)
            .addFields(
              { name: 'IP', value: serverList[matchNumber].ip },
              { name: 'Port', value: String(serverList[matchNumber].port) },
              { name: 'Version', value: cleanVersion(response.version.name) },
              { name: 'Description', value: getDescription(response.description) },
              { name: 'Players', value: response.minPlayers + '/' + response.maxPlayers }
            )
            .setTimestamp()

          interaction.editReply({ content:'', embeds: [newEmbed] });
        }
      })
      .catch(error => {
        // If the fetch fails, try again with a different server
        sendMessage();
      });
    }

    sendMessage();
  },
}
