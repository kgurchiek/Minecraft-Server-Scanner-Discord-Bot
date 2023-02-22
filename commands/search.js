// Fetches dependencies and inits variables
const wait = require('node:timers/promises').setTimeout;
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteractionOptionResolver } = require('discord.js');
const { MinecraftServerListPing } = require("minecraft-status");
const { totalServers, successIPs, successPorts } = require("../serverList.json");
const buttonTimeout = 60; // In seconds
const { maxPings, pingTimeout, refreshSearchTime } = require('../config.json');
var lastSearchDate = null;
var lastSearchLength = 0;
var lastSearchResults = [];
var scanning = false;
var scanPercentage = 0;

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

// Exports an object with the parameters for the target server
module.exports = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Searches the current database for a server with specific properties")
    .addStringOption(option =>
      option
        .setName("servers")
        .setDescription("The amount of servers to scan")
        .setRequired(true))
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
        .setDescription("The version of the server"))
    .addBooleanOption(option =>
      option
        .setName("hasimage")
        .setDescription("Whether or not the server has a custom image"))
    .addStringOption(option =>
      option
        .setName("description")
        .setDescription("The description of the server"))
    .addBooleanOption(option =>
      option
        .setName("strictdescription")
        .setDescription("Whether or not the description has to be an exact match"))
    .addStringOption(option =>
      option
        .setName("player")
        .setDescription("The name of a player to search for")),
  async execute(interaction) {
    const interactReplyMessage = await interaction.reply({ content: 'Searching...', fetchReply: true });

    // Create unique IDs for each button
    const lastResultID = 'searchLastResult' + interaction.id;
    const nextResultID = 'searchNextResult' + interaction.id;
    const searchNextResultFilter = interaction => interaction.customId == nextResultID;
    const searchLastResultFilter = interaction => interaction.customId == lastResultID;
    const searchNextResultCollector = interaction.channel.createMessageComponentCollector({ filter: searchNextResultFilter });
    const searchLastResultCollector = interaction.channel.createMessageComponentCollector({ filter: searchLastResultFilter });
    var lastButtonPress = new Date();
    var hasFinished = false;

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
      strict: "false",
      consider: false
    };
    var player = {
      value: "Steve",
      consider: false
    };

    // Inits some more variables
    var errors = [];
    var args = [];
    var allResults = [];
    var results = [];
    var embeds = [];
    var currentEmbed = 0;
    var scan;

    // Creates interactable buttons
    function createButtons(embeds) {
      var buttons;
    
      if (embeds.length > 1) {
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
        lastButtonPress = new Date();
        // Updates UI when 'Next Page' pressed
        if (currentEmbed + 1 < embeds.length) {
          currentEmbed++;
          if (currentEmbed + 1 == embeds.length) {
            buttons = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId(lastResultID)
                  .setLabel('Last Page')
                  .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                  .setCustomId(nextResultID)
                  .setLabel('Next Page')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(true)
              );
          } else if (currentEmbed == 0) {
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
                  .setStyle(ButtonStyle.Primary)
              );
          } else {
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
          }
          await interaction.update({ content: '', embeds: [embeds[currentEmbed]], components: [buttons] });
        } else {
          await interaction.update({ content: '', embeds: [], components: [] });
        }
      });
    
      // Event listener for 'Last Page' button
      searchLastResultCollector.on('collect', async interaction => {
        lastButtonPress = new Date();
    
        // Updates UI when 'Last Page' pressed
        if (currentEmbed != 0) {
          currentEmbed--;
          if (currentEmbed + 1 == embeds.length) {
            buttons = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId(lastResultID)
                  .setLabel('Last Page')
                  .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                  .setCustomId(nextResultID)
                  .setLabel('Next Page')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(true)
              );
          } else if (currentEmbed == 0) {
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
                  .setStyle(ButtonStyle.Primary)
              );
          } else {
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
          }
    
          await interaction.update({ content: '', embeds: [embeds[currentEmbed]], components: [buttons] });
        } else {
          await interaction.update({ content: '', embeds: [], components: [] });
        }
      });
    
      return buttons;
    }
    
    // Checks if the user passed a value for how many servers to scan
    if (interaction.options.getString("servers") != null) {
      scan = interaction.options.getString("servers");
      
      if (!isNaN(interaction.options.getString("servers"))) {
        scan = Math.abs(parseInt(scan));

        if (interaction.options.getString("servers") > totalServers) {
            scan = totalServers;
        }
      } else {
        scan = totalServers;
      }
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
    if (interaction.options.getBoolean("strictdescription") != null) {
      args.push("strictDescription:" + interaction.options.getBoolean("strictdescription"));
    }
    if (interaction.options.getString("player") != null) {
      args.push("player:" + interaction.options.getString("player"));
    }

    // Handles when no args provided
    if (args.length == 0) {
      errors.push("No arguments specified. Use /help for correct usage.");
    } else {
      for (var i = 0; i < args.length; i++) {
        if (args[0].includes(":")) {
          function isCorrectArgument(argument, value) {
            if (value == "any") {
              return true;
            } else if (argument == 'version') {
              // Checks if the version parameter is the right format

              if (value.split(".").length == 2 || value.split(".").length == 3) {
                var isValidVersion = true;

                for (var i = 0; i < value.split(".").length; i++) {
                  if (isNaN(value.split(".")[i])) {
                    isValidVersion = false;
                  }
                }

                return true // temporarily not using isValidVersion until I make a strictVersion or something like that
              } else {
                return true;
              }
            } else {
              return true;
            }
          }

          var argument = args[i].split(":")[0];
          var value = args[i].split(":")[1];

          // Handles when a value is passed that is not supported
          if (argument != "minOnline" && argument != "maxOnline" && argument != "playerCap" && argument != "isFull" && argument != "version" && argument != "hasImage" && argument != "description" && argument != "strictDescription" && argument != "player") {
            errors.push("invalid argument \"" + argument + "\"");
          } else {
            if (isCorrectArgument(argument, value)) {
              if (value != "any") {
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

                if (argument == "strictDescription") {
                  description.strict = value;
                }

                if (argument == "player") {
                  player.consider = true;
                  player.value = value;
                }
              }
            } else {
              errors.push("invalid value \"" + value + "\" for argument \"" + argument + "\"");
            }
          }
        }
      }
    }

    // Checks for any errors
    if (errors.length > 0) {
      await interactReplyMessage.edit("ERROR: " + errors[0])
    } else {
      var argumentList = "**Searching " + scan + " servers with these arguments:** \n" + "**minOnline:** ";
      if (minOnline.consider) {
        argumentList += minOnline.value;
      } else {
        argumentList += "any";
      }

      argumentList += "\n" + "**maxOnline:** ";
      if (maxOnline.consider) {
        argumentList += maxOnline.value;
      } else {
        argumentList += "any";
      }

      argumentList += "\n" + "**playerCap:** ";
      if (playerCap.consider) {
        argumentList += playerCap.value;
      } else {
        argumentList += "any";
      }

      if (isFull.consider) {
        if (isFull.value == "true") {
          argumentList += "\n" + "**Is Full**";
        } else {
          argumentList += "\n" + "**Isn't Full**"
        }
      }

      argumentList += "\n" + "**version:** "
      if (version.consider) {
        argumentList += version.value;
      } else {
        argumentList += "any";
      }

      if (hasImage.consider) {
        if (hasImage.value == "true") {
          argumentList += "\n" + "**Has Image**";
        } else {
          argumentList += "\n" + "**Doesn't Have Image**"
        }
      }

      argumentList += "\n" + "**description:** "
      if (description.consider) {
        argumentList += description.value;
      } else {
        argumentList += "any";
      }

      if (description.strict == "true") {
        argumentList += " **(strict)**";
      } else {
        argumentList += " **(not strict)**"
      }

      if (player.consider) {
        argumentList += "\n" + "**Player: **" + player.value;
      }

      await interactReplyMessage.edit(argumentList);
    
      if (lastSearchDate == null || timeSinceDate(lastSearchDate) >= refreshSearchTime || scan > lastSearchLength) {
        // Scan for new results

        scanning = true;
        lastSearchDate = new Date();
        lastSearchLength = scan;
        
        function getDescription(response) {
          var description = "";
          if (response.description.extra != null && response.description.extra.length > 0) {
            if (response.description.extra[0].extra == null) {
              for (var i = 0; i < response.description.extra.length; i++) {
                description += response.description.extra[i].text;
              }
            } else {
              for (var i = 0; i < response.description.extra[0].extra.length; i++) {
                description += response.description.extra[0].extra[i].text;
              }
            }
          } else if (response.description.text != null) {
            description = response.description.text;
          } else if (response.description.translate != null) {
            description = response.description.translate;
          } else if ("description: " + response.description != null) {
            description = response.description;
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
            description = 'ㅤ';
          }

          return String(description);
        }

        // Ping all the servers
        function searchForServer(i) {
          MinecraftServerListPing.ping(0, successIPs[i], successPorts[i], pingTimeout)
            .then(response => {
              // Check if the server meets requirements set by the arguments
              var minOnlineRequirement = response.players.online >= minOnline.value || minOnline.consider == false;
              var maxOnlineRequirement = response.players.online <= maxOnline.value || maxOnline.consider == false;
              var playerCapRequirement = response.players.max == playerCap.value || playerCap.consider == false;
              var isFullRequirement = (isFull.value == "false" && response.players.online != response.players.max) || (isFull.value == "true" && response.players.online == response.players.max) || isFull.consider == false;
              var versionRequirement = response.version.name == version.value || (response.version.name + "E").includes(version.value + "E") || version.consider == false;
              var hasImageRequirement = response.favicon != null || hasImage.value == "false" || hasImage.consider == false;
              var descriptionRequirement = (description.consider && description.strict == "false" && getDescription(response).includes(description.value)) || (description.consider && description.strict == "true" && getDescription(response) == description.value) || description.value == "any" || description.consider == false;
              var playerRequirement;

              if (player.consider) {
                playerRequirement = false;

                if (response.players.sample != null) {
                  if (response.players.sample.length >= 1 && response.players.sample[0].name == player.value) {
                    playerRequirement = true;
                  }

                  if (response.players.sample.length >= 2 && response.players.sample[1].name == player.value) {
                    playerRequirement = true;
                  }

                  if (response.players.sample.length >= 3 && response.players.sample[2].name == player.value) {
                    playerRequirement = true;
                  }

                  if (response.players.sample.length >= 4 && response.players.sample[3].name == player.value) {
                    playerRequirement = true;
                  }

                  if (response.players.sample.length >= 5 && response.players.sample[4].name == player.value) {
                    playerRequirement = true;
                  }

                  if (response.players.sample.length >= 6 && response.players.sample[5].name == player.value) {
                    playerRequirement = true;
                  }

                  if (response.players.sample.length >= 7 && response.players.sample[6].name == player.value) {
                    playerRequirement = true;
                  }

                  if (response.players.sample.length >= 8 && response.players.sample[7].name == player.value) {
                    playerRequirement = true;
                  }

                  if (response.players.sample.length >= 9 && response.players.sample[8].name == player.value) {
                    playerRequirement = true;
                  }

                  if (response.players.sample.length >= 10 && response.players.sample[9].name == player.value) {
                    playerRequirement = true;
                  }

                  if (response.players.sample.length >= 11 && response.players.sample[10].name == player.value) {
                    playerRequirement = true;
                  }

                  if (response.players.sample.length >= 12 && response.players.sample[11].name == player.value) {
                    playerRequirement = true;
                  }

                  if (response.players.sample.length >= 13 && response.players.sample[12].name == player.value) {
                    playerRequirement = true;
                  }

                  if (response.players.sample.length >= 14 && response.players.sample[13].name == player.value) {
                    playerRequirement = true;
                  }

                  if (response.players.sample.length >= 15 && response.players.sample[14].name == player.value) {
                    playerRequirement = true;
                  }
                }
              } else {
                playerRequirement = true;
              }

              // Format version in case there's a custom version
              var versionString;

              if (response.version.name.length > 100) {
                versionString = response.version.name.substring(0, 100) + "...";
              } else if (response.version.name == null) {
                versionString = "couldn't get version";
              } else if (response.version.name == "") {
                versionString = "ㅤ";
              } else {
                versionString = response.version.name;
              }

              // Final formatted result to be used in the embed
              var newResult = {
                ip: successIPs[i],
                port: String(successPorts[i]),
                version: versionString,
                description: getDescription(response),
                onlinePlayers: response.players.online,
                maxPlayers: response.players.max,
                playerSample: response.players.sample,
                hasFavicon: (response.favicon != null)
              }

              allResults.push(newResult);

              if (minOnlineRequirement && maxOnlineRequirement && playerCapRequirement && isFullRequirement && versionRequirement && hasImageRequirement && descriptionRequirement && playerRequirement) {
                results.push(newResult);
              }
            })

            .catch(error => {
              // console.log(error); //you probably don't want to log this, it'll just spam timeout errors
            });
        }

        // Scans the servers in big chunks (size set by maxPings)
        if (scan < maxPings) {
          for (var i = 0; i < scan; i++) {
            searchForServer(i, scan);
          }

          setTimeout(function() { sendResults(); }, pingTimeout + 500);
        } else {
          for (var i = 0; i < maxPings; i++) {
            searchForServer(i, maxPings);
          }

          setTimeout(function() { scanChunk(maxPings); }, pingTimeout + 500);
        }

        async function scanChunk(current) {
          scanPercentage = (Math.round((current / scan) * 10000) / 100);
          await interactReplyMessage.edit(argumentList + "\n" + "**" + scanPercentage + "% complete**");
          if (current <= scan) {
            if (scan - current < maxPings) {
              for (var i = 0; i < scan - current; i++) {
                searchForServer(i + current);
              }

              setTimeout(function() { 
                sendResults();
              }, pingTimeout + 500);
            } else {
              for (var i = 0; i < maxPings; i++) {
                searchForServer(i + current);
              }

              setTimeout(function() { scanChunk(current + maxPings); }, pingTimeout + 500);
            }
          }
        }

        // Send final results in embed
        async function sendResults() {
          await interactReplyMessage.edit(argumentList + "\n" + "**Loading results, please wait...**");

          // Easter eggs cuz I was bored
          if (scan == 0) {
            var newEmbed = new EmbedBuilder()
              .setColor("#02a337")
              .setTitle('Search Results')
              .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */ })
              .addFields(
                { name: 'Result ' + '0/0', value: 'ㅤ' },
                { name: 'ip', value: "0.0.0.0" },
                { name: 'port', value: "0" },
                { name: 'version', value: "0.00.0" },
                { name: 'description', value: "Bro actually just scanned 0 servers🤦‍♂️" },
                { name: 'players', value: '0/0' }
              )
              .setTimestamp()

            embeds.push(newEmbed);
          } else if (interaction.options.getString("servers") < 0) {
            var newEmbed = new EmbedBuilder()
              .setColor("#02a337")
              .setTitle('Search Results')
              .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */ })
              .addFields(
                { name: 'Result ' + '-0/', value: 'ㅤ' },
                { name: 'ip', value: "?.?.?.?" },
                { name: 'port', value: "25565" },
                { name: 'version', value: "ඞ" },
                { name: 'description', value: "omg it's the secret negative seerver!!!1!1!!11!" },
                { name: 'players', value: "∞" + '/' + "-1" }
              )
              .setTimestamp()

            embeds.push(newEmbed);
          }
          
          lastSearchResults = allResults;
          allResults = [];

          // If at least one server was found, send the embed
          if (results.length > 0 || scan <= 0) {
            for (var i = 0; i < results.length; i++) {
              var newEmbed = new EmbedBuilder()
                .setColor("#02a337")
                .setTitle('Search Results')
                .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */ })
                .setThumbnail("https://api.mcstatus.io/v2/icon/" + results[i].ip)
                .addFields(
                  { name: 'Result ' + (i + 1) + '/' + results.length, value: 'ㅤ' },
                  { name: 'ip', value: results[i].ip },
                  { name: 'port', value: results[i].port },
                  { name: 'version', value: results[i].version },
                  { name: 'description', value: results[i].description },
                  { name: 'players', value: results[i].onlinePlayers + '/' + results[i].maxPlayers }
                )
                .setTimestamp()

              embeds.push(newEmbed);
            }

            results = []; // results are no longer needed
            var buttons = createButtons(embeds);

            await interactReplyMessage.edit({ content: '', embeds: [embeds[0]], components: [buttons] });
          } else {
            await interactReplyMessage.edit("no matches could be found");
          }
          lastButtonPress = new Date();
          scanning = false;
          hasFinished = true;
        }
      }
      else {
        while (scanning) {
          // if another scan is running, show it's progress until it finishes

          await interactReplyMessage.edit(argumentList + "\n" + "**" + scanPercentage + "% complete**");
        }

        // Use existing results (saved from previous search)

        var filteredResults = [];

        for (var i = 0; i < lastSearchResults.length; i++) {
          // Check if the server meets the requirements set by the arguments
          var minOnlineRequirement = lastSearchResults[i].onlinePlayers >= minOnline.value || minOnline.consider == false;
          var maxOnlineRequirement = lastSearchResults[i].onlinePlayers <= maxOnline.value || maxOnline.consider == false;
          var playerCapRequirement = lastSearchResults[i].maxPlayers == playerCap.value || playerCap.consider == false;
          var isFullRequirement = (isFull.value == "false" && lastSearchResults[i].onlinePlayers != lastSearchResults[i].maxPlayers) || (isFull.value == "true" && lastSearchResults[i].onlinePlayers == lastSearchResults[i].maxPlayers) || isFull.consider == false;
          var versionRequirement = lastSearchResults[i].version == version.value || (lastSearchResults[i].version + "E").includes(version.value + "E") || version.consider == false;
          var hasImageRequirement = lastSearchResults[i].hasFavicon || hasImage.value == "false" || hasImage.consider == false;
          var descriptionRequirement = (description.consider && description.strict == "false" && lastSearchResults[i].description.includes(description.value)) || (description.consider && description.strict == "true" && lastSearchResults[i].description == description.value) || description.value == "any" || description.consider == false;
          var playerRequirement;
    
          if (player.consider) {
            playerRequirement = false;
    
            if (lastSearchResults[i].playerSample != null) {
              if (lastSearchResults[i].playerSample.length >= 1 && lastSearchResults[i].playerSample[0].name == player.value) {
                playerRequirement = true;
              }
    
              if (lastSearchResults[i].playerSample.length >= 2 && lastSearchResults[i].playerSample[1].name == player.value) {
                playerRequirement = true;
              }
    
              if (lastSearchResults[i].playerSample.length >= 3 && lastSearchResults[i].playerSample[2].name == player.value) {
                playerRequirement = true;
              }
    
              if (lastSearchResults[i].playerSample.length >= 4 && lastSearchResults[i].playerSample[3].name == player.value) {
                playerRequirement = true;
              }
    
              if (lastSearchResults[i].playerSample.length >= 5 && lastSearchResults[i].playerSample[4].name == player.value) {
                playerRequirement = true;
              }
    
              if (lastSearchResults[i].playerSample.length >= 6 && lastSearchResults[i].playerSample[5].name == player.value) {
                playerRequirement = true;
              }
    
              if (lastSearchResults[i].playerSample.length >= 7 && lastSearchResults[i].playerSample[6].name == player.value) {
                playerRequirement = true;
              }
    
              if (lastSearchResults[i].playerSample.length >= 8 && lastSearchResults[i].playerSample[7].name == player.value) {
                playerRequirement = true;
              }
    
              if (lastSearchResults[i].playerSample.length >= 9 && lastSearchResults[i].playerSample[8].name == player.value) {
                playerRequirement = true;
              }
    
              if (lastSearchResults[i].playerSample.length >= 10 && lastSearchResults[i].playerSample[9].name == player.value) {
                playerRequirement = true;
              }
    
              if (lastSearchResults[i].playerSample.length >= 11 && lastSearchResults[i].playerSample[10].name == player.value) {
                playerRequirement = true;
              }
    
              if (lastSearchResults[i].playerSample.length >= 12 && lastSearchResults[i].playerSample[11].name == player.value) {
                playerRequirement = true;
              }
    
              if (lastSearchResults[i].playerSample.length >= 13 && lastSearchResults[i].playerSample[12].name == player.value) {
                playerRequirement = true;
              }
    
              if (lastSearchResults[i].playerSample.length >= 14 && lastSearchResults[i].playerSample[13].name == player.value) {
                playerRequirement = true;
              }
    
              if (lastSearchResults[i].playerSample.length >= 15 && lastSearchResults[i].playerSample[14].name == player.value) {
                playerRequirement = true;
              }
            }
          } else {
            playerRequirement = true;
          }

          if (minOnlineRequirement && maxOnlineRequirement && playerCapRequirement && isFullRequirement && versionRequirement && hasImageRequirement && descriptionRequirement && playerRequirement) {
            filteredResults.push(lastSearchResults[i]);
          }
        }

        // Easter eggs
        if (scan == 0) {
          var newEmbed = new EmbedBuilder()
            .setColor("#02a337")
            .setTitle('Search Results')
            .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */ })
            .addFields(
              { name: 'Result ' + '0/0', value: 'ㅤ' },
              { name: 'ip', value: "0.0.0.0" },
              { name: 'port', value: "0" },
              { name: 'version', value: "0.00.0" },
              { name: 'description', value: "Bro actually just scanned 0 servers🤦‍♂️" },
              { name: 'players', value: '0/0' }
            )
            .setTimestamp()

          embeds.push(newEmbed);
        } else if (interaction.options.getString("servers") < 0) {
          var newEmbed = new EmbedBuilder()
            .setColor("#02a337")
            .setTitle('Search Results')
            .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */ })
            .addFields(
              { name: 'Result ' + '-0/', value: 'ㅤ' },
              { name: 'ip', value: "?.?.?.?" },
              { name: 'port', value: "25565" },
              { name: 'version', value: "ඞ" },
              { name: 'description', value: "omg it's the secret negative seerver!!!1!1!!11!" },
              { name: 'players', value: "∞" + '/' + "-1" }
            )
            .setTimestamp()

          embeds.push(newEmbed);
        }

        // Convert the results into Discord embeds to be sent as the message
        for (var i = 0; i < filteredResults.length; i++) {
          var newEmbed = new EmbedBuilder()
            .setColor("#02a337")
            .setTitle('Search Results')
            .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
            .setThumbnail("https://api.mcstatus.io/v2/icon/" + filteredResults[i].ip)
            .addFields(
              { name: 'Result ' + (i + 1) + '/' + filteredResults.length, value: 'ㅤ' },
              { name: 'ip', value: filteredResults[i].ip },
              { name: 'port', value: filteredResults[i].port },
              { name: 'version', value: filteredResults[i].version },
              { name: 'description', value: filteredResults[i].description },
              { name: 'players', value: filteredResults[i].onlinePlayers + '/' + filteredResults[i].maxPlayers }
            )
            .setTimestamp()

          embeds.push(newEmbed);
        }

        filteredResults = []; // filtered results are no longer needed

        // If at least one server was found, send the message
        if (embeds.length > 0) {
          var buttons = createButtons(embeds);
          await interactReplyMessage.edit({ content: '', embeds: [embeds[0]], components: [buttons] });
        } else {
          await interactReplyMessage.edit("no matches could be found");
        }
        lastButtonPress = new Date();
        hasFinished = true;
      }

      // Times out the buttons after a few seconds of inactivity (set in buttonTimeout variable)
      async function buttonTimeoutCheck() {
        if (timeSinceDate(lastButtonPress) >= buttonTimeout && hasFinished && embeds.length > 0) {
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

          embeds = []; // embeds are no longer needed
        } else {
          setTimeout(function() { buttonTimeoutCheck() }, 500);
        }
      }
      buttonTimeoutCheck();
    }
  },
};
