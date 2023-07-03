// Fectches dependencies and inits variables
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, getVersion } = require('../commonFunctions.js');
const countryCodes = require('../countryCodes.json');
const buttonTimeout = 60; // In seconds
const maxmind = require('maxmind');
var cityLookup;
var asnLookup;
(async () => {
  cityLookup = await maxmind.open('./GeoLite2-City.mmdb');
  asnLookup = await maxmind.open('./GeoLite2-ASN.mmdb');
})();

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
    .addBooleanOption(option =>
      option
        .setName("hasplayerlist")
        .setDescription("Whether or not the server has player list enabled"))
    .addIntegerOption(option =>
      option
        .setName("seenafter")
        .setDescription("The oldest time a sever can be last seen (this doesn't mean it's offline, use /help for more info)"))
    .addStringOption(option =>
      option
        .setName("iprange")
        .setDescription("The ip subnet a server's ip has to be within"))
    .addStringOption(option =>
      option
        .setName("country")
        .setDescription("The country the server is hosted in")
        .setAutocomplete(true)),
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const filtered = countryCodes.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase())).splice(0, 25);
    await interaction.respond(
      filtered.map(choice => ({ name: choice.name, value: choice.code })),
    );
  },
  async execute(interaction) {
    // Import Mongo Client
    const { scannedServersDB } = require('../index.js');

    // Status message
    const interactReplyMessage = await interaction.reply({ content: 'Searching...', fetchReply: true });

    // Create unique IDs for each button
    const lastResultID = 'lastResult' + interaction.id;
    const nextResultID = 'nextResult' + interaction.id;
    const oldPlayersID = 'oldPlayers' + interaction.id;
    const searchNextResultFilter = interaction => interaction.customId == nextResultID;
    const searchLastResultFilter = interaction => interaction.customId == lastResultID;
    const oldPlayersFilter = interaction => interaction.customId == oldPlayersID;
    const searchNextResultCollector = interaction.channel.createMessageComponentCollector({ filter: searchNextResultFilter });
    const searchLastResultCollector = interaction.channel.createMessageComponentCollector({ filter: searchLastResultFilter });
    const oldPlayersCollector = interaction.channel.createMessageComponentCollector({ filter: oldPlayersFilter });
    var lastButtonPress = null;
    const mongoFilter = {};

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
      value: '1.19.2',
      consider: false
    };
    var hasImage = {
      value: 'false',
      consider: false
    };
    var description = {
      value: 'false',
      consider: false
    };
    var player = {
      value: 'Steve',
      consider: false
    };
    var hasPlayerList = {
      value: 'Steve',
      consider: false
    };
    var seenAfter = {
      value: 0,
      consider: false
    }
    var ipRange = {
      value: '',
      consider: false
    }
    var country = {
      value: '',
      consider: false
    }

    // Creates interactable buttons
    var currentEmbed = 0;
    function createButtons(totalResults) {
      var buttons;
    
      if (totalResults > 1) {
        buttons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(lastResultID)
              .setLabel('Last Page')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(nextResultID)
              .setLabel('Next Page')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(oldPlayersID)
              .setLabel('Show Old Players')
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
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId(oldPlayersID)
              .setLabel('Show Old Players')
              .setStyle(ButtonStyle.Primary)
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
        if (currentEmbed == totalResults) currentEmbed = 0;

        const server = (await (await scannedServersDB.find(mongoFilter).skip(currentEmbed).limit(1)).toArray())[0];

        // Updates UI when 'Next Page' pressed
        newEmbed = new EmbedBuilder()
          .setColor("#02a337")
          .setTitle('Search Results')
          .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
          .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${server.ip}&port=${server.port}`)
          .addFields(
            { name: 'Result ' + (currentEmbed + 1) + '/' + totalResults, value: '​' },
            { name: 'IP', value: server.ip },
            { name: 'Port', value: (server.port + '') },
            { name: 'Version', value: getVersion(server.version) + ` (${server.version.protocol})` },
            { name: 'Description', value: getDescription(server.description) }
          )
          .setTimestamp();

        var playersString = `${server.players.online}/${server.players.max}`;
        if (server.players.sample != null) {
          var oldString;
          for (var i = 0; i < server.players.sample.length; i++) {
            if (server.players.sample[i].lastSeen == server.lastSeen) {
              oldString = playersString;
              playersString += `\n${server.players.sample[i].name}\n${server.players.sample[i].id}`;
              if (i + 1 < server.players.sample.length) playersString += '\n';
              if (playersString.length > 1024) {
                playersString = oldString;
                break;
              }
            }
          }
        }

        newEmbed.addFields(
          { name: 'Players', value: playersString },
          { name: 'Last Seen', value: `<t:${server.lastSeen}:f>` }
        )

        await interactionUpdate.edit({ content: '', embeds: [newEmbed], components: [buttons] });

        var location = await cityLookup.get(server.ip);
        if (location == null) {
          newEmbed.addFields({ name: 'Country: ', value: `Unknown` })
        } else {
          if (location.country != null) {
            newEmbed.addFields({ name: 'Country: ', value: `:flag_${location.country.iso_code.toLowerCase()}: ${location.country.names.en}` })
          } else {
            newEmbed.addFields({ name: 'Country: ', value: `:flag_${location.registered_country.iso_code.toLowerCase()}: ${location.registered_country.names.en}` })
          }
        }
        var org = await asnLookup.get(server.ip);
        if (org == null) {
          newEmbed.addFields({ name: 'Organization: ', value: 'Unknown' });
        } else {
          newEmbed.addFields({ name: 'Organization: ', value: org.autonomous_system_organization });
        }

        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });

        const auth = await (await fetch(`https://ping.cornbread2100.com/cracked/?ip=${server.ip}&port=${server.port}`)).text();
        if (auth == 'true') {
          newEmbed.addFields(
            { name: 'Auth', value: 'Cracked' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        } else if (auth == 'false') {
          newEmbed.addFields(
            { name: 'Auth', value: 'Premium' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        } else {
          newEmbed.addFields(
            { name: 'Auth', value: 'Unknown' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        }
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
        if (currentEmbed == -1) currentEmbed = totalResults - 1;

        const server = (await (await scannedServersDB.find(mongoFilter).skip(currentEmbed).limit(1)).toArray())[0];
    
        // Updates UI when 'Last Page' pressed
        var newEmbed = new EmbedBuilder()
          .setColor("#02a337")
          .setTitle('Search Results')
          .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
          .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${server.ip}&port=${server.port}`)
          .addFields(
            { name: 'Result ' + (currentEmbed + 1) + '/' + totalResults, value: '​' },
            { name: 'IP', value: server.ip },
            { name: 'Port', value: (server.port + '') },
            { name: 'Version', value: getVersion(server.version) + ` (${server.version.protocol})` },
            { name: 'Description', value: getDescription(server.description) }
          )
          .setTimestamp();

        var playersString = `${server.players.online}/${server.players.max}`;
        if (server.players.sample != null) {
          var oldString;
          for (var i = 0; i < server.players.sample.length; i++) {
            if (server.players.sample[i].lastSeen == server.lastSeen) {
              oldString = playersString;
              playersString += `\n${server.players.sample[i].name}\n${server.players.sample[i].id}`;
              if (i + 1 < server.players.sample.length) playersString += '\n';
              if (playersString.length > 1024) {
                playersString = oldString;
                break;
              }
            }
          }
        }

        newEmbed.addFields(
          { name: 'Players', value: playersString },
          { name: 'Last Seen', value: `<t:${server.lastSeen}:f>` }
        )
  
        await interactionUpdate.edit({ content: '', embeds: [newEmbed], components: [buttons] });

        var location = await cityLookup.get(server.ip);
        if (location == null) {
          newEmbed.addFields({ name: 'Country: ', value: `Unknown` })
        } else {
          if (location.country != null) {
            newEmbed.addFields({ name: 'Country: ', value: `:flag_${location.country.iso_code.toLowerCase()}: ${location.country.names.en}` })
          } else {
            newEmbed.addFields({ name: 'Country: ', value: `:flag_${location.registered_country.iso_code.toLowerCase()}: ${location.registered_country.names.en}` })
          }
        }
        var org = await asnLookup.get(server.ip);
        if (org == null) {
          newEmbed.addFields({ name: 'Organization: ', value: 'Unknown' });
        } else {
          newEmbed.addFields({ name: 'Organization: ', value: org.autonomous_system_organization });
        }

        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });

        const auth = await (await fetch(`https://ping.cornbread2100.com/cracked/?ip=${server.ip}&port=${server.port}`)).text();
        if (auth == 'true') {
          newEmbed.addFields(
            { name: 'Auth', value: 'Cracked' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        } else if (auth == 'false') {
          newEmbed.addFields(
            { name: 'Auth', value: 'Premium' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        } else {
          newEmbed.addFields(
            { name: 'Auth', value: 'Unknown' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        }
      });

      oldPlayersCollector.on('collect', async interaction => {
        if (totalResults > 1) {
          buttons = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId(lastResultID)
                .setLabel('Last Page')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(nextResultID)
                .setLabel('Next Page')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(oldPlayersID)
                .setLabel('Show Old Players')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
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
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId(oldPlayersID)
                .setLabel('Show Old Players')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
            );
        }
        
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

        const server = (await (await scannedServersDB.find(mongoFilter).skip(currentEmbed).limit(1)).toArray())[0];
        // Updates UI when 'Last Page' pressed
        var newEmbed = new EmbedBuilder()
          .setColor("#02a337")
          .setTitle('Search Results')
          .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
          .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${server.ip}&port=${server.port}`)
          .addFields(
            { name: 'Result ' + (currentEmbed + 1) + '/' + totalResults, value: '​' },
            { name: 'IP', value: server.ip },
            { name: 'Port', value: (server.port + '') },
            { name: 'Version', value: getVersion(server.version) + ` (${server.version.protocol})` },
            { name: 'Description', value: getDescription(server.description) }
          )
          .setTimestamp();

        var playersString = `${server.players.online}/${server.players.max}`;
        if (server.players.sample != null) {
          var oldString;
          for (var i = 0; i < server.players.sample.length; i++) {
            oldString = playersString;
            playersString += `\n${server.players.sample[i].name} ${server.players.sample[i].lastSeen == server.lastSeen ? '`online`' : '<t:' + server.players.sample[i].lastSeen + ':R>'}`;
            if (i + 1 < server.players.sample.length) playersString += '\n';
            if (playersString.length > 1020 && i + 1 < server.players.sample.length || playersString.length > 1024) {
              playersString = oldString + '\n...';
              break;
            }
          }
        }

        newEmbed.addFields(
          { name: 'Players', value: playersString },
          { name: 'Last Seen', value: `<t:${server.lastSeen}:f>` }
        )
  
        await interactionUpdate.edit({ content: '', embeds: [newEmbed], components: [buttons] });

        var location = await cityLookup.get(server.ip);
        if (location == null) {
          newEmbed.addFields({ name: 'Country: ', value: `Unknown` })
        } else {
          if (location.country != null) {
            newEmbed.addFields({ name: 'Country: ', value: `:flag_${location.country.iso_code.toLowerCase()}: ${location.country.names.en}` })
          } else {
            newEmbed.addFields({ name: 'Country: ', value: `:flag_${location.registered_country.iso_code.toLowerCase()}: ${location.registered_country.names.en}` })
          }
        }
        var org = await asnLookup.get(server.ip);
        if (org == null) {
          newEmbed.addFields({ name: 'Organization: ', value: 'Unknown' });
        } else {
          newEmbed.addFields({ name: 'Organization: ', value: org.autonomous_system_organization });
        }

        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });

        const auth = await (await fetch(`https://ping.cornbread2100.com/cracked/?ip=${server.ip}&port=${server.port}`)).text();
        if (auth == 'true') {
          newEmbed.addFields(
            { name: 'Auth', value: 'Cracked' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        } else if (auth == 'false') {
          newEmbed.addFields(
            { name: 'Auth', value: 'Premium' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        } else {
          newEmbed.addFields(
            { name: 'Auth', value: 'Unknown' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        }
      });
    
      return buttons;
    }
    
    // Checks which values were provided
    if (interaction.options.getInteger('minonline') != null) {
      minOnline.consider = true;
      minOnline.value = interaction.options.getInteger('minonline');
    }
    if (interaction.options.getInteger('maxonline') != null) {
      maxOnline.consider = true;
      maxOnline.value = interaction.options.getInteger('maxonline');
    }
    if (interaction.options.getInteger('playercap') != null) {
      playerCap.consider = true;
      playerCap.value = interaction.options.getInteger('playercap');
    }
    if (interaction.options.getBoolean('isfull') != null) {
      isFull.consider = true;
      isFull.value = interaction.options.getBoolean('isfull');
    }
    if (interaction.options.getString('version') != null) {
      version.consider = true;
      version.value = interaction.options.getString('version');
    }
    if (interaction.options.getBoolean('hasimage') != null) {
      hasImage.consider = true;
      hasImage.value = interaction.options.getBoolean('hasimage');
    }
    if (interaction.options.getString('description') != null) {
      description.consider = true;
      description.value = interaction.options.getString('description');
    }
    if (interaction.options.getString('player') != null) {
      player.consider = true;
      player.value = interaction.options.getString('player');
    }
    if (interaction.options.getBoolean('hasplayerlist') != null) {
      hasPlayerList.consider = true;
      hasPlayerList.value = interaction.options.getBoolean('hasplayerlist');
    }
    if (interaction.options.getInteger('seenafter') != null) {
      seenAfter.consider = true;
      seenAfter.value = interaction.options.getInteger('seenafter');
    }
    if (interaction.options.getString('iprange') != null) {
      ipRange.consider = true;
      ipRange.value = interaction.options.getString('iprange');
    }
    if (interaction.options.getString('country') != null) {
      country.consider = true;
      country.value = interaction.options.getString('country');
    }

    var argumentList = '**Searching with these arguments:**';
    if (minOnline.consider) argumentList += `\n**minonline:** ${minOnline.value}`;
    if (maxOnline.consider) argumentList += `\n**maxonline:** ${maxOnline.value}`;
    if (playerCap.consider) argumentList += `\n**playercap:** ${playerCap.value}`;
    if (isFull.consider) {
      if (isFull.value) {
        argumentList += '\n**Is Full**';
      } else {
        argumentList += '\n**Not Full**';
      }
    }
    if (version.consider) argumentList += `\n**version:** ${version.value}`;
    if (hasImage.consider) {
      if (hasImage.value) {
        argumentList += '\n**Has Image**';
      } else {
        argumentList += '\n**Doesn\'t Have Image**'
      }
    }
    if (description.consider) argumentList += `\n**description:** ${description.value}`;
    if (player.consider) argumentList += `\n**player:** ${player.value}`;
    if (hasImage.consider) {
      if (hasPlayerList.value) {
        argumentList += '\n**Player List Enabled**';
      } else {
        argumentList += '\n**Player List Disabled**'
      }
    }
    if (seenAfter.consider) argumentList += `\n**seenafter: **<t:${seenAfter.value}:f>`;
    if (ipRange.consider) argumentList += `\n**iprange: **${ipRange.value}`;
    if (country.consider) argumentList += `\n**country: **:flag_${country.value.toLowerCase()}: ${country.value}`;

    await interactReplyMessage.edit(argumentList);

    if (minOnline.consider) {
      if (mongoFilter['players.online'] == null) mongoFilter['players.online'] = {};
      mongoFilter['players.online']['$gte'] = minOnline.value;
    }
    if (maxOnline.consider) {
      if (mongoFilter['players.online'] == null) mongoFilter['players.online'] = {};
      mongoFilter['players.online']['$lte'] = maxOnline.value;
    }
    if (playerCap.consider) mongoFilter['players.max'] = playerCap.value;
    if (isFull.consider) {
      if (isFull.value) {
        mongoFilter['$expr'] = { '$eq': ['$players.online', '$players.max'] };
      } else { 
        mongoFilter['$expr'] = { '$ne': ['$players.online', '$players.max'] };
      }
      mongoFilter['players'] = { '$ne': null };
    }
    if (version.consider) mongoFilter['version.name'] = { '$regex': version.value };
    if (hasImage.consider) mongoFilter['hasFavicon'] = hasImage.value;
    if (description.consider) mongoFilter['$or'] = [ {'description': {'$regex': description.value, '$options': 'i'}}, {'description.text': {'$regex': description.value, '$options': 'i'}}, { 'description.extra.text': { '$regex': description.value, '$options': 'i', } }, ];
    if (player.consider) {
      mongoFilter['players'] = { '$ne': null };
      mongoFilter['players.sample'] = { '$exists': true, "$elemMatch": { "name": player.value }};
    }
    if (hasPlayerList.consider) {
      if (mongoFilter['players.sample'] == null) mongoFilter['players.sample'] = { '$exists': true };
      mongoFilter['players.sample']['$not'] = { '$size': 0 };
    }
    if (seenAfter.consider) mongoFilter['lastSeen'] = { '$gte': seenAfter.value };
    if (ipRange.consider) {
      const [ip, range] = ipRange.value.split('/');
      const ipCount = 2**(32 - range)
      const octets = ip.split('.');
      for (var i = 0; i < octets.length; i++) {
        if (256**i < ipCount) {
          var min = octets[octets.length - i - 1];
          var max = 255;
          if (256**(i + 1) < ipCount) {
            min = 0;
          } else {
            max = ipCount / 256;
          }
          octets[octets.length - i - 1] = `(${min}|[1-9]\\d{0,2}|[1-9]\\d{0,1}\\d|${max})`;
        }
      }

      mongoFilter['ip'] = { '$regex': `^${octets[0]}\.${octets[1]}\.${octets[2]}\.${octets[3]}\$`, '$options': 'i' }
    }
    if (country.consider) mongoFilter['geo.country'] = country.value;

    const totalResults = await scannedServersDB.countDocuments(mongoFilter);

    // If at least one server was found, send the message
    if (totalResults > 0) {
      var buttons = createButtons(totalResults);

      const server = (await (await scannedServersDB.find(mongoFilter).limit(1)).toArray())[0];
      var newEmbed = new EmbedBuilder()
        .setColor("#02a337")
        .setTitle('Search Results')
        .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
        .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${server.ip}&port=${server.port}`)
        .addFields(
          { name: 'Result ' + 1 + '/' + totalResults, value: '​' },
          { name: 'IP', value: server.ip },
          { name: 'Port', value: (server.port + '') },
          { name: 'Version', value: getVersion(server.version) + ` (${server.version.protocol})` },
          { name: 'Description', value: getDescription(server.description) }
        )
        .setTimestamp()

      var playersString = `${server.players.online}/${server.players.max}`;
      if (server.players.sample != null) {
        var oldString;
        for (var i = 0; i < server.players.sample.length; i++) {
          if (server.players.sample[i].lastSeen == server.lastSeen) {
            oldString = playersString;
            playersString += `\n${server.players.sample[i].name}\n${server.players.sample[i].id}`;
            if (i + 1 < server.players.sample.length) playersString += '\n';
            if (playersString.length > 1024) {
              playersString = oldString;
              break;
            }
          }
        }
      }

      newEmbed.addFields(
        { name: 'Players', value: playersString },
        { name: 'Last Seen', value: `<t:${server.lastSeen}:f>` }
      )

      buttonTimeoutCheck();
      await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });

      var location = await cityLookup.get(server.ip);
      if (location == null) {
        newEmbed.addFields({ name: 'Country: ', value: `Unknown` })
      } else {
        if (location.country != null) {
          newEmbed.addFields({ name: 'Country: ', value: `:flag_${location.country.iso_code.toLowerCase()}: ${location.country.names.en}` })
        } else {
          newEmbed.addFields({ name: 'Country: ', value: `:flag_${location.registered_country.iso_code.toLowerCase()}: ${location.registered_country.names.en}` })
        }
      }
      var org = await asnLookup.get(server.ip);
      if (org == null) {
        newEmbed.addFields({ name: 'Organization: ', value: 'Unknown' });
      } else {
        newEmbed.addFields({ name: 'Organization: ', value: org.autonomous_system_organization });
      }

      await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });

      const auth = await (await fetch(`https://ping.cornbread2100.com/cracked/?ip=${server.ip}&port=${server.port}`)).text();
      if (auth == 'true') {
        newEmbed.addFields(
          { name: 'Auth', value: 'Cracked' }
        )
        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
      } else if (auth == 'false') {
        newEmbed.addFields(
          { name: 'Auth', value: 'Premium' }
        )
        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
      } else {
        newEmbed.addFields(
          { name: 'Auth', value: 'Unknown' }
        )
        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
      }
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
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId(oldPlayersID)
              .setLabel('Show Old Players')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );
        await interactReplyMessage.edit({ content: '', components: [buttons] });

        searchNextResultCollector.stop();
        searchLastResultCollector.stop();
        oldPlayersCollector.stop();
      } else {
        setTimeout(function() { buttonTimeoutCheck() }, 500);
      }
    }
  },
};