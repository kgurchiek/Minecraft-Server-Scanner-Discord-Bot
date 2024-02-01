// Fectches dependencies and inits variables
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, getVersion } = require('../commonFunctions.js');
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

function createEmbed(server, currentEmbed, totalResults) {
  const newEmbed = new EmbedBuilder()
    .setColor("#02a337")
    .setTitle(`Result ${currentEmbed + 1}/${totalResults}`)
    .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
    .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${server.ip}&port=${server.port}`)
    .addFields(
      { name: 'IP', value: server.ip },
      { name: 'Port', value: (server.port + '') },
      { name: 'Version', value: `${getVersion(server.version)} (${server.version.protocol})` },
      { name: 'Description', value: getDescription(server.description) }
    )
    .setTimestamp();
  
  var playersString = `${server.players.online}/${server.players.max}`;
  if (server.players.sample != null && server.players.sample.length > 0) {
    playersString += '\n```\n';
    var oldString;
    for (var i = 0; i < server.players.sample.length; i++) {
      oldString = playersString;
      playersString += `\n${server.players.sample[i].name}\n${server.players.sample[i].id}`;
      if (i + 1 < server.players.sample.length) playersString += '\n';
      if (playersString.length > 1024) {
        playersString = oldString;
        break;
      }
    }
    playersString += '```';
  }
  newEmbed.addFields(
    { name: 'Players', value: playersString },
    { name: 'Last Seen', value: `<t:${server.lastSeen}:${(new Date().getTime() / 1000) - server.lastSeen > 86400 ? 'D' : 'R'}>` }
  )

  if (server.geo?.country == null) newEmbed.addFields({ name: 'Country: ', value: 'Unknown' })
  else newEmbed.addFields({ name: 'Country: ', value: `:flag_${server.geo.country.toLowerCase()}: ${server.geo.country}` })
  
  if (server.org == null) newEmbed.addFields({ name: 'Organization: ', value: 'Unknown' });
  else newEmbed.addFields({ name: 'Organization: ', value: server.org });

  newEmbed.addFields({ name: 'Auth', value: server.cracked == true ? 'Cracked' : server.cracked == false ? 'Premium' : 'Unknown' })
  return newEmbed;
}

// Exports an object with the parameters for the target server
module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Searches the current database for a server with specific properties')
    .addIntegerOption(option =>
      option
        .setName('skip')
        .setDescription('skips to a page of results'))
    .addStringOption(option =>
      option
        .setName('playercount')
        .setDescription('A range of online player counts'))
    .addIntegerOption(option =>
      option
        .setName('playercap')
        .setDescription('The server\'s maximum player capacity'))
    .addBooleanOption(option =>
      option
        .setName('isfull')
        .setDescription('whether or not the server is full'))
    .addStringOption(option =>
      option
        .setName('version')
        .setDescription('The version of the server (uses regex)'))
    .addIntegerOption(option =>
      option
        .setName('protocol')
        .setDescription('The protocol version of the server'))
    .addBooleanOption(option =>
      option
        .setName('hasimage')
        .setDescription('Whether or not the server has a custom favicon'))
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('The description of the server (uses regex)'))
    .addBooleanOption(option =>
      option
        .setName('hasplayerlist')
        .setDescription('Whether or not the server has player list enabled'))
    .addIntegerOption(option =>
      option
        .setName('seenafter')
        .setDescription('The oldest time a server can be last seen (this doesn\'t mean it\'s offline, use /help for more info)')
        .setAutocomplete(true))
    .addStringOption(option =>
      option
        .setName('iprange')
        .setDescription('The ip subnet a server\'s ip has to be within'))
    .addIntegerOption(option =>
      option
        .setName('port')
        .setDescription('The port the server is hosted on'))
    .addStringOption(option =>
      option
        .setName('country')
        .setDescription('The country the server is hosted in')
        .setAutocomplete(true))
    .addStringOption(option =>
      option
        .setName('org')
        .setDescription('The organization hosting the server')
        .setAutocomplete(true))
    .addBooleanOption(option =>
      option
        .setName('cracked')
        .setDescription('Whether or not the server is cracked (offline mode)')),
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
    const user = interaction.user;
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

    // Creates interactable buttons
    var currentEmbed = 0;
    var hasOldPlayers = false;
    var showingOldPlayers = false;
    var server;
    function createButtons(totalResults) {
      var buttons;
      
      function updateButtons() {
        if (totalResults > 1) {
          buttons = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId(lastResultID)
                .setLabel('◀')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(nextResultID)
                .setLabel('▶')
                .setStyle(ButtonStyle.Primary))
        } else {
          buttons = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId(lastResultID)
                .setLabel('◀')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId(nextResultID)
                .setLabel('▶')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true))
        }
        if (hasOldPlayers) {
          buttons.addComponents(
            new ButtonBuilder()
            .setCustomId(oldPlayersID)
            .setLabel(showingOldPlayers ? 'Online Players' : 'Player History')
            .setStyle(ButtonStyle.Primary))
        }
      }
      updateButtons();
    
      if (totalResults > 0) {
        // Event listener for 'Next Page' button
        searchNextResultCollector.on('collect', async interaction => {
          if (interaction.user.id != user.id) return interaction.reply({ content: 'That\'s another user\'s command, use /search to create your own', ephemeral: true });
          await interaction.deferUpdate();
          lastButtonPress = new Date();
          showingOldPlayers = false;
          currentEmbed++;
          if (currentEmbed == totalResults) currentEmbed = 0;
          server = (await (await fetch(`https://api.cornbread2100.com/servers?limit=1&skip=${currentEmbed}&query=${JSON.stringify(mongoFilter)}`)).json())[0];
          hasOldPlayers = server.players.history != null && typeof server.players.history == 'object';
          updateButtons();
          newEmbed = createEmbed(server, currentEmbed, totalResults);
          await interaction.editReply({ embeds: [newEmbed], components: [buttons] });
        });
      
        // Event listener for 'Last Page' button
        searchLastResultCollector.on('collect', async interaction => {
          if (interaction.user.id != user.id) return interaction.reply({ content: 'That\'s another user\'s command, use /search to create your own', ephemeral: true });
          await interaction.deferUpdate();
          lastButtonPress = new Date();
          showingOldPlayers = false;
          currentEmbed--;
          if (currentEmbed == -1) currentEmbed = totalResults - 1;
          server = (await (await fetch(`https://api.cornbread2100.com/servers?limit=1&skip=${currentEmbed}&query=${JSON.stringify(mongoFilter)}`)).json())[0];
          hasOldPlayers = server.players.history != null && typeof server.players.history == 'object';
          updateButtons();
          newEmbed = createEmbed(server, currentEmbed, totalResults);
          await interaction.editReply({ embeds: [newEmbed], components: [buttons] });
        });

        oldPlayersCollector.on('collect', async interaction => {
          if (interaction.user.id != user.id) return interaction.reply({ content: 'That\'s another user\'s command, use /search to create your own', ephemeral: true });
          lastButtonPress = new Date();
          showingOldPlayers = !showingOldPlayers;
          updateButtons();
          newEmbed = createEmbed(server, currentEmbed, totalResults);
          if (showingOldPlayers) {
            var playersString = `${server.players.online}/${server.players.max}`;
            for (const player in server.players.history) playersString += `\n\`${player.replace(':', ' ')}\` <t:${server.players.history[player]}:${(new Date().getTime() / 1000) - server.players.history[player] > 86400 ? 'D' : 'R'}>`;
            newEmbed.data.fields[4].value = playersString;
          }
          await interaction.update({ embeds: [newEmbed], components: [buttons] });
        });
      }
    
      return buttons;
    }
    
    // Get arguments
    if (interaction.options.getInteger('skip') != null) currentEmbed = interaction.options.getInteger('skip') - 1;
    var playerCount;
    var minOnline;
    var maxOnline;
    if (interaction.options.getString('playercount') != null) {
      playerCount = interaction.options.getString('playercount');
      if (playerCount.startsWith('>=')) minOnline = parseInt(playerCount.substring(2));
      else if (playerCount.startsWith('<=')) maxOnline = parseInt(playerCount.substring(2));
      else if (playerCount.startsWith('>')) minOnline = parseInt(playerCount.substring(1));
      else if (playerCount.startsWith('<')) maxOnline = parseInt(playerCount.substring(1));
      else if (playerCount.includes('-')) {
        const [min, max] = playerCount.split('-');
        minOnline = parseInt(min);
        maxOnline = parseInt(max);
      } else minOnline = maxOnline = parseInt(playerCount);
      if ((minOnline != null && isNaN(minOnline)) || (maxOnline != null && isNaN(maxOnline))) {
        const newEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('Error')
          .setDescription('Invalid online player range')
        await interactReplyMessage.edit({ content: '', embeds: [newEmbed] });
        return;
      }
    }
    var playerCap = interaction.options.getInteger('playercap');
    var isFull = interaction.options.getBoolean('isfull');
    var version = interaction.options.getString('version');
    var protocol = interaction.options.getInteger('protocol');
    var hasImage = interaction.options.getBoolean('hasimage');
    var description = interaction.options.getString('description');
    var hasPlayerList = interaction.options.getBoolean('hasplayerlist');
    var seenAfter = interaction.options.getInteger('seenafter');
    var ipRange = interaction.options.getString('iprange');
    var port = interaction.options.getInteger('port');
    var country = interaction.options.getString('country');
    var org = interaction.options.getString('org');
    var cracked = interaction.options.getBoolean('cracked');

    var argumentList = '**Searching with these arguments:**';
    if (playerCount != null) argumentList += `\n**playercount:** ${playerCount}`;
    if (playerCap != null) argumentList += `\n**playercap:** ${playerCap}`;
    if (isFull != null) argumentList += `\n**${isFull ? 'Is' : 'Not'} Full**`;
    if (version != null) argumentList += `\n**version:** ${version}`;
    if (protocol != null) argumentList += `\n**protocol:** ${protocol}`;
    if (hasImage != null) argumentList += `\n**hasimage:** ${hasImage ? 'Has' : 'Doesn\'t Have'} Image`;
    if (description != null) argumentList += `\n**description:** ${description}`;
    if (hasPlayerList != null) argumentList += hasPlayerList ? '\n**Player List Enabled**' : '\n**Player List Disabled**';
    if (seenAfter != null) argumentList += `\n**seenafter: **<t:${seenAfter}:f>`;
    if (ipRange != null) argumentList += `\n**iprange: **${ipRange}`;
    if (port != null) argumentList += `\n**port: **${port}`;
    if (country != null) argumentList += `\n**country: **:flag_${country.toLowerCase()}: ${country}`;
    if (org != null) argumentList += `\n**org: **${org}`;
    if (cracked != null) argumentList += `\n**auth: **${cracked ? 'Cracked' : 'Premium' }`;

    await interactReplyMessage.edit(argumentList);

    const mongoFilter = {};
    if (minOnline == maxOnline) { if (minOnline != null) mongoFilter['players.online'] = minOnline; }
    else {
      if (minOnline != null) {
        if (mongoFilter['players.online'] == null) mongoFilter['players.online'] = {};
        mongoFilter['players.online'][`$gt${ playerCount[1] == '=' || !isNaN(playerCount[0]) ? 'e' : '' }`] = minOnline;
      }
      if (maxOnline != null) {
        if (mongoFilter['players.online'] == null) mongoFilter['players.online'] = {};
        mongoFilter['players.online'][`$lt${ playerCount[1] == '=' || !isNaN(playerCount[0]) ? 'e' : '' }`] = maxOnline;
      }
    }
    if (playerCap != null) mongoFilter['players.max'] = playerCap;
    if (isFull != null) {
      if (isFull) mongoFilter['$expr'] = { '$eq': ['$players.online', '$players.max'] };
      else mongoFilter['$expr'] = { '$ne': ['$players.online', '$players.max'] };
    }
    if (version != null) mongoFilter['version.name'] = { '$regex': version, '$options': 'i' };
    if (protocol != null) mongoFilter['version.protocol'] = protocol;
    if (hasImage != null) mongoFilter['hasFavicon'] = hasImage;
    if (description != null) mongoFilter['$or'] = [ {'description': {'$regex': description, '$options': 'i'}}, {'description.text': {'$regex': description, '$options': 'i'}}, { 'description.extra.text': { '$regex': description, '$options': 'i', } }, ];
    if (hasPlayerList != null) {
      if (mongoFilter['players.sample'] == null) mongoFilter['players.sample'] = {};
      mongoFilter['players.sample']['$exists'] = hasPlayerList;
      if (hasPlayerList) mongoFilter['players.sample']['$not'] = { '$size': 0 };
    }
    if (seenAfter != null) mongoFilter['lastSeen'] = { '$gte': seenAfter };
    if (ipRange != null) {
      const [ip, range] = ipRange.split('/');
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
    if (port != null) mongoFilter['port'] = port;
    if (country != null) mongoFilter['geo.country'] = country;
    if (org != null) mongoFilter['org'] = { '$regex': org, '$options': 'i' };
    if (cracked != null) mongoFilter['cracked'] = cracked;

    server = (await (await fetch(`https://api.cornbread2100.com/servers?skip=${currentEmbed}&limit=1&query=${JSON.stringify(mongoFilter)}`)).json())[0];
    if (server != null) {
      var totalResults;
      (new Promise(async resolve => resolve(await (await fetch(`https://api.cornbread2100.com/countServers?query=${JSON.stringify(mongoFilter)}`)).json()))).then(response => totalResults = response)

      hasOldPlayers = server.players.history != null && typeof server.players.history == 'object';
      var buttons = createButtons(0);
      var newEmbed = createEmbed(server, currentEmbed, 0);
      newEmbed.data.title = 'Counting...';
      await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
      await (new Promise(resolve => {
        const waitForCount = setInterval(() => {
          if (totalResults != null) {
            clearInterval(waitForCount);
            resolve();
          }
        }, 100)
      }));
      
      buttons = createButtons(totalResults);
      newEmbed = createEmbed(server, currentEmbed, totalResults);
      await interactReplyMessage.edit({ embeds: [newEmbed], components: [buttons] })
      // Times out the buttons after a few seconds of inactivity (set in buttonTimeout variable)
      lastButtonPress = new Date();
      const buttonTimeoutCheck = setInterval(async () => {
        if (lastButtonPress != null && timeSinceDate(lastButtonPress) >= buttonTimeout) {
          clearInterval(buttonTimeoutCheck);
          searchNextResultCollector.stop();
          searchLastResultCollector.stop();
          oldPlayersCollector.stop();
          buttons = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId(lastResultID)
                .setLabel('◀')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId(nextResultID)
                .setLabel('▶')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
            );
          await interactReplyMessage.edit({ components: [buttons] });
        }
      }, 500);
    } else await interactReplyMessage.edit({ content: 'No matches could be found', embeds: [], components: [] }); 
  }
}