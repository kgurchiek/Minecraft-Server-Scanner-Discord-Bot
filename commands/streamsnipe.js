// Fectches dependencies and inits variables
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, getVersion, POST } = require('../commonFunctions.js');
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
    const twitchResponse = (await POST('https://id.twitch.tv/oauth2/token', {
      client_id: config.twitchClientId,
      client_secret: config.twitchClientSecret,
      grant_type: 'client_credentials'
    }));
    twitchAccessToken = twitchResponse.access_token;
    accessTokenTimeout = (new Date()).getTime() / 1000 + twitchResponse.expires_in;
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
    const oldPlayersID = `oldPlayers${interaction.user.id}`;
    const oldPlayersFilter = interaction => interaction.customId == oldPlayersID;
    const oldPlayersCollector = interaction.channel.createMessageComponentCollector({ filter: oldPlayersFilter });

    // Status message
    const interactReplyMessage = await interaction.reply({ content: 'Fetching streams...', fetchReply: true });

    // Create unique IDs for each button
    const lastResultID = 'lastResult' + interaction.id;
    const nextResultID = 'nextResult' + interaction.id;
    const searchNextResultFilter = interaction => interaction.customId == nextResultID;
    const searchLastResultFilter = interaction => interaction.customId == lastResultID;
    const searchNextResultCollector = interaction.channel.createMessageComponentCollector({ filter: searchNextResultFilter });
    const searchLastResultCollector = interaction.channel.createMessageComponentCollector({ filter: searchLastResultFilter });
    var lastButtonPress = null;
    const mongoFilter = { 'lastSeen': { '$gte': Math.round(new Date().getTime() / 1000) - 10800 }};

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
        const oldPage = currentEmbed;

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
        for (var i = 0; i < streamLinks.length; i++) newEmbed.addFields({ name: `Stream${i > 0 ? i + 1 : ''}`, value: streamLinks[i] })
        newEmbed.setImage(thumbnail);

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
        const oldPage = currentEmbed;

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
        for (var i = 0; i < streamLinks.length; i++) newEmbed.addFields({ name: `Stream${i > 0 ? i + 1 : ''}`, value: streamLinks[i] })
        newEmbed.setImage(thumbnail);

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

      // Event listener for 'Show Old Players' button
      oldPlayersCollector.on('collect', async interaction => {
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
          const sortedPlayers = [...server.players.sample]
          sortedPlayers.sort((a, b) => b.lastSeen - a.lastSeen);
          for (var i = 0; i < sortedPlayers.length; i++) {
            oldString = playersString;
            playersString += `\n${sortedPlayers[i].name} ${sortedPlayers[i].lastSeen == server.lastSeen ? '`online`' : '<t:' + sortedPlayers[i].lastSeen + ':R>'}`;
            if (playersString.length > 1020 && i + 1 < sortedPlayers.length || playersString.length > 1024) {
              playersString = oldString + '\n...';
              break;
            }
          }
        }
        newEmbed.addFields(
          { name: 'Players', value: playersString },
          { name: 'Last Seen', value: `<t:${server.lastSeen}:f>` }
        )
        const interactionUpdate = await interaction.update({ content: '', embeds: [newEmbed], components: [buttons] });
        const oldPage = currentEmbed;

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
        for (var i = 0; i < streamLinks.length; i++) newEmbed.addFields({ name: `Stream${i > 0 ? i + 1 : ''}`, value: streamLinks[i] })
        newEmbed.setImage(thumbnail);

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

        const auth = await (await fetch(`https://ping.cornbread2100.com/cracked/?ip=${server.ip}&port=${server.port}&protocol=${server.version.protocol}`)).text();
        if (auth == 'true') {
          newEmbed.addFields({ name: 'Auth', value: 'Cracked' })
        } else if (auth == 'false') {
          newEmbed.addFields({ name: 'Auth', value: 'Premium' })
        } else {
          newEmbed.addFields(
            { name: 'Auth', value: 'Unknown' }
          )
        }
        if (currentEmbed == oldPage) await interactionUpdate.edit({ content: '', embeds: [newEmbed], components: [buttons] });
      });
    
      return buttons;
    }

    var twitchDone = false;
    var twitchStreams = [];
    var kickDone = false;
    var kickStreams = [];

    (async () => {
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
      if (interaction.options.getString('language')) streams = streams.filter(item => item.language == interaction.options.getString('language'));
      twitchDone = true;
    })();

    (async () => {
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
    })();

    await (new Promise(resolve => setInterval(() => { if (twitchDone && kickDone) resolve(); }, 100)))

    await interactReplyMessage.edit(`Found ${twitchStreams.length} Twitch streams and ${kickStreams.length} Kick streams. Searching servers...`);

    const twitchStreamers = [];
    for (const stream of twitchStreams) twitchStreamers.push(stream.user_name);
    const kickStreamers = [];
    for (const stream of kickStreams) kickStreamers.push(stream.channel.user.username);
    mongoFilter['players.sample'] = { '$elemMatch': { 'name': { '$in': twitchStreamers.concat(kickStreamers) } } };

    const totalResults = parseInt(await POST('https://api.cornbread2100.com/countServers', mongoFilter));

    // If at least one server was found, send the message
    if (totalResults > 0) {
      const server = (await POST('https://api.cornbread2100.com/servers?limit=1', mongoFilter))[0];

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
      for (var i = 0; i < streamLinks.length; i++) {
        newEmbed.addFields(
          { name: `Stream${i > 0 ? i + 1 : ''}`, value: streamLinks[i] }
        )
      }
      newEmbed.setImage(thumbnail);

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
      } else {
        setTimeout(function() { buttonTimeoutCheck() }, 500);
      }
    }
  }
}