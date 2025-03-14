// Fectches dependencies and inits variables
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, getVersion, thousandsSeparators } = require('../commonFunctions.js');
const countryCodes = require('../countryCodes.json');
const orgs = require('../orgs.json');
const buttonTimeout = 300; // In seconds

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

const shortenString = (string, length) => (string.length > length ? `${string.slice(0, length - 3)}...` : string);

function createEmbed(server, showingOldPlayers = false) {
  const newEmbed = new EmbedBuilder()
    .setColor('#02a337')
    .setTitle(`${server.ip}${server.port == 25565 ? '' : `:${server.port}`}`)
    .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
    .setThumbnail(`https://ping.cornbread2100.com/favicon?ip=${server.ip}&port=${server.port}`)
    .addFields(
      { name: 'Version', value: `${getVersion(server.version)} (${server.version.protocol})` },
      { name: 'Description', value: getDescription(server.description) }
    )
    .setTimestamp();
  
  var playersString = `${server.players.online}/${server.players.max}`;
  if (server.players.sample != null &&  server.players.sample.length > 0 && (server.players.sample.filter(a => a.lastSeen == server.lastSeen).length > 0 || showingOldPlayers)) {
    playersString += `${showingOldPlayers ? '' : '\n```'}`;
    var oldString;
    server.players.sample.sort((a, b) => b.lastSeen - a.lastSeen);
    for (var i = 0; i < server.players.sample.length; i++) {
      oldString = playersString;
      if (!showingOldPlayers && server.players.sample[i].lastSeen != server.lastSeen) continue;
      playersString += showingOldPlayers ? `\n${playersString.endsWith('```') || showingOldPlayers ? '' : '\n'}\`${server.players.sample[i].name}\` <t:${server.players.sample[i].lastSeen}:${(new Date().getTime() / 1000) - server.players.sample[i].lastSeen > 86400 ? 'D' : 'R'}>` : `\n${playersString.endsWith('\`\`\`') ? '' : '\n'}${server.players.sample[i].name}\n${server.players.sample[i].id}`;
      if (playersString.length > 1024) {
        playersString = oldString;
        break;
      }
    }
    if (!showingOldPlayers) playersString += '```';
  }
  newEmbed.addFields({ name: 'Players', value: playersString });
  const discoverDate = parseInt(server._id.slice(0,8), 16);
  newEmbed.addFields(
    { name: 'Discovered', value: `<t:${discoverDate}:${(new Date().getTime() / 1000) - discoverDate > 86400 ? 'D' : 'R'}>`},
    { name: 'Last Seen', value: `<t:${server.lastSeen}:${(new Date().getTime() / 1000) - server.lastSeen > 86400 ? 'D' : 'R'}>` }
  )

  if (server.geo?.country == null) newEmbed.addFields({ name: 'Country: ', value: 'Unknown' })
  else newEmbed.addFields({ name: 'Country: ', value: `:flag_${server.geo.country.toLowerCase()}: ${server.geo.country}` })
  
  if (server.org == null) newEmbed.addFields({ name: 'Organization: ', value: 'Unknown' });
  else newEmbed.addFields({ name: 'Organization: ', value: server.org });

  newEmbed.addFields({ name: 'Auth', value: server.cracked == true ? 'Cracked' : server.cracked == false ? 'Premium' : 'Unknown' })
  newEmbed.addFields({ name: 'Whitelist', value: server.whitelist == true ? 'Enabled' : server.whitelist == false ? 'Disabled' : 'Unknown' })
  return newEmbed;
}

function createButtons(server, showingOldPlayers = false) {
  const buttons = new ActionRowBuilder()
  if (server.players.sample != null && server.players.sample.filter(a => a.lastSeen != server.lastSeen).length > 0) buttons.addComponents(new ButtonBuilder().setLabel(showingOldPlayers ? 'Online Players' : 'Player History').setStyle(ButtonStyle.Primary).setCustomId(`search-${showingOldPlayers ? 'online' : 'history'}-${server.ip}:${server.port}`))
  buttons.addComponents(new ButtonBuilder().setLabel('API').setStyle(ButtonStyle.Link).setURL(`https://api.cornbread2100.com/servers?query={"ip":"${server.ip}","port":${server.port}}`))
  return buttons;
}

function createList(servers, currentEmbed, totalResults, minimal) {
  const embed = new EmbedBuilder()
    .setColor('#02a337')
    .setTitle(`Results ${thousandsSeparators(currentEmbed + 1)}-${thousandsSeparators(currentEmbed + servers.length)}/${thousandsSeparators(totalResults)}`)
    .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
    .setTimestamp();
  
  let description = '';
  let longest = {
    server: `${servers[0].ip}${servers[0].port == 25565 ? '' : `:${servers[0].port}`}`.length,
    version: `${shortenString(String(servers[0].version?.name), 19)} (${servers[0].version?.protocol})`.length,
  }
  for (let i = 1; i < servers.length; i++) {
    if (`${servers[i].ip}${servers[i].port == 25565 ? '' : `:${servers[i].port}`}`.length > longest.server) longest.server = `${servers[i].ip}${servers[i].port == 25565 ? '' : `:${servers[i].port}`}`.length;
    if (`${shortenString(String(servers[i].version?.name), 19)} (${servers[i].version?.protocol})`.length > longest.version) longest.version = `${shortenString(String(servers[i].version?.name), 19)} (${servers[i].version?.protocol})`.length;
  }
  
  for (let i = 0; i < servers.length; i++) description += `${i == 0 ? '' : '\n'}${i + 1}. ${minimal ? '' : (servers[i].geo?.country == null ? '❔ ' : `:flag_${servers[i].geo.country.toLowerCase()}: `)}\`${servers[i].ip}${servers[i].port == 25565 ? '' : `:${servers[i].port}`}${' '.repeat(longest.server - `${servers[i].ip}${servers[i].port == 25565 ? '' : `:${servers[i].port}`}`.length)}\`${minimal ? '' : ` \`${shortenString(String(servers[i].version?.name), 19)} (${servers[i].version?.protocol})${' '.repeat(longest.version - `${shortenString(String(servers[i].version?.name), 19)} (${servers[i].version?.protocol})`.length)}\` <t:${servers[i].lastSeen}:R>`}`;
  
  embed.setDescription(description);
  return embed;
}

// Exports an object with the parameters for the target server
module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Searches the current database for a server with specific properties')
    .addBooleanOption(option =>
      option
        .setName('minimal')
        .setDescription('Only shows ip and port in preview (recommended for mobile users)'))
    .addIntegerOption(option =>
      option
        .setName('page')
        .setDescription('Skips to a page of results'))
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
        .setName('player')
        .setDescription('A player that is currently playing on the server'))
    .addStringOption(option =>
      option
        .setName('playerhistory')
        .setDescription('The name of a player that has been on the server in the past'))
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
        .setDescription('Whether or not the server is cracked (offline mode)'))
    .addBooleanOption(option =>
      option
        .setName('whitelist')
        .setDescription('Whether or not the server has a whitelist'))
    .addBooleanOption(option =>
      option
        .setName('vanilla')
        .setDescription('Whether or not the server is vanilla')),
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
  async buttonHandler(interaction) {
    const [command, id, content] = interaction.customId.split('-');
    switch (id) {
      case 'serverInfoID': {
        const [ip, port] = content.split(':');
        const server = (await (await fetch(`https://api.cornbread2100.com/servers?limit=1&query={"ip":"${ip}","port":${port}}`)).json())[0];
        await interaction.reply({ embeds: [createEmbed(server)], components: [createButtons(server)] });
        break;
      }
      case 'history': {
        await interaction.deferUpdate();
        const [ip, port] = content.split(':');
        const server = (await (await fetch(`https://api.cornbread2100.com/servers?limit=1&query={"ip":"${ip}","port":${port}}`)).json())[0];
        await interaction.editReply({ embeds: [createEmbed(server, true)], components: [createButtons(server, true)] });
        break;
      }
      case 'online' : {
        await interaction.deferUpdate();
        const [ip, port] = content.split(':');
        const server = (await (await fetch(`https://api.cornbread2100.com/servers?limit=1&query={"ip":"${ip}","port":${port}}`)).json())[0];
        await interaction.editReply({ embeds: [createEmbed(server, false)], components: [createButtons(server, false)] });
        break;
      }
    }
  },
  async execute(interaction, buttonCallbacks) {
    const user = interaction.user;
    // Status message
    await interaction.reply({ content: 'Searching...', fetchReply: true });

    if (interaction.guild?.id == '1222761600860291163') {
      const newEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Griefing Detected')
        .setDescription('Using this bot to grief Minecraft servers is strictly prohibited. This incident has been reported.')
        .setFooter({ text: 'Griefing flagged by MCSS Advanced Griefer Detection™' })
      await interaction.editReply({ content: '', embeds: [newEmbed] });
      return;
    }

    // Create unique IDs for each button
    const lastResultID = `lastResult${interaction.id}`;
    const nextResultID = `nextResult${interaction.id}`;
    var lastButtonPress = null;

    // Creates interactable buttons
    var currentEmbed = 0;
    var servers;

    function createListButtons(totalResults) {
      let buttons;
      let infoButtons;
      let infoButtons2;
      
      function updateButtons() {
        buttons = new ActionRowBuilder();
        if (totalResults > 10) {
          buttons.addComponents(
            new ButtonBuilder()
              .setCustomId(lastResultID)
              .setLabel('◀')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(nextResultID)
              .setLabel('▶')
              .setStyle(ButtonStyle.Success))
        } else {
          buttons.addComponents(
            new ButtonBuilder()
              .setCustomId(lastResultID)
              .setLabel('◀')
              .setStyle(ButtonStyle.Success)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId(nextResultID)
              .setLabel('▶')
              .setStyle(ButtonStyle.Success)
              .setDisabled(true))
        }
        if (`https://api.cornbread2100.com/servers?limit=10&skip=${currentEmbed}&query=${encodeURIComponent(encodeURIComponent(JSON.stringify(mongoFilter)))}${player == null ? '' : `&onlineplayers=["${player}"]`}`.length <= 512) {
          buttons.addComponents(
            new ButtonBuilder()
            .setLabel('API')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://api.cornbread2100.com/servers?limit=10&skip=${currentEmbed}&query=${encodeURIComponent(encodeURIComponent(JSON.stringify(mongoFilter)))}${player == null ? '' : `&onlineplayers=["${player}"]`}`)
          )
        }

        infoButtons = new ActionRowBuilder();
        for (let i = 0; i < (totalResults - currentEmbed < 5 ? totalResults - currentEmbed : 5); i++) {
          infoButtons.addComponents(
            new ButtonBuilder()
              .setCustomId(`search-serverInfoID-${servers[i].ip}:${servers[i].port}`)
              .setLabel(String(i + 1))
              .setStyle(ButtonStyle.Primary)
          )
        }
        infoButtons2 = new ActionRowBuilder();
        for (let i = 5; i < (totalResults - currentEmbed < 10 ? totalResults - currentEmbed : 10); i++) {
          infoButtons2.addComponents(
            new ButtonBuilder()
              .setCustomId(`search-serverInfoID-${servers[i].ip}:${servers[i].port}`)
              .setLabel(String(i + 1))
              .setStyle(ButtonStyle.Primary)
          )
        }
      }
      updateButtons();
    
      if (totalResults > 10) {
        // Event listener for 'Last Page' button
        buttonCallbacks[lastResultID] = async (interaction) => {  
          if (interaction.user.id != user.id) return interaction.reply({ content: 'That\'s another user\'s command, use /search to create your own', ephemeral: true });
          await interaction.deferUpdate();
          lastButtonPress = new Date();
          currentEmbed -= 10;
          if (currentEmbed < 0) currentEmbed = totalResults < 10 ? 0 : totalResults - 10;
          servers = (await (await fetch(`https://api.cornbread2100.com/servers?limit=10&skip=${currentEmbed}&query=${encodeURIComponent(JSON.stringify(mongoFilter))}${player == null ? '' : `&onlineplayers=["${player}"]`}`)).json());
          updateButtons();
          newEmbed = createList(servers, currentEmbed, totalResults, minimal);
          await interaction.editReply({ embeds: [newEmbed], components: [buttons, infoButtons, infoButtons2].filter(a =>a.components.length > 0) });
        }

        // Event listener for 'Next Page' button
        buttonCallbacks[nextResultID] = async (interaction) => {
          if (interaction.user.id != user.id) return interaction.reply({ content: 'That\'s another user\'s command, use /search to create your own', ephemeral: true });
          await interaction.deferUpdate();
          lastButtonPress = new Date();
          currentEmbed += 10;
          if (currentEmbed >= totalResults) currentEmbed = 0;
          servers = (await (await fetch(`https://api.cornbread2100.com/servers?limit=10&skip=${currentEmbed}&query=${encodeURIComponent(JSON.stringify(mongoFilter))}${player == null ? '' : `&onlineplayers=["${player}"]`}`)).json());
          updateButtons();
          newEmbed = createList(servers, currentEmbed, totalResults, minimal);
          await interaction.editReply({ embeds: [newEmbed], components: [buttons, infoButtons, infoButtons2].filter(a =>a.components.length > 0) });
        }
      }
    
      return [buttons, infoButtons, infoButtons2].filter(a =>a.components.length > 0);
    }
    
    // Get arguments
    if (interaction.options.getInteger('page') != null) currentEmbed = interaction.options.getInteger('page') - 1;
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
          .setTitle('User Error')
          .setDescription('Invalid online player range')
        await interaction.editReply({ content: '', embeds: [newEmbed] });
        return;
      }
    }
    var minimal = interaction.options.getBoolean('minimal');
    var playerCap = interaction.options.getInteger('playercap');
    var isFull = interaction.options.getBoolean('isfull');
    var player = interaction.options.getString('player');
    var playerHistory = interaction.options.getString('playerhistory');
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
    var whitelist = interaction.options.getBoolean('whitelist');
    var vanilla = interaction.options.getBoolean('vanilla');

    var argumentList = '**Searching with these arguments:**';
    if (playerCount != null) argumentList += `\n**playercount:** ${playerCount}`;
    if (playerCap != null) argumentList += `\n**playercap:** ${playerCap}`;
    if (isFull != null) argumentList += `\n**${isFull ? 'Is' : 'Not'} Full**`;
    if (player != null) argumentList += `\n**player:** ${player}`;
    if (playerHistory != null) argumentList += `\n**playerhistory:** ${playerHistory}`;
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
    if (whitelist != null) argumentList += `\n**Whitelist ${whitelist ? 'Enabled' : 'Disabled'}**`;
    if (vanilla != null) argumentList += `\n**${vanilla ? 'Vanilla' : 'Not Vanilla'}**`;

    await interaction.editReply(argumentList);

    let mongoFilter = [];
    if (minOnline == maxOnline) { if (minOnline != null) mongoFilter.push({'players.online': minOnline}); }
    else {
      let filter = { 'players.online': {} };
      if (minOnline != null) filter['players.online'][`$gt${ playerCount[1] == '=' || !isNaN(playerCount[0]) ? 'e' : '' }`] = minOnline;
      if (maxOnline != null) filter['players.online'][`$lt${ playerCount[1] == '=' || !isNaN(playerCount[0]) ? 'e' : '' }`] = maxOnline;
      mongoFilter.push(filter);
    }
    if (playerCap != null) mongoFilter.push({'players.max': playerCap });
    if (isFull != null) {
      if (isFull) mongoFilter.push({ '$expr': { '$eq': ['$players.online', '$players.max'] }});
      else mongoFilter.push({ '$expr': { '$ne': ['$players.online', '$players.max'] }});
    }
    if (player != null) mongoFilter.push({ 'players.sample.name': player });
    if (playerHistory != null) mongoFilter.push({ 'players.sample.name': playerHistory});
    if (version != null) mongoFilter.push({ 'version.name': { '$regex': version, '$options': 'i' }});
    if (protocol != null) mongoFilter.push({ 'version.protocol': protocol });
    if (hasImage != null) mongoFilter.push({ 'hasFavicon': hasImage });
    if (description != null) mongoFilter.push({ '$or': [ {'description': {'$regex': description, '$options': 'i'}}, {'description.text': {'$regex': description, '$options': 'i'}}, { 'description.extra.text': { '$regex': description, '$options': 'i' } } ]});
    if (hasPlayerList != null) mongoFilter.push(hasPlayerList ? { 'players.sample': { '$exists': true, '$type': 'array', '$not': { '$size': 0 }}} : { '$exists': false });      
    if (seenAfter != null) mongoFilter.push({'lastSeen': { '$gte': seenAfter }});
    if (ipRange != null) {
      const [ip, range] = ipRange.split('/');
      if (range >= 32) {
        mongoFilter.push({ 'ip': ip });
      } else {
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

        mongoFilter.push({ 'ip': { '$regex': `^${octets[0]}\.${octets[1]}\.${octets[2]}\.${octets[3]}\$`, '$options': 'i' }});
      }
    }
    if (port != null) mongoFilter.push({ 'port': port });
    if (country != null) mongoFilter.push({ 'geo.country': country });
    if (org != null) mongoFilter.push({ 'org': { '$regex': org, '$options': 'i' }});
    if (cracked != null) mongoFilter.push({ 'cracked': cracked });
    if (whitelist != null) mongoFilter.push({ 'whitelist': whitelist });
    if (vanilla != null) {
      if (vanilla) {
        mongoFilter.push({ 'version.name': { '$regex': '^\\d+\\.\\d+$' }});
        mongoFilter.push({ 'hasForgeData': false });
      } else {
        mongoFilter.push({
          '$or': [
            {'version.name': { '$not': { '$regex': '^\\d+\\.\\d+$' }}},
            { 'hasForgeData': true }
          ]
        });
      }
    }
    mongoFilter = Object.keys(mongoFilter).length ? { $and: mongoFilter } : {};

    servers = (await (await fetch(`https://api.cornbread2100.com/servers?limit=10&skip=${currentEmbed}&query=${encodeURIComponent(JSON.stringify(mongoFilter))}${player == null ? '' : `&onlineplayers=["${player}"]`}`)).json());
    if (servers.length > 0) {
      var totalResults;
      (new Promise(async resolve => resolve(await (await fetch(`https://api.cornbread2100.com/count?query=${encodeURIComponent(JSON.stringify(mongoFilter))}${player == null ? '' : `&onlineplayers=["${player}"]`}`)).json()))).then(response => totalResults = response)

      var components = createListButtons(servers.length);
      var newEmbed = createList(servers, currentEmbed, 0, minimal);
      newEmbed.data.title = 'Counting...';
      await interaction.editReply({ content: '', embeds: [newEmbed], components });
      await (new Promise(resolve => {
        const waitForCount = setInterval(() => {
          if (totalResults != null) {
            clearInterval(waitForCount);
            resolve();
          }
        }, 100)
      }));
      
      components = createListButtons(totalResults);
      newEmbed = createList(servers, currentEmbed, totalResults, minimal);
      await interaction.editReply({ embeds: [newEmbed], components })
      // Times out the buttons after a few seconds of inactivity (set in buttonTimeout variable)
      lastButtonPress = new Date();
      const buttonTimeoutCheck = setInterval(async () => {
        if (timeSinceDate(lastButtonPress) >= buttonTimeout) {
          clearInterval(buttonTimeoutCheck);
          delete buttonCallbacks[nextResultID];
          delete buttonCallbacks[lastResultID];
          components[0].components[0].setDisabled(true);
          components[0].components[1].setDisabled(true);
          await interaction.editReply({ components });
        }
      }, 500);
    } else await interaction.editReply({ content: 'No matches could be found', embeds: [], components: [] }); 
  }
}
