const wait = require('node:timers/promises').setTimeout;
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { MinecraftServerListPing } = require("minecraft-status");
const { totalServers, successIPs, successPorts } = require("../newServerList.json");
var activeSearch = false;
var wrappingUpSearch = false;

module.exports = {
	data: new SlashCommandBuilder()
		.setName("search")
		.setDescription("Searches for a server with specific properties")
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
				.setName("isfull")
				.setDescription("whether or not the server is full"))
    .addStringOption(option =>
			option
				.setName("version")
				.setDescription("The version of the server")),
	async execute(interaction) {
    await interaction.reply("Searching...");
    
    if(!activeSearch && !wrappingUpSearch) {
      var minOnline = {
        value: 0,
        consider: false
      };
      var maxOnline = {
        value: 0,
        consider: false
      };
      var isFull = {
        value: false,
        consider: false
      };
      var version = {
        value: "1.19.2",
        consider: false
      };
      var errors = [];
      var searchFound = false;
      var args = [];
      var results = [];
      var embeds = [];

      if (interaction.options.getString("minonline") != null) {
        args.push("minOnline:" + interaction.options.getString("minonline"));
      }
      if (interaction.options.getString("maxonline") != null) {
        args.push("maxOnline:" + interaction.options.getString("maxonline"));
      }
      if (interaction.options.getString("isfull") != null) {
        args.push("isFull:" + interaction.options.getString("isfull"));
      }
      if (interaction.options.getString("version") != null) {
        args.push("version:" + interaction.options.getString("version"));
      }
      
      if (args.length == 0) {
        errors.push("No arguments specified. Use /help for correct usage.");
      } 
      else {
        for (var i = 0; i < args.length; i++) {
          if(args[0].includes(":")) {
            function isCorrectArgument(argument, value) {
              if (isNaN(value) || argument == "version") {
                //value isn't a number
                if (value == "any") {
                  return true;
                }
                else if (value == "true" || value == "false") {
                  if (argument == "isFull") {
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
                  if (value >= 0 && (argument == "minOnline" || argument == "maxOnline")) {
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
  
            if (argument != "minOnline" && argument != "maxOnline" && argument != "isFull" && argument != "version") {
               errors.push("invalid argument \"" + argument + "\"");
            } else {
              if (isCorrectArgument(argument, value)) {
                if (value != "any")
                {
                  if(argument == "minOnline") {
                    minOnline.consider = true;
                    minOnline.value = value;
                  }
                  
                  if(argument == "maxOnline") {
                    maxOnline.consider = true;
                    maxOnline.value = value;
                  }
                  
                  if(argument == "isFull") {
                    isFull.consider = true;
                    isFull.value = value;
                  }
                  
                  if(argument == "version") {
                    version.consider = true;
                    version.value = value;
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

        if (isFull.consider) {
          if(isFull.value == "true") {
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

        interaction.editReply(argumentList);

        function getDescription(response) {
          var description = "";
          if (response.description.extra != null) {
            for (var i = 0; i < response.description.extra.length; i++) {
              description += response.description.extra[i].text;
            }
          } else if (response.description.text != null) {
            description = response.description.text;
          } else if ("description: " + response.description != null) {
            description = response.description;
          } else {
            description = "Couldn't get description";
          }

          return description;
        }
        
        function searchForServer(i, max) {
          MinecraftServerListPing.ping(0, successIPs[i], successPorts[i], 3000)
          .then(response => {var minOnlineRequirement = response.players.online >= minOnline.value || minOnline.consider == false;
            var maxOnlineRequirement = response.players.online <= maxOnline.value || maxOnline.consider == false;
            var isFullRequirement = (isFull.value == "false" && response.players.online != response.players.max) || (isFull.value == "true" && response.players.online == response.players.max) || isFull.consider == false;
            var versionRequirement = response.version.name == version.value || (response.version.name + "E").includes(version.value + "E") || version.consider == false;
  
            if (minOnlineRequirement && maxOnlineRequirement && isFullRequirement && versionRequirement && !searchFound) {
              results.push({
                ip: successIPs[i],
                port: successPorts[i],
                version: response.version.name,
                description: getDescription(response),
                onlinePlayers: response.players.online,
                maxPlayers: response.players.max
              });

              var newEmbed = new EmbedBuilder()
  	            .setColor("#02a337")
              	.setTitle('Search Results')
              	.setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */})
                .addFields(
                  //{ name: 'Result ' + (i + 1) + '/' + results.length, value: 'ㅤ' },
                  { name: 'ip', value: successIPs[i], inline: true },
                  { name: 'port', value: String(successPorts[i]), inline: true },
                  { name: 'version', value: response.version.name, inline: true },
                  { name: 'description', value: getDescription(response), inline: true },
                  { name: 'players', value: response.players.online + '/' + response.players.max, inline: true }
                )
              	.setTimestamp()

              embeds.push(newEmbed);
              searchFound = true;
              interaction.editReply({ content:'', embeds:[embeds[0]] });
            } else {
              
            }
          })
            
          .catch(error => {
            //console.log(error);
          });
        }

        activeSearch = true;
        
        for (var i = 0; i < totalServers; i++) {
          searchForServer(i);
        }

        setTimeout(function() {
          wrappingUpSearch = true;
          activeSearch = false;
        }, 3000)
  
        setTimeout(function() {
          if (!searchFound) {
            interaction.editReply("no matches could be found");
          }

          activeSearch = false;
          wrappingUpSearch = false;
        }, 7000)
      }
    } else {
      if(wrappingUpSearch) {
        interaction.editReply("Wrapping up a previous search, please try again in a bit");
      } else {
        interaction.editReply("Another search is currently running, try again in a few seconds")
      }
    }
	},
};