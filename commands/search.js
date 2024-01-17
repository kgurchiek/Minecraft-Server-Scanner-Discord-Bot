// Fectches dependencies and inits variables
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, getVersion, POST } = require('../commonFunctions.js');
const countryCodes = require('../countryCodes.json');
const orgs = require('../orgs.json');
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
        .setName("skip")
        .setDescription("skips to a page of results"))
    .addStringOption(option =>
      option
        .setName("onlineplayers")
        .setDescription("A range of online players"))
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
    .addIntegerOption(option =>
      option
        .setName("protocol")
        .setDescription("The protocol version of the server"))
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
        .setDescription("The oldest time a server can be last seen (this doesn't mean it's offline, use /help for more info)")
        .setAutocomplete(true))
    .addStringOption(option =>
      option
        .setName("iprange")
        .setDescription("The ip subnet a server's ip has to be within"))
    .addIntegerOption(option =>
      option
        .setName("port")
        .setDescription("The port the server is hosted on"))
    .addStringOption(option =>
      option
        .setName("country")
        .setDescription("The country the server is hosted in")
        .setAutocomplete(true))
    .addStringOption(option =>
      option
        .setName("org")
        .setDescription("The organization hosting the server")
        .setAutocomplete(true))
    .addBooleanOption(option =>
      option
        .setName("cracked")
        .setDescription("Whether or not the server is cracked (offline mode)")),
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused(true);
    switch (focusedValue.name) {
      case 'seenafter':
        await interaction.respond([{ name: '1 hour ago', value: Math.round(new Date().getTime() / 1000) - 3600}, { name: '6 hours ago', value: Math.round(new Date().getTime() / 1000) - 21600 }, { name: '1 day ago', value: Math.round(new Date().getTime() / 1000) - 86400 }])
        break;
      case 'country':
        await interaction.respond(countryCodes.filter(choice => choice.name.toLowerCase().includes(focusedValue.value.toLowerCase())).splice(0, 25).map(choice => ({ name: choice.name, value: choice.code })));
        break;
      case 'org':
        await interaction.respond(orgs.filter(choice => choice.toLowerCase().includes(focusedValue.value.toLowerCase())).splice(0, 25).map(choice => ({ name: choice, value: `^${choice}$` })));
        break;
    }
  },
  async execute(interaction) {
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

    // Creates interactable buttons
    var currentEmbed = 0;
    var hasOldPlayers = false;
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
      if (hasOldPlayers) {
        buttons.addComponents(
          new ButtonBuilder()
          .setCustomId(oldPlayersID)
          .setLabel('Show Old Players')
          .setStyle(ButtonStyle.Primary))
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

        const server = (await POST(`https://api.cornbread2100.com/servers?limit=1&skip=${currentEmbed}`, mongoFilter))[0];

        if (server.players.sample != null && Array.isArray(server.players.sample)) {
          for (const player of server.players.sample) {
            if (player.lastSeen != server.lastSeen) {
              hasOldPlayers = true;
              break;
            }
          }
        }

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
        if (hasOldPlayers) {
          buttons.addComponents(
            new ButtonBuilder()
            .setCustomId(oldPlayersID)
            .setLabel('Show Old Players')
            .setStyle(ButtonStyle.Primary))
        }

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
        if (hasOldPlayers) {
          buttons.addComponents(
            new ButtonBuilder()
            .setCustomId(oldPlayersID)
            .setLabel('Show Old Players')
            .setStyle(ButtonStyle.Primary))
        }

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
  
        buttonTimeoutCheck();
  
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
  
        newEmbed.addFields({ name: 'Auth', value: server.cracked == true ? 'Cracked' : server.cracked == false ? 'Premium' : 'Unknown' })
        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
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

        const server = (await POST(`https://api.cornbread2100.com/servers?limit=1&skip=${currentEmbed}`, mongoFilter))[0];
    
        if (server.players.sample != null && Array.isArray(server.players.sample)) {
          for (const player of server.players.sample) {
            if (player.lastSeen != server.lastSeen) {
              hasOldPlayers = true;
              break;
            }
          }
        }

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
  
        buttonTimeoutCheck();
  
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
  
        newEmbed.addFields({ name: 'Auth', value: server.cracked == true ? 'Cracked' : server.cracked == false ? 'Premium' : 'Unknown' })
        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
      });

      oldPlayersCollector.on('collect', async interaction => { 
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

        const server = (await POST(`https://api.cornbread2100.com/servers?limit=1&skip=${currentEmbed}`, mongoFilter))[0];

        if (server.players.sample != null && Array.isArray(server.players.sample)) {
          for (const player of server.players.sample) {
            if (player.lastSeen != server.lastSeen) {
              hasOldPlayers = true;
              break;
            }
          }
        }

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
        if (hasOldPlayers) {
          buttons.addComponents(
            new ButtonBuilder()
            .setCustomId(oldPlayersID)
            .setLabel('Show Old Players')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true))
        }

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
  
        buttonTimeoutCheck();
  
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
  
        newEmbed.addFields({ name: 'Auth', value: server.cracked == true ? 'Cracked' : server.cracked == false ? 'Premium' : 'Unknown' })
        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
      });
    
      return buttons;
    }
    
    // Get arguments
    if (interaction.options.getInteger('skip') != null) currentEmbed = interaction.options.getInteger('skip') - 1;
    var onlinePlayers;
    var minOnline;
    var maxOnline;
    if (interaction.options.getString('onlineplayers') != null) {
      onlinePlayers = interaction.options.getString('onlineplayers');
      if (onlinePlayers.startsWith('>=')) minOnline = parseInt(onlinePlayers.substring(2));
      else if (onlinePlayers.startsWith('<=')) maxOnline = parseInt(onlinePlayers.substring(2));
      else if (onlinePlayers.startsWith('>')) minOnline = parseInt(onlinePlayers.substring(1));
      else if (onlinePlayers.startsWith('<')) maxOnline = parseInt(onlinePlayers.substring(1));
      else if (onlinePlayers.includes('-')) {
        const [min, max] = onlinePlayers.split('-');
        minOnline = parseInt(min);
        maxOnline = parseInt(max);
      } else minOnline = maxOnline = parseInt(onlinePlayers);
      if (isNaN(minOnline.value) || isNaN(maxOnline.value)) {
        const newEmbed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle('Error')
          .setDescription('Invalid online player range')
      }
    }
    var playerCap = interaction.options.getInteger('playercap');
    var isFull = interaction.options.getBoolean('isfull');
    var version = interaction.options.getString('version');
    var protocol = interaction.options.getinteger('protocol');
    var hasImage = interaction.options.getBoolean('hasimage');
    var description = interaction.options.getString('description');
    var player = interaction.options.getString('player');
    var hasPlayerList = interaction.options.getBoolean('hasplayerlist');
    var seenAfter = interaction.options.getInteger('seenafter');
    var ipRange = interaction.options.getString('iprange');
    var port = interaction.options.getInteger('port');
    var country = interaction.options.getString('country');
    var org = interaction.options.getString('org');
    var cracked = interaction.options.getBoolean('cracked');

    var argumentList = '**Searching with these arguments:**';
    if (onlinePlayers != null) argumentList += `\n**onlineplayers:** ${onlinePlayers}`;
    if (playerCap != null) argumentList += `\n**playercap:** ${playerCap.value}`;
    if (isFull != null) argumentList += `\n**${isFull ? 'Is' : 'Not'} Full**`;
    if (version != null) argumentList += `\n**version:** ${version.value}`;
    if (protocol != null) argumentList += `\n**protocol:** ${protocol.value}`;
    if (hasImage != null) { argumentList += `\n**hasimage:** ${hasImage ? 'Has' : 'Doesn\'t Have'} Image`;
    if (description != null) argumentList += `\n**description:** ${description.value}`;
    if (player != null) argumentList += `\n**player:** ${player.value}`;
    if (hasPlayerList != null) argumentList += hasPlayerList.value ? '\n**Player List Enabled**' : '\n**Player List Disabled**';
    if (seenAfter != null) argumentList += `\n**seenafter: **<t:${seenAfter.value}:f>`;
    if (ipRange != null) argumentList += `\n**iprange: **${ipRange.value}`;
    if (port != null) argumentList += `\n**port: **${port.value}`;
    if (country != null) argumentList += `\n**country: **:flag_${country.value.toLowerCase()}: ${country.value}`;
    if (org != null) argumentList += `\n**org: **${org.value}`;
    if (cracked != null) argumentList += `\n**auth: **${cracked.value ? 'Cracked' : 'Premium' }`;

    await interactReplyMessage.edit(argumentList);

    if (minOnline != null) {
      if (mongoFilter['players.online'] == null) mongoFilter['players.online'] = {};
      mongoFilter['players.online'][`$gt${ onlinePlayers[1] == '=' || !isNaN(onlinePlayers[0]) ? 'e' : '' }`] = minOnline.value;
    }
    if (maxOnline != null) {
      if (mongoFilter['players.online'] == null) mongoFilter['players.online'] = {};
      mongoFilter['players.online'][`$lt${ onlinePlayers[1] == '=' || !isNaN(onlinePlayers[0]) ? 'e' : '' }`] = maxOnline.value;
    }
    if (playerCap != null) mongoFilter['players.max'] = playerCap.value;
    if (isFull != null) {
      if (isFull.value) {
        mongoFilter['$expr'] = { '$eq': ['$players.online', '$players.max'] };
      } else { 
        mongoFilter['$expr'] = { '$ne': ['$players.online', '$players.max'] };
      }
      mongoFilter['players'] = { '$ne': null };
    }
    if (version != null) mongoFilter['version.name'] = { '$regex': version.value, '$options': 'i' };
    if (protocol != null) mongoFilter['version.protocol'] = protocol.value;
    if (hasImage != null) mongoFilter['hasFavicon'] = hasImage.value;
    if (description != null) mongoFilter['$or'] = [ {'description': {'$regex': description.value, '$options': 'i'}}, {'description.text': {'$regex': description.value, '$options': 'i'}}, { 'description.extra.text': { '$regex': description.value, '$options': 'i', } }, ];
    if (player != null) {
      mongoFilter['players'] = { '$ne': null };
      mongoFilter['players.sample'] = { '$exists': true, "$elemMatch": { "name": player.value }};
    }
    if (hasPlayerList != null) {
      if (mongoFilter['players.sample'] == null) mongoFilter['players.sample'] = {};
      mongoFilter['players.sample']['$exists'] = hasPlayerList.value;
      if (hasPlayerList.value) mongoFilter['players.sample']['$not'] = { '$size': 0 };
    }
    if (seenAfter != null) mongoFilter['lastSeen'] = { '$gte': seenAfter.value };
    if (ipRange != null) {
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
    if (port != null) mongoFilter['port'] = port.value;
    if (country != null) mongoFilter['geo.country'] = country.value;
    if (org != null) mongoFilter['org'] = { '$regex': org.value, '$options': 'i' };
    if (cracked != null) mongoFilter['cracked'] = cracked.value;

    const totalResults = parseInt(await POST('https://api.cornbread2100.com/countServers', mongoFilter));

    // If at least one server was found, send the message
    if (totalResults > 0) {
      const server = (await POST(`https://api.cornbread2100.com/servers?skip=${currentEmbed}&limit=1`, mongoFilter))[0];

      if (server.players.sample != null && Array.isArray(server.players.sample)) {
        for (const player of server.players.sample) {
          if (player.lastSeen != server.lastSeen) {
            hasOldPlayers = true;
            break;
          }
        }
      }
        
      var buttons = createButtons(totalResults);

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

      newEmbed.addFields({ name: 'Auth', value: server.cracked == true ? 'Cracked' : server.cracked == false ? 'Premium' : 'Unknown' })
      await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
    } else {
      await interactReplyMessage.edit('No matches could be found');
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
        if (hasOldPlayers) {
          buttons.addComponents(
            new ButtonBuilder()
            .setCustomId(oldPlayersID)
            .setLabel('Show Old Players')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true))
        }
        await interactReplyMessage.edit({ content: '', components: [buttons] });

        searchNextResultCollector.stop();
        searchLastResultCollector.stop();
        oldPlayersCollector.stop();
      } else {
        setTimeout(function() { buttonTimeoutCheck() }, 500);
      }
    }
  }
};