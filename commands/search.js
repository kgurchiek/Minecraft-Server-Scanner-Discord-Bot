// Fectches dependencies and inits variables
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, thousandsSeparators, cleanIp, displayPlayers } = require('../commonFunctions.js');
const countryCodes = require('../countryCodes.json');
const orgs = require('../orgs.json');
const config = require('../config.json');
const buttonTimeout = 300; // In seconds

const shortenString = (string, length) => (string.length > length ? `${string.slice(0, length - 3)}...` : string);

function createEmbed(server, showingOldPlayers = false, loadingPlayers = false) {
  let description;
  try {
    description = JSON.parse(server.rawDescription);
  } catch (err) {
    description = server.description;
  }
  const newEmbed = new EmbedBuilder()
    .setColor('#02a337')
    .setTitle(`${cleanIp(server.ip)}${server.port == 25565 ? '' : `:${server.port}`}`)
    .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
    .addFields(
      { name: 'IP', value: cleanIp(parseInt(server.ip)) },
      { name: 'Port', value: String(server.port) },
      { name: 'Version', value: `${server.version.name} (${server.version.protocol})` },
      { name: 'Description', value: getDescription(description) },
      { name: 'Players', value: displayPlayers(server) },
      { name: 'Discovered', value: `<t:${server.discovered}:${(new Date().getTime() / 1000) - server.discovered > 86400 ? 'D' : 'R'}>`},
      { name: 'Last Seen', value: `<t:${server.lastSeen}:${(new Date().getTime() / 1000) - server.lastSeen > 86400 ? 'D' : 'R'}>` },
      { name: 'Country: ', value: `${server.geo.country == null ? 'Unknown' : `:flag_${server.geo.country.toLowerCase()}: ${server.geo.country}`}` },
      { name: 'Organization: ', value: server.org == null ? 'Unknown' : server.org },
      { name: 'Auth', value: server.cracked == true ? 'Cracked' : server.cracked == false ? 'Premium' : 'Unknown' },
      { name: 'Whitelist', value: server.whitelisted == true ? 'Enabled' : server.whitelisted == false ? 'Disabled' : 'Unknown' }
    )
    .setTimestamp();

  return newEmbed;
}

function createButtons(server, showingOldPlayers = false, loading = false) {
  const buttons = new ActionRowBuilder()
  if (showingOldPlayers != null || server.players.hasPlayerSample) {
    buttons.addComponents(
      new ButtonBuilder()
        .setLabel(loading ? 'Loading...' : showingOldPlayers == null ? 'Show Players' : showingOldPlayers ? 'Online Players' : 'Player History')
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`search-${showingOldPlayers ? 'online' : 'history'}-${server.ip}:${server.port}`)
        .setDisabled(loading)
    )
  }
  buttons.addComponents(
    new ButtonBuilder()
      .setLabel('API')
      .setStyle(ButtonStyle.Link)
      .setURL(`${config.api}/servers?ip=${server.ip}&port=${server.port}`)
  )
  return buttons;
}

const displayIp = (server) => `${cleanIp(parseInt(server.ip))}${server.port == 25565 ? '' : `:${server.port}`}`;
const displayVersion = (version) => `${shortenString(String(version?.name), 19)} (${version?.protocol})`;

function createList(servers, currentEmbed, totalResults, minimal) {
  const embed = new EmbedBuilder()
    .setColor('#02a337')
    .setTitle(`Results ${thousandsSeparators(currentEmbed + 1)}-${thousandsSeparators(currentEmbed + servers.length)}/${thousandsSeparators(totalResults)}`)
    .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
    .setTimestamp();
  
  let description = '';
  let longest = {
    server: displayIp(servers[0]).length,
    version: displayVersion(servers[0].version).length
  }
  for (let i = 1; i < servers.length; i++) {
    if (displayIp(servers[i]).length > longest.server) longest.server = displayIp(servers[i]).length;
    if (displayVersion(servers[i].version).length > longest.version) longest.version = displayVersion(servers[i].version).length;
  }
  
  for (let i = 0; i < servers.length; i++) {
    description += `${i == 0 ? '' : '\n'}${i + 1}. ${minimal ? '' : (servers[i].geo?.country == null ? '❔ ' : `:flag_${servers[i].geo.country.toLowerCase()}: `)}`;
    description += `\`${displayIp(servers[i])}`;
    description += `${' '.repeat(longest.server - displayIp(servers[i]).length)}`;
    if (!minimal) description += `\` \`${displayVersion(servers[i].version)}${' '.repeat(longest.version - displayVersion(servers[i].version).length)}\` <t:${servers[i].lastSeen}:R>`;
  }

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
        .setDescription('The version of the server'))
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
        .setDescription('The description of the server'))
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
        .setName('whitelisted')
        .setDescription('Whether or not the server has a whitelisted'))
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
      case 'info': {
        const [ip, port] = content.split(':');
        const server = (await (await fetch(`${config.api}/servers?ip=${ip}&port=${port}`)).json())[0];
        await interaction.reply({ embeds: [createEmbed(server)], components: [createButtons(server)] });
        break;
      }
      case 'history': {
        const [ip, port] = content.split(':');
        const embed = interaction.message.embeds[0];
        embed.data.fields[4].value = `${embed.data.fields[4].value.split('\n')[0]}\nLoading Players...`;
        await interaction.update({ embeds: [embed], components: [createButtons({ ip, port }, true, true)] });
        const playerList = (await (await fetch(`${config.api}/playerHistory?ip=${ip}&port=${port}`)).json());
        playerList.sort((a, b) => b.lastSession - a.lastSession);
        let playerCounts = embed.data.fields[4].value.split('\n')[0];
        embed.data.fields[4].value = displayPlayers({ players: { online: playerCounts.split('/')[0], max: playerCounts.split('/')[1] }, lastSeen: embed.data.fields[6].value.split(':')[1] }, playerList, true);
        await interaction.editReply({ embeds: [embed], components: [createButtons({ ip, port }, true)] });
        break;
      }
      case 'online' : {
        const [ip, port] = content.split(':');
        const embed = interaction.message.embeds[0];
        embed.data.fields[4].value = `${embed.data.fields[4].value.split('\n')[0]}\nLoading Players...`;
        await interaction.update({ embeds: [embed], components: [createButtons({ ip, port }, false, true)] });
        const playerList = (await (await fetch(`${config.api}/playerHistory?ip=${ip}&port=${port}`)).json());
        playerList.sort((a, b) => b.lastSession - a.lastSession);
        let playerCounts = embed.data.fields[4].value.split('\n')[0];
        embed.data.fields[4].value = displayPlayers({ players: { online: playerCounts.split('/')[0], max: playerCounts.split('/')[1] }}, playerList, false);
        await interaction.editReply({ embeds: [embed], components: [createButtons({ ip, port }, false)] });
        break;
      }
    }
  },
  async execute(interaction, buttonCallbacks) {
    const user = interaction.user;

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
        if (`${config.api}/servers?limit=10&skip=${currentEmbed}&${args}`.length <= 512) {
          buttons.addComponents(
            new ButtonBuilder()
            .setLabel('API')
            .setStyle(ButtonStyle.Link)
            .setURL(`${config.api}/servers?limit=10&skip=${currentEmbed}&${args}`)
          )
        }

        infoButtons = new ActionRowBuilder();
        for (let i = 0; i < (totalResults - currentEmbed < 5 ? totalResults - currentEmbed : 5); i++) {
          infoButtons.addComponents(
            new ButtonBuilder()
              .setCustomId(`search-info-${servers[i].ip}:${servers[i].port}`)
              .setLabel(String(i + 1))
              .setStyle(ButtonStyle.Primary)
          )
        }
        infoButtons2 = new ActionRowBuilder();
        for (let i = 5; i < (totalResults - currentEmbed < 10 ? totalResults - currentEmbed : 10); i++) {
          infoButtons2.addComponents(
            new ButtonBuilder()
              .setCustomId(`search-info-${servers[i].ip}:${servers[i].port}`)
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
          servers = (await (await fetch(`${config.api}/servers?limit=10&skip=${currentEmbed}&${args}`)).json());
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
          servers = (await (await fetch(`${config.api}/servers?limit=10&skip=${currentEmbed}&${args}`)).json());
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
      else if (playerCount.startsWith('>')) minOnline = parseInt(playerCount.substring(1)) + 1;
      else if (playerCount.startsWith('<')) maxOnline = parseInt(playerCount.substring(1)) - 1;
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
        await interaction.reply({ content: '', embeds: [newEmbed] });
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
    var whitelisted = interaction.options.getBoolean('whitelisted');
    var vanilla = interaction.options.getBoolean('vanilla');

    var argumentList = 'Searching...';
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
    if (whitelisted != null) argumentList += `\n**Whitelisted ${whitelisted ? 'Enabled' : 'Disabled'}**`;
    if (vanilla != null) argumentList += `\n**${vanilla ? 'Vanilla' : 'Not Vanilla'}**`;

    await interaction.reply(argumentList);

    let args = new URLSearchParams();
    if (minOnline == maxOnline) { if (minOnline != null) args.set('playerCount', minOnline); }
    else {
      if (minOnline != null) args.set('minPlayers', minOnline);
      if (maxOnline != null) args.set('maxPlayers', maxOnline);
    }
    if (playerCap != null) args.set('playerLimit', playerCap);
    if (isFull != null) args.set('full', isFull);
    if (player != null) args.set('onlinePlayer', player);
    if (playerHistory != null) args.set('playerHistory', playerHistory);
    if (version != null) args.set('version', version);
    if (protocol != null) args.set('protocol', protocol);
    if (hasImage != null) args.set('hasFavicon', hasImage);
    if (description != null) {
      let segments = [''];
      let escaped = false;
      for (let i = 0; i < description.length; i++) {
        if (!escaped) {
          if (description[i] == '\\') {
            escaped = true;
            continue;
          }
          if (description[i] == '"') {
            segments.push('');
            continue;
          }
        }
        segments[segments.length - 1] += description[i];
        escaped = false;
      }
      let quotes = segments.filter((a, i) => i % 2 == 1 && (i != segments.length - 1 || segments.length % 2 == 1));
      if (quotes.length > 0) args.set('description', `%${quotes.join('%')}%`);
      if (segments.filter((a, i) => i % 2 == 0 || !(i != segments.length - 1 || segments.length % 2 == 1)).join('').length > 0) args.set('descriptionVector', segments.join(''));
    }
    if (hasPlayerList != null) args.set('hasPlayerSample', hasPlayerList);      
    if (seenAfter != null) args.set('seenAfter', seenAfter);
    if (ipRange != null) {
      let [ip, subnet] = ipRange.split('/');
      if (subnet == null || subnet >= 32) args.set('ip', ip);
      else {
        ip = ip.split('.').reverse().map((a, i) => parseInt(a) * 256**i).reduce((a, b) => a + b, 0);
        let minIp = (ip & ~((1 << (32 - subnet)) - 1)) >>> 0;
        let maxIp = (ip | ((1 << (32 - subnet)) - 1)) >>> 0;
        args.set('minIp', minIp);
        args.set('maxIp', maxIp)
      }
    }
    if (port != null) args.set('port', port);
    if (country != null) args.set('country', country);
    if (org != null) args.set('org', org);
    if (cracked != null) args.set('cracked', cracked);
    if (whitelisted != null) args.set('whitelisted', whitelisted);
    if (vanilla != null) args.set('vanilla', vanilla);
    
    servers = (await (await fetch(`${config.api}/servers?limit=10&skip=${currentEmbed}&${args}`)).json());
    if (servers.length > 0) {
      var totalResults;
      (new Promise(async resolve => resolve(await (await fetch(`${config.api}/count?${args}`)).json()))).then(response => totalResults = response)

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
      lastButtonPress = Date.now();
      const buttonTimeoutCheck = setInterval(async () => {
        if (Date.now() / 1000 - lastButtonPress / 1000 >= buttonTimeout) {
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
