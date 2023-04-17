// Fectches dependencies and inits variables
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const buttonTimeout = 60; // In seconds

// Times out the buttons; fetches how long it has been since last input date
function timeSinceDate(date1) {
  if (date1 == null) {
    date1 = new Date();
  }
  var date2 = new Date();
  var date1Total = date1.getSeconds() + date1.getMinutes() * 60 + date1.getHours() * 3600 + date1.getDay() * 86400;
  var date2Total = date2.getSeconds() + date2.getMinutes() * 60 + date2.getHours() * 3600 + date2.getDay() * 86400;

  return date2Total - date1Total;
}

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

  // Convert Minecraft color and formatting codes to ANSI format
  description = minecraftToAnsi(description);

  if (description == '') {
    description = '​'; // zero width space
  }

  return String(description);
}

function getVersion(response) {
  var version = "";
  if (response == null) {
    version = '​'; // zero width space
  } else if (response.name != null) {
    version = response.name;
  } else {
    version = response;
  }

  version += ''; // make sure version is a string

  if (version.length > 150) {
    version = version.substring(0, 150) + "...";
  }

  // Convert Minecraft color and formatting codes to ANSI format
  version = minecraftToAnsi(version);

  if (version == '') {
    version = '​'; // zero width space
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

// Exports an object with the parameters for the target server
module.exports = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Searches the current database for a server with specific properties")
    .addIntegerOption(option =>
      option
        .setName("minonline")
        .setDescription("The minimum number of online players"))
    .addIntegerOption(option =>
      option
        .setName("maxonline")
        .setDescription("The maximum number of online players"))
    .addIntegerOption(option =>
      option
        .setName("playercap")
        .setDescription("The server's maximum player capacity"))
    .addBooleanOption(option =>
      option
        .setName("isfull")
        .setDescription("whether or not the server is full"))
    .addStringOption(option =>
      option
        .setName("version")
        .setDescription("The version of the server (uses regex)"))
    .addBooleanOption(option =>
      option
        .setName("hasimage")
        .setDescription("Whether or not the server has a custom favicon"))
    .addStringOption(option =>
      option
        .setName("description")
        .setDescription("The description of the server (uses regex)"))
    .addStringOption(option =>
      option
        .setName("player")
        .setDescription("The name of a player to search for"))
    .addIntegerOption(option =>
      option
        .setName("seenafter")
        .setDescription("The oldest time a sever can be last seen (this doesn't mean it's offline, use /help for more info)")),
  async execute(interaction) {
    const interactReplyMessage = await interaction.reply({ content: 'Searching...', fetchReply: true });
    const { scannedServers } = require('../index.js');

    // Create unique IDs for each button
    const lastResultID = 'searchLastResult' + interaction.id;
    const nextResultID = 'searchNextResult' + interaction.id;
    const searchNextResultFilter = interaction => interaction.customId == nextResultID;
    const searchLastResultFilter = interaction => interaction.customId == lastResultID;
    const searchNextResultCollector = interaction.channel.createMessageComponentCollector({ filter: searchNextResultFilter });
    const searchLastResultCollector = interaction.channel.createMessageComponentCollector({ filter: searchLastResultFilter });
    var lastButtonPress = null;

    // Get arguments
    var minOnline = {
      value: 0,
      consider: false
    };
    var maxOnline = {
      value: 0,
      consider: false
    };
    var playerCap = {
      value: 10,
      consider: false
    }
    var isFull = {
      value: false,
      consider: false
    };
    var version = {
      value: "1.19.2",
      consider: false
    };
    var hasImage = {
      value: "false",
      consider: false
    };
    var description = {
      value: "false",
      consider: false
    };
    var player = {
      value: "Steve",
      consider: false
    };
    var seenafter = {
      value: 0,
      consider: false
    }

    // Inits some more variables
    var args = [];
    var currentEmbed = 0;

    // Creates interactable buttons
    function createButtons(filteredResults) {
      var buttons;
    
      if (filteredResults.length > 1) {
        buttons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(lastResultID)
              .setLabel('Last Page')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(nextResultID)
              .setLabel('Next Page')
              .setStyle(ButtonStyle.Primary)
          );
      } else {
        buttons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(lastResultID)
              .setLabel('Last Page')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId(nextResultID)
              .setLabel('Next Page')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );
      }
    
      // Event listener for 'Next Page' button
      searchNextResultCollector.on('collect', async interaction => {
        var newEmbed = new EmbedBuilder()
          .setColor("#02a337")
          .setTitle('Search Results')
          .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
          .addFields(
            { name: 'Updating page...', value: '​' },
          )
          .setTimestamp();
        const interactionUpdate = await interaction.update({ content: '', embeds: [newEmbed], components: [] });
        lastButtonPress = new Date();

        currentEmbed++;
        if (currentEmbed == filteredResults.length) currentEmbed = 0;

        // Updates UI when 'Next Page' pressed
        newEmbed = new EmbedBuilder()
          .setColor("#02a337")
          .setTitle('Search Results')
          .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
          .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${filteredResults[currentEmbed].ip}&port=${filteredResults[currentEmbed].port}`)
          .addFields(
            { name: 'Result ' + (currentEmbed + 1) + '/' + filteredResults.length, value: '​' },
            { name: 'IP', value: filteredResults[currentEmbed].ip },
            { name: 'Port', value: (filteredResults[currentEmbed].port + '') },
            { name: 'Version', value: getVersion(filteredResults[currentEmbed].version) },
            { name: 'Description', value: getDescription(filteredResults[currentEmbed].description) }
          )
          .setTimestamp();

        var playersString = `${filteredResults[currentEmbed].players.online}/${filteredResults[currentEmbed].players.max}`
        if (filteredResults[currentEmbed].players.sample != null) {
          for (var i = 0; i < filteredResults[currentEmbed].players.sample.length; i++) {
            playersString += `\n${filteredResults[currentEmbed].players.sample[i].name}\n${filteredResults[currentEmbed].players.sample[i].id}`;
            if (i + 1 < filteredResults[currentEmbed].players.sample.length) playersString += '\n'
          }
        }

        newEmbed.addFields(
          { name: 'Players', value: playersString },
          { name: 'Last Seen', value: `<t:${filteredResults[currentEmbed].lastSeen}:f>` }
        )

        await interactionUpdate.edit({ content: '', embeds: [newEmbed], components: [buttons] });
      });
    
      // Event listener for 'Last Page' button
      searchLastResultCollector.on('collect', async interaction => {
        var newEmbed = new EmbedBuilder()
          .setColor("#02a337")
          .setTitle('Search Results')
          .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
          .addFields(
            { name: 'Updating page...', value: '​' },
          )
          .setTimestamp();
        const interactionUpdate = await interaction.update({ content: '', embeds: [newEmbed], components: [] });
        
        lastButtonPress = new Date();

        currentEmbed--;
        if (currentEmbed == -1) currentEmbed = filteredResults.length - 1;
    
        // Updates UI when 'Last Page' pressed
        var newEmbed = new EmbedBuilder()
          .setColor("#02a337")
          .setTitle('Search Results')
          .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
          .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${filteredResults[currentEmbed].ip}&port=${filteredResults[currentEmbed].port}`)
          .addFields(
            { name: 'Result ' + (currentEmbed + 1) + '/' + filteredResults.length, value: '​' },
            { name: 'IP', value: filteredResults[currentEmbed].ip },
            { name: 'Port', value: (filteredResults[currentEmbed].port + '') },
            { name: 'Version', value: getVersion(filteredResults[currentEmbed].version) },
            { name: 'Description', value: getDescription(filteredResults[currentEmbed].description) }
          )
          .setTimestamp();

        var playersString = `${filteredResults[currentEmbed].players.online}/${filteredResults[currentEmbed].players.max}`;
        if (filteredResults[currentEmbed].players.sample != null) { 
          for (var i = 0; i < filteredResults[currentEmbed].players.sample.length; i++) {
            playersString += `\n${filteredResults[currentEmbed].players.sample[i].name} ${filteredResults[currentEmbed].players.sample[i].id}`;
            if (i + 1 < filteredResults[currentEmbed].players.sample.length) playersString += '\n'
          }
        }

        newEmbed.addFields(
          { name: 'Players', value: playersString },
          { name: 'Last Seen', value: `<t:${filteredResults[currentEmbed].lastSeen}:f>` }
        )
  
        await interactionUpdate.edit({ content: '', embeds: [newEmbed], components: [buttons] });
      });
    
      return buttons;
    }
    
    // Checks which values were provided
    if (interaction.options.getInteger("minonline") != null) {
      args.push("minOnline:" + interaction.options.getInteger("minonline"));
    }
    if (interaction.options.getInteger("maxonline") != null) {
      args.push("maxOnline:" + interaction.options.getInteger("maxonline"));
    }
    if (interaction.options.getInteger("playercap") != null) {
      args.push("playerCap:" + interaction.options.getInteger("playercap"));
    }
    if (interaction.options.getBoolean("isfull") != null) {
      args.push("isFull:" + interaction.options.getBoolean("isfull"));
    }
    if (interaction.options.getString("version") != null) {
      args.push("version:" + interaction.options.getString("version"));
    }
    if (interaction.options.getBoolean("hasimage") != null) {
      args.push("hasImage:" + interaction.options.getBoolean("hasimage"));
    }
    if (interaction.options.getString("description") != null) {
      args.push("description:" + interaction.options.getString("description"));
    }
    if (interaction.options.getString("player") != null) {
      args.push("player:" + interaction.options.getString("player"));
    }
    if (interaction.options.getInteger("seenafter") != null) {
      args.push("seenafter:" + interaction.options.getInteger("seenafter"));
    }
    
    for (var i = 0; i < args.length; i++) {
      if (args[0].includes(":")) {
        var argument = args[i].split(":")[0];
        var value = args[i].split(":")[1];
        if (argument == "minOnline") {
          minOnline.consider = true;
          minOnline.value = value;
        }

        if (argument == "maxOnline") {
          maxOnline.consider = true;
          maxOnline.value = value;
        }

        if (argument == "playerCap") {
          playerCap.consider = true;
          playerCap.value = value;
        }

        if (argument == "playercap") {
          playerCap.consider = true;
          playerCap.value = value;
        }

        if (argument == "isFull") {
          isFull.consider = true;
          isFull.value = value;
        }

        if (argument == "version") {
          version.consider = true;
          version.value = value;
        }

        if (argument == "hasImage") {
          hasImage.consider = true;
          hasImage.value = value;
        }

        if (argument == "description") {
          description.consider = true;
          description.value = value;
        }

        if (argument == "player") {
          player.consider = true;
          player.value = value;
        }

        if (argument == "seenafter") {
          seenafter.consider = true;
          seenafter.value = value;
        }
      }
    }

    var argumentList = '**Searching with these arguments:**';
    if (minOnline.consider) argumentList += `\n**minonline:** ${minOnline.value}`;
    if (maxOnline.consider) argumentList += `\n**maxonline:** ${maxOnline.value}`;
    if (playerCap.consider) argumentList += `\n**playercap:** ${playerCap.value}`;
    if (isFull.consider) {
      if (isFull.value == 'true') {
        argumentList += '\n**Is Full**';
      } else {
        argumentList += '\n**Not Full**';
      }
    }
    if (version.consider) argumentList += `\n**version:** ${version.value}`;
    if (hasImage.consider) {
      if (hasImage.value == 'true') {
        argumentList += '\n**Has Image**';
      } else {
        argumentList += '\n**Doesn\'t Have Image**'
      }
    }
    if (description.consider) argumentList += `\n**description:** ${description.value}`;
    if (player.consider) argumentList += `\n**player:** ${player.value}`;
    if (seenafter.consider) argumentList += "\n**seenafter: **" + `<t:${seenafter.value}:f>`

    await interactReplyMessage.edit(argumentList);

    var filteredResults = [];

    for (var i = 0; i < scannedServers.length; i++) {
      // Check if the server meets the requirements set by the arguments
      if (scannedServers[i].players == null) scannedServers[i].players = { online: 0, max: 0 };
      var minOnlineRequirement = scannedServers[i].players.online >= minOnline.value || !minOnline.consider;
      var maxOnlineRequirement = scannedServers[i].players.online <= maxOnline.value || !maxOnline.consider;
      var playerCapRequirement = scannedServers[i].players.max == playerCap.value || !playerCap.consider;
      var isFullRequirement = (isFull.value == "false" && scannedServers[i].players.online != scannedServers[i].players.max) || (isFull.value == "true" && scannedServers[i].players.online == scannedServers[i].players.max) || !isFull.consider;
      var versionRequirement = new RegExp(version.value).test(getVersion(scannedServers[i].version)) || !version.consider;
      var hasImageRequirement = scannedServers[i].hasFavicon || hasImage.value == "false" || !hasImage.consider;
      var descriptionRequirement = new RegExp(description.value).test(getDescription(scannedServers[i].description)) || !description.consider;
      var playerRequirement;
      if (player.consider) {
        playerRequirement = false;
        if (scannedServers[i].players.sample != null) {
          for (const obj of scannedServers[i].players.sample) {
            if (obj != null && obj.name == player.value) playerRequirement = true;
          }
        }
      } else {
        playerRequirement = true;
      }
      var seenAfterRequirement = scannedServers[i].lastSeen >= seenafter.value || !seenafter.consider

      if (minOnlineRequirement && maxOnlineRequirement && playerCapRequirement && isFullRequirement && versionRequirement && hasImageRequirement && descriptionRequirement && playerRequirement && seenAfterRequirement) {
        filteredResults.push(scannedServers[i]);
      }
    }

    // If at least one server was found, send the message
    if (filteredResults.length > 0) {
      var buttons = createButtons(filteredResults);
      var newEmbed = new EmbedBuilder()
        .setColor("#02a337")
        .setTitle('Search Results')
        .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
        .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${filteredResults[0].ip}&port=${filteredResults[0].port}`)
        .addFields(
          { name: 'Result ' + 1 + '/' + filteredResults.length, value: 'ㅤ' },
          { name: 'IP', value: filteredResults[0].ip },
          { name: 'Port', value: (filteredResults[0].port + '') },
          { name: 'Version', value: getVersion(filteredResults[0].version) },
          { name: 'Description', value: getDescription(filteredResults[0].description) }
        )
        .setTimestamp()

      var playersString = `${filteredResults[0].players.online}/${filteredResults[0].players.max}`
      if (filteredResults[0].players.sample != null) {
        for (var i = 0; i < filteredResults[0].players.sample.length; i++) {
          playersString += `\n${filteredResults[0].players.sample[i].name}\n${filteredResults[0].players.sample[i].id}`;
          if (i + 1 < filteredResults[0].players.sample.length) playersString += '\n'
        }
      }

      newEmbed.addFields(
        { name: 'Players', value: playersString },
        { name: 'Last Seen', value: `<t:${filteredResults[0].lastSeen}:f>` }
      )
      
      filteredResults = [];
      buttonTimeoutCheck();
      await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
    } else {
      await interactReplyMessage.edit("no matches could be found");
    } 
    lastButtonPress = new Date();

    // Times out the buttons after a few seconds of inactivity (set in buttonTimeout variable)
    async function buttonTimeoutCheck() {
      if (lastButtonPress != null && timeSinceDate(lastButtonPress) >= buttonTimeout) {
        buttons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(lastResultID)
              .setLabel('Last Page')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId(nextResultID)
              .setLabel('Next Page')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );
        await interactReplyMessage.edit({ content: '', components: [buttons] });

        searchNextResultCollector.stop();
        searchLastResultCollector.stop();
      } else {
        setTimeout(function() { buttonTimeoutCheck() }, 500);
      }
    }
  },
};