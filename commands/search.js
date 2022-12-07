const wait = require('node:timers/promises').setTimeout;
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteractionOptionResolver } = require('discord.js');
const { MinecraftServerListPing } = require("minecraft-status");
const { successIPs, successPorts } = require("../serverList.json");
var { totalServers } = require("../serverList.json");
var activeSearch = false;
var wrappingUpSearch = false;
const buttonTimeout = 30000;
const { maxPings, pingTimeout } = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Searches for a server with specific properties")
    .addIntegerOption(option =>
      option
        .setName("scan")
        .setDescription("The amount of servers to scan")
        .setRequired(true))
      .addStringOption(option =>
      option
        .setName("minonline")
        .setDescription("The minimum number of online players"))
    .addStringOption(option =>
      option
        .setName("maxonline")
        .setDescription("The maximum number of online players"))
    .addStringOption(option =>
      option
        .setName("playercap")
        .setDescription("The server's maximum player capacity"))
    .addStringOption(option =>
      option
        .setName("isfull")
        .setDescription("whether or not the server is full"))
    .addStringOption(option =>
      option
        .setName("version")
        .setDescription("The version of the server"))
    .addStringOption(option =>
      option
        .setName("hasimage")
        .setDescription("Whether or not the server has a custom image"))
    .addStringOption(option =>
      option
        .setName("description")
        .setDescription("The description of the server"))
    .addStringOption(option =>
      option
        .setName("strictdescription")
        .setDescription("Whether or not the description has to be an exact match"))
    .addStringOption(option =>
      option
        .setName("player")
        .setDescription("The name of a player to search for")),
  async execute(interaction) {
    await interaction.reply("Searching...");

    if (!activeSearch && !wrappingUpSearch) {
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

      var errors = [];
      var searchFound = false;
      var args = [];
      var results = [];
      var embeds = [];
      var currentEmbed = 0;
      const lastResultID = 'searchLastResult' + interaction.id;
      const nextResultID = 'searchNextResult' + interaction.id;
      const searchNextResultFilter = interaction => interaction.customId == nextResultID;
      const searchLastResultFilter = interaction => interaction.customId == lastResultID;
      const searchNextResultCollector = interaction.channel.createMessageComponentCollector({ filter: searchNextResultFilter });
      const searchLastResultCollector = interaction.channel.createMessageComponentCollector({ filter: searchLastResultFilter });

      if (interaction.options.getInteger("scan") != null) {
         if (interaction.options.getInteger("scan") < 0) {
          totalServers = interaction.options.getInteger("scan") * -1;
        } else if (interaction.options.getInteger("scan") < totalServers) {
        	totalServers = interaction.options.getInteger("scan");
        }
      }
      if (interaction.options.getString("minonline") != null) {
        args.push("minOnline:" + interaction.options.getString("minonline"));
      }
      if (interaction.options.getString("maxonline") != null) {
        args.push("maxOnline:" + interaction.options.getString("maxonline"));
      }
      if (interaction.options.getString("playercap") != null) {
        args.push("playerCap:" + interaction.options.getString("playercap"));
      }
      if (interaction.options.getString("isfull") != null) {
        args.push("isFull:" + interaction.options.getString("isfull"));
      }
      if (interaction.options.getString("version") != null) {
        args.push("version:" + interaction.options.getString("version"));
      }
      if (interaction.options.getString("hasimage") != null) {
        args.push("hasImage:" + interaction.options.getString("hasimage"));
      }
      if (interaction.options.getString("description") != null) {
        args.push("description:" + interaction.options.getString("description"));
      }
      if (interaction.options.getString("strictdescription") != null) {
        args.push("strictDescription:" + interaction.options.getString("strictdescription"));
      }
      if (interaction.options.getString("player") != null) {
        args.push("player:" + interaction.options.getString("player"));
      }

      if (args.length == 0) {
        errors.push("No arguments specified. Use /help for correct usage.");
      }
      else {
        for (var i = 0; i < args.length; i++) {
          if (args[0].includes(":")) {
            function isCorrectArgument(argument, value) {
              if (argument == "description" || argument == "player") {
                return true;
              }

              if (isNaN(value) || argument == "version") {
                //value isn't a number
                if (value == "any") {
                  return true;
                }
                else if (value == "true" || value == "false") {
                  if (argument == "isFull" || argument == "hasImage" || argument == "strictDescription") {
                    return true;
                  } else {
                    return false;
                  }
                }
                else if (value.includes(".")) {
                  if (argument == "version") {
                    if (value.split(".").length == 2 || value.split(".").length == 3) {
                      var isValidVersion = true;
                      for (var i = 0; i < value.split(".").length; i++) {
                        if (isNaN(value.split(".")[i])) {
                          isValidVersion = false;
                        }
                      }

                      if (isValidVersion) {
                        return true
                      } else {
                        return false;
                      }
                    } else {
                      return false;
                    }
                  }
                  else {
                    return false;
                  }
                }
                else {
                  errors.push("Invalid value \"" + value + "\"");
                  return false;
                }
              }
              else {
                //value is a number
                if (Number.isInteger(parseFloat(value))) {
                  value = parseInt(value);
                  if (value >= 0 && (argument == "minOnline" || argument == "maxOnline" || argument == "playerCap")) {
                    return true;
                  } else {
                    return false
                  }
                }
                else {
                  return false;
                }
              }
            }

            var argument = args[i].split(":")[0];
            var value = args[i].split(":")[1];

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

      if (errors.length > 0) {
        interaction.editReply("ERROR: " + errors[0])
      } else {
        var argumentList = "**Searching with these arguments:** \n" + "**minOnline:** ";
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

        interaction.editReply(argumentList);

        function getDescription(response) {
          var description = "";
          if (response.description.extra != null) {
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

          if (description == '') {
            description = 'ㅤ';
          }

          if (description.length > 150) {
            description = description.substring(0, 150) + "...";
          }

          return String(description);
        }

        function searchForServer(i) {

          MinecraftServerListPing.ping(0, successIPs[i], successPorts[i], pingTimeout)
            .then(response => {
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

              if (minOnlineRequirement && maxOnlineRequirement && playerCapRequirement && isFullRequirement && versionRequirement && hasImageRequirement && descriptionRequirement && playerRequirement) {
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


                var newResult = {
                  ip: successIPs[i],
                  port: String(successPorts[i]),
                  version: versionString,
                  description: getDescription(response),
                  onlinePlayers: response.players.online,
                  maxPlayers: response.players.max,
                }

                results.push(newResult);

                searchFound = true;
              }
            })

            .catch(error => {

            });
        }

        activeSearch = true;

        if (totalServers < maxPings) {
          for (var i = 0; i < totalServers; i++) {
            searchForServer(i, totalServers);
          }
        } else {
          for (var i = 0; i < maxPings; i++) {
            searchForServer(i, maxPings);
          }

          setTimeout(function() { scanChunk(maxPings); }, 3500);
        }

        function scanChunk(current) {
          interaction.editReply(argumentList + "\n" + "**" + (Math.round((current / totalServers) * 10000) / 100) + "% complete**");
          if (current < totalServers) {
            if (totalServers - current < maxPings) {
              for (var i = 0; i < totalServers - current; i++) {
                searchForServer(i + current);
              }
            } else {
              for (var i = 0; i < maxPings; i++) {
                searchForServer(i + current);
              }

              setTimeout(function() { scanChunk(current + maxPings); }, 3500);
            }
          }
        }

        setTimeout(function() {
          wrappingUpSearch = true;
          activeSearch = false;

          if (interaction.options.getInteger("scan") == 0) {
            var newEmbed = new EmbedBuilder()
              .setColor("#02a337")
              .setTitle('Search Results')
              .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */ })
              .addFields(
                  { name: 'Result ' + '0/0' , value: 'ㅤ' },
                  { name: 'ip', value: "0.0.0.0" },
                  { name: 'port', value: "0" },
                  { name: 'version', value: "0.00.0" },
                  { name: 'description', value: "Bro actually just scanned 0 servers🤦‍♂️" },
                  { name: 'players', value: '0/0' }
              )
              .setTimestamp()
  
            embeds.push(newEmbed);
            searchFound = true
          } else if (interaction.options.getInteger("scan") < 0) {
            var newEmbed = new EmbedBuilder()
              .setColor("#02a337")
              .setTitle('Search Results')
              .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */ })
              .addFields(
                  { name: 'Result ' + '-0/' , value: 'ㅤ' },
                  { name: 'ip', value: "?.?.?.?" },
                  { name: 'port', value: "25565" },
                  { name: 'version', value: "ඞ" },
                  { name: 'description', value: "omg it's the secret negative seerver!!!1!1!!11!" },
                  { name: 'players', value: "∞" + '/' + "-1" }
              )
              .setTimestamp()
  
            embeds.push(newEmbed);
            searchFound = true;
          }

          interaction.editReply(argumentList + "\n" + "**Loading results, please wait...**");

          if (searchFound) {
            var lastButtonPress = new Date();
            for (var i = 0; i < results.length; i++) {
              var newEmbed = new EmbedBuilder()
              .setColor("#02a337")
              .setTitle('Search Results')
              .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */ })
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

            searchNextResultCollector.on('collect', async interaction => {
              lastButtonPress = new Date();

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

            searchLastResultCollector.on('collect', async interaction => {
              lastButtonPress = new Date();

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

            interaction.editReply({ content: '', embeds: [embeds[0]], components: [buttons] });
          }

          function timeSinceDate(date1) {
            if (date1 == null) {
              date1 = new Date();
            }
            var date2 = new Date();
            var date1Total = date1.getSeconds() + date1.getMinutes() * 60 + date1.getHours() * 3600 + date1.getDay() * 86400;
            var date2Total = date2.getSeconds() + date2.getMinutes() * 60 + date2.getHours() * 3600 + date2.getDay() * 86400;

            return date2Total - date1Total;
          }

          function buttonTimeoutCheck() {
            if (timeSinceDate(lastButtonPress) >= (buttonTimeout / 1000) - 1) {
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
              interaction.editReply({ components: [buttons] });

              searchNextResultCollector.stop();
              searchLastResultCollector.stop();
            } else {
              setTimeout(function() { buttonTimeoutCheck() }, 500);
            }
          }

          buttonTimeoutCheck();

        }, (pingTimeout * Math.ceil(totalServers / maxPings)) + 500)

        setTimeout(function() {
          if (!searchFound) {
            interaction.editReply("no matches could be found");
          }

          wrappingUpSearch = false;
          activeSearch = false;
        }, (pingTimeout * Math.ceil(totalServers / maxPings)) + 1500)
      }
    } else {
      if (wrappingUpSearch) {
        interaction.editReply("Wrapping up a previous search, please try again in a bit");
      } else {
        interaction.editReply("Another search is currently running, try again in a few seconds")
      }
    }
  },
};