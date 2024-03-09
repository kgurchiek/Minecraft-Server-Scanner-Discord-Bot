// Fectches dependencies and inits variables
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, getVersion } = require('../commonFunctions.js');
const config = require('../config.json');
const languages = require('../languages.json');
const buttonTimeout = 60; // In seconds
const maxmind = require('maxmind');
var twitchAccessToken;
var accessTokenTimeout = 0;
var cityLookup;
var asnLookup;

async function getAccessToken() {
  if (Math.floor((new Date()).getTime() / 1000) >= accessTokenTimeout - 21600) {
    console.log('Refreshing access token');
    const twitchResponse = await (await fetch(`https://id.twitch.tv/oauth2/token?client_id=${config.twitchClientId}&client_secret=${config.twitchClientSecret}&grant_type=client_credentials`, { method: 'POST' })).json();
    twitchAccessToken = twitchResponse.access_token;
    accessTokenTimeout = (new Date()).getTime() / 1000 + twitchResponse.expires_in;
    console.log('Access token refreshed')
  }
  setTimeout(getAccessToken, 7200);
}

(async () => {
  getAccessToken();
  cityLookup = await maxmind.open('./GeoLite2-City.mmdb');
  asnLookup = await maxmind.open('./GeoLite2-ASN.mmdb');
})();

// Times out the buttons; fetches how long it has been since last input date
function timeSinceDate(date1) {
  if (date1 == null) date1 = new Date();
  var date2 = new Date();
  var date1Total = date1.getSeconds() + date1.getMinutes() * 60 + date1.getHours() * 3600 + date1.getDay() * 86400;
  var date2Total = date2.getSeconds() + date2.getMinutes() * 60 + date2.getHours() * 3600 + date2.getDay() * 86400;

  return date2Total - date1Total;
}

function createEmbed(server, currentEmbed, totalResults, twitchStreamers, kickStreamers, twitchStreams, kickStreams) {
  newEmbed = new EmbedBuilder()
    .setColor('#02a337')
    .setTitle(`Result ${currentEmbed + 1}/${totalResults}`)
    .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
    .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${server.ip}&port=${server.port}`)
    .addFields(
      { name: 'IP', value: server.ip },
      { name: 'Port', value: String(server.port) },
      { name: 'Version', value: getVersion(server.version) + ` (${server.version.protocol})` },
      { name: 'Description', value: getDescription(server.description) }
    )
    .setTimestamp();

    var playersString = `${server.players.online}/${server.players.max}`;
    if (server.players.sample != null && server.players.sample.length > 0) {
      playersString += '\n```\n';
      var oldString;
      for (var i = 0; i < server.players.sample.length; i++) {
        if (server.players.sample[i].lastSeen != server.lastSeen) continue;
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
    { name: 'Last Seen', value: `<t:${server.lastSeen}:f>` }
  )

  const streamLinks = [];
  var thumbnail;
  for (const player of server.players.sample) {
    if (twitchStreamers.includes(player.name)) {
      streamLinks.push(`https://twitch.tv/${player.name}`);
      if (!thumbnail) thumbnail = twitchStreams[twitchStreamers.indexOf(player.name)].thumbnail_url.replaceAll('-{width}x{height}', '');
    }
    if (kickStreamers.includes(player.name)) {
      streamLinks.push(`https://kick.com/${player.name}`);
      if (!thumbnail) thumbnail = kickStreams[kickStreamers.indexOf(player.name)].thumbnail.src;
    }
  }
  for (var i = 0; i < streamLinks.length; i++) newEmbed.addFields({ name: `Stream${i > 0 ? ` ${i + 1}` : ''}`, value: streamLinks[i] })
  newEmbed.setImage(thumbnail);

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
    .setName("streamsnipe")
    .setDescription("Searches for twitch streamer's servers")
    .addStringOption(option =>
      option
        .setName("language")
        .setDescription("The language of the stream")
        .setAutocomplete(true)),
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const filtered = languages.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase())).splice(0, 25);
    await interaction.respond(
      filtered.map(choice => ({ name: choice.name, value: choice.value })),
    );
  },
  async execute(interaction) {
    const user = interaction.user;

    // Status message
    const interactReplyMessage = await interaction.reply({ content: 'Fetching streams...', fetchReply: true });

    // Create unique IDs for each button
    const lastResultID = 'lastResult' + interaction.id;
    const nextResultID = 'nextResult' + interaction.id;
    const oldPlayersID = `oldPlayers${interaction.user.id}`;
    const searchNextResultFilter = interaction => interaction.customId == nextResultID;
    const searchLastResultFilter = interaction => interaction.customId == lastResultID;
    const oldPlayersFilter = interaction => interaction.customId == oldPlayersID;
    const searchNextResultCollector = interaction.channel.createMessageComponentCollector({ filter: searchNextResultFilter });
    const searchLastResultCollector = interaction.channel.createMessageComponentCollector({ filter: searchLastResultFilter });
    const oldPlayersCollector = interaction.channel.createMessageComponentCollector({ filter: oldPlayersFilter });
    var lastButtonPress = null;
    const mongoFilter = { 'lastSeen': { '$gte': Math.round(new Date().getTime() / 1000) - 10800 }};

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
          server = (await (await fetch(`https://api.cornbread2100.com/servers?limit=1&skip=${currentEmbed}`, {
            method: 'POST',
            body: JSON.stringify({ query: mongoFilter, onlinePlayers: twitchStreamers.concat(kickStreamers) })
          })).json())[0];
          hasOldPlayers = server.players.sample != null && server.players.sample.filter(a => a.lastSeen == server.lastSeen).length > 0;
          updateButtons();
          newEmbed = createEmbed(server, currentEmbed, totalResults, twitchStreamers, kickStreamers, twitchStreams, kickStreams);
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
          server = (await (await fetch(`https://api.cornbread2100.com/servers?limit=1&skip=${currentEmbed}`, {
            method: 'POST',
            body: JSON.stringify({ query: mongoFilter, onlinePlayers: twitchStreamers.concat(kickStreamers) })
          })).json())[0];
          hasOldPlayers = server.players.sample != null && server.players.sample.filter(a => a.lastSeen == server.lastSeen).length > 0;
          updateButtons();
          newEmbed = createEmbed(server, currentEmbed, totalResults, twitchStreamers, kickStreamers, twitchStreams, kickStreams);
          await interaction.editReply({ embeds: [newEmbed], components: [buttons] });
        });

        oldPlayersCollector.on('collect', async interaction => {
          if (interaction.user.id != user.id) return interaction.reply({ content: 'That\'s another user\'s command, use /search to create your own', ephemeral: true });
          lastButtonPress = new Date();
          showingOldPlayers = !showingOldPlayers;
          updateButtons();
          newEmbed = createEmbed(server, currentEmbed, totalResults, twitchStreamers, kickStreamers, twitchStreams, kickStreams);
          if (showingOldPlayers) {
            var playersString = `${server.players.online}/${server.players.max}`;
            for (const player of server.players.sample) playersString += `\n\`${player.name}\` <t:${player.lastSeen}:${(new Date().getTime() / 1000) - player.lastSeen > 86400 ? 'D' : 'R'}>`;
            newEmbed.data.fields[4].value = playersString;
          }
          await interaction.update({ embeds: [newEmbed], components: [buttons] });
        });
      }
    
      return buttons;
    }

    var twitchDone = false;
    var twitchStreams = [];
    var kickDone = true;
    var kickStreams = [];

    (async () => {
      const options = {
        method: 'GET',
        headers: {
          'Client-ID': config.twitchClientId,
          'Authorization': `Bearer ${twitchAccessToken}`
        }
      }
      var response = await (await fetch('https://api.twitch.tv/helix/streams?game_id=27471&first=100', options)).json();
      twitchStreams = response.data;
      do {
        response = await (await fetch(`https://api.twitch.tv/helix/streams?game_id=27471&first=100&after=${response.pagination.cursor}`, options)).json();
        twitchStreams = twitchStreams.concat(response.data);
      } while (response.pagination.cursor)
      if (interaction.options.getString('language')) twitchStreams = twitchStreams.filter(item => item.language == interaction.options.getString('language'));
      twitchDone = true;
    })();

    /*(async () => {
      try {
        let next;
        for (let i = 1; next == null || next.data.length > 0; i++) {
          next = await (await fetch(`https://kick.com/stream/livestreams/en?page=${i}&limit=12&subcategory=minecraft%C2%A0&sort=desc`, {
            'credentials': 'include',
            'headers': {
                'User-Agent': '0',
                'Accept-Language': 'en-US,en;q=0.5',
                'Sec-GPC': '1',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'X-Socket-ID': '0'
            },
            'method': 'GET',
            'mode': 'cors'
        })).json();
          kickStreams = kickStreams.concat(next.data);
        }
        kickDone = true;
      } catch (e) {
        await (new Promise (resolve => setTimeout(resolve, 5000)));
        let next;
        for (let i = 1; next == null || next.data.length > 0; i++) {
          next = await (await fetch(`https://kick.com/stream/livestreams/en?page=${i}&limit=12&subcategory=minecraft%C2%A0&sort=desc`, {
            'credentials': 'include',
            'headers': {
                'User-Agent': '0',
                'Accept-Language': 'en-US,en;q=0.5',
                'Sec-GPC': '1',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'X-Socket-ID': '0'
            },
            'method': 'GET',
            'mode': 'cors'
        })).json();
          kickStreams = kickStreams.concat(next.data);
        }
        kickDone = true;
      }
    })();*/

    await (new Promise(resolve => setInterval(() => { if (twitchDone && kickDone) resolve(); }, 100)))

    if (twitchStreams.length == 0 && kickStreams.length == 0) return interactReplyMessage.edit('No streams found. This is likely a bug, please ping @cornbread2100 in the official support server (https://discord.gg/3u2fNRAMAN)');

    await interactReplyMessage.edit(`Found ${twitchStreams.length} Twitch streams and ${kickStreams.length} Kick streams. Searching servers...`);

    const twitchStreamers = [];
    for (const stream of twitchStreams) twitchStreamers.push(stream.user_name);
    const kickStreamers = [];
    for (const stream of kickStreams) kickStreamers.push(stream.channel.user.username);
    mongoFilter['players.sample.name'] = { '$in': twitchStreamers.concat(kickStreamers) };

    const totalResults = await (await fetch(`https://api.cornbread2100.com/countServers`, {
      method: 'POST',
      body: JSON.stringify({ query: mongoFilter, onlinePlayers: twitchStreamers.concat(kickStreamers) })
    })).json();

    // If at least one server was found, send the message
    if (totalResults > 0) {
      server = (await (await fetch(`https://api.cornbread2100.com/servers`, {
        method: 'POST',
        body: JSON.stringify({ query: mongoFilter, onlinePlayers: twitchStreamers.concat(kickStreamers) })
      })).json())[0];

      if (server.players.sample != null && Array.isArray(server.players.sample)) {
        for (const player of server.players.sample) {
          if (player.lastSeen != server.lastSeen) {
            hasOldPlayers = true;
            break;
          }
        }
      }
      
      var buttons = createButtons(totalResults);
      const newEmbed = createEmbed(server, currentEmbed, totalResults, twitchStreamers, kickStreamers, twitchStreams, kickStreams);

      await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
    } else await interactReplyMessage.edit('No matches could be found');

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
              .setDisabled(true),
            new ButtonBuilder()
            .setLabel('API')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://api.cornbread2100.com/servers?limit=1&skip=${currentEmbed}&query=${encodeURIComponent(JSON.stringify(mongoFilter))}${player == null ? '' : `&onlineplayers=["${player}"]`}`)
          );
        await interactReplyMessage.edit({ components: [buttons] });
      }
    }, 500);
  }
}