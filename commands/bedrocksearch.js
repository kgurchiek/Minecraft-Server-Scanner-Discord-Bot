// Fectches dependencies and inits variables
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, thousandsSeparators, cleanIp, displayPlayers } = require('../commonFunctions.js');
const countryCodes = require('../countryCodes.json');
const orgs = require('../orgs.json');
const config = require('../config.json');
const buttonTimeout = 300; // In seconds

const shortenString = (string, length) => (string.length > length ? `${string.slice(0, length - 3)}...` : string);

function createEmbed(server) {
  let description;
  let description2;
  try { description = JSON.parse(server.rawDescription);
  } catch (err) { description = server.description; }
  try { description2 = JSON.parse(server.rawDescription2);
  } catch (err) { description2 = server.description2; }
  const newEmbed = new EmbedBuilder()
    .setColor('#02a337')
    .setTitle(`${cleanIp(server.ip)}${server.port == 25565 ? '' : `:${server.port}`}`)
    .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
    .addFields(
      { name: 'IP', value: cleanIp(parseInt(server.ip)) },
      { name: 'Port', value: String(server.port) },
      { name: 'Version', value: `${server.version.name} (${server.version.protocol})` },
      { name: 'Description', value: `${getDescription(description)}\n\n${getDescription(description2)}` || '​' },
      { name: 'Players', value: displayPlayers(server) },
      { name: 'Game Mode', value: `${server.gamemode.name} (${server.gamemode.id})` },
      { name: 'Education Edition', value: String(server.education) },
      { name: 'Discovered', value: `<t:${server.discovered}:${(new Date().getTime() / 1000) - server.discovered > 86400 ? 'D' : 'R'}>`},
      { name: 'Last Seen', value: `<t:${server.lastSeen}:${(new Date().getTime() / 1000) - server.lastSeen > 86400 ? 'D' : 'R'}>` },
      { name: 'Country', value: `${server.geo.country == null ? 'Unknown' : `:flag_${server.geo.country.toLowerCase()}: ${server.geo.country}`}` },
      { name: 'Organization', value: server.org == null ? 'Unknown' : server.org }
    )
    .setTimestamp();

  return newEmbed;
}

function createButtons(server) {
  const buttons = new ActionRowBuilder()
  buttons.addComponents(
    new ButtonBuilder()
      .setLabel('API')
      .setStyle(ButtonStyle.Link)
      .setURL(`${config.displayApi || config.api}/bedrockServers?ip=${server.ip}&port=${server.port}`)
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
    description += `${' '.repeat(longest.server - displayIp(servers[i]).length)}\``;
    if (!minimal) description += ` \`${displayVersion(servers[i].version)}${' '.repeat(longest.version - displayVersion(servers[i].version).length)}\` <t:${servers[i].lastSeen}:R>`;
  }

  embed.setDescription(description);
  return embed;
}

// Exports an object with the parameters for the target server
module.exports = {
  data: new SlashCommandBuilder()
    .setName('bedrocksearch')
    .setDescription('Searches the database for a Bedrock Edition server with specific properties')
    .addBooleanOption(option =>
      option
        .setName('minimal')
        .setDescription('Only shows ip and port in preview (recommended for mobile users)'))
    .addStringOption(option =>
      option
        .setName('sort')
        .setDescription('How to sort results')
        .addChoices(
          { name: 'None', value: 'none' },
          { name: 'Last Ping (new to old)', value: 'lastSeen:d' },
          { name: 'Last Ping (old to new)', value: 'lastSeen:a' },
          { name: 'Discovery Date (new to old)', value: 'discovered:d' },
          { name: 'Discovery Date (old to new)', value: 'discovered:a' }
        ))
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
        .setName('version')
        .setDescription('The version of the server'))
    .addIntegerOption(option =>
      option
        .setName('protocol')
        .setDescription('The protocol version of the server'))
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('The description of the server'))
    .addIntegerOption(option =>
      option
        .setName('seenafter')
        .setDescription('The oldest time a server can be last seen (this doesn\'t mean it\'s offline, use /help for more info)')
        .setAutocomplete(true))
    .addStringOption(option =>
      option
        .setName('iprange')
        .setDescription('The ip subnet a server\'s ip has to be within'))
    .addStringOption(option =>
      option
        .setName('excluderange')
        .setDescription('The ip subnet a server\'s ip cannot be within'))
    .addIntegerOption(option =>
      option
        .setName('port')
        .setDescription('The port the server is hosted on'))
    .addStringOption(option =>
      option
        .setName('gamemode')
        .setDescription('The default game mode of the server')
        .addChoices(
          { name: 'Survival', value: 'survival' },
          { name: 'Creative', value: 'creative' },
          { name: 'Adventure', value: 'adventure' },
          { name: 'Spectator', value: 'spectator' }
        )
    )
    .addStringOption(option =>
      option
        .setName('country')
        .setDescription('The country the server is hosted in')
        .setAutocomplete(true))
    .addStringOption(option =>
      option
        .setName('org')
        .setDescription('The organization hosting the server')
        .setAutocomplete(true)),
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
        await interaction.respond(orgs.filter(choice => choice.toLowerCase().includes(focusedValue.value.toLowerCase())).splice(0, 25).map(choice => ({ name: choice, value: `%${choice}%` })));
        break;
    }
  },
  async buttonHandler(interaction) {
    const [command, id, content] = interaction.customId.split('-');
    switch (id) {
      case 'info': {
        const [ip, port] = content.split(':');
        const server = (await (await fetch(`${config.api}/bedrockServers?ip=${ip}&port=${port}`)).json())[0];
        await interaction.reply({ embeds: [createEmbed(server)], components: [createButtons(server)] });
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
    let lastButtonPress = null;

    function createListButtons(totalResults) {
      let buttons;
      let infoButtons;
      
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
        if (`${config.api}/bedrockServers?limit=10&skip=${currentEmbed}&${args}`.length <= 512) {
          buttons.addComponents(
            new ButtonBuilder()
            .setLabel('API')
            .setStyle(ButtonStyle.Link)
            .setURL(`${config.displayApi || config.api}/bedrockServers?limit=10&skip=${currentEmbed}&${args}`)
          )
        }

        infoButtons = [];
        for (let i = 0; i < Math.min(totalResults - currentEmbed, 10); i += 5) {
          let row = new ActionRowBuilder();
          for (let j = 0; j < Math.min(totalResults - currentEmbed - i, 5); j++) {
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`bedrocksearch-info-${servers[i + j].ip}:${servers[i + j].port}`)
                .setLabel(String(i + j + 1))
                .setStyle(ButtonStyle.Primary)
            )
          }
          infoButtons.push(row)
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
          servers = (await (await fetch(`${config.api}/bedrockServers?limit=10&skip=${currentEmbed}&${args}`)).json());
          updateButtons();
          newEmbed = createList(servers, currentEmbed, totalResults, minimal);
          await interaction.editReply({ embeds: [newEmbed], components: [buttons].concat(infoButtons) });
        }

        // Event listener for 'Next Page' button
        buttonCallbacks[nextResultID] = async (interaction) => {
          if (interaction.user.id != user.id) return interaction.reply({ content: 'That\'s another user\'s command, use /search to create your own', ephemeral: true });
          await interaction.deferUpdate();
          lastButtonPress = new Date();
          currentEmbed += 10;
          if (currentEmbed >= totalResults) currentEmbed = 0;
          servers = (await (await fetch(`${config.api}/bedrockServers?limit=10&skip=${currentEmbed}&${args}`)).json());
          updateButtons();
          newEmbed = createList(servers, currentEmbed, totalResults, minimal);
          await interaction.editReply({ embeds: [newEmbed], components: [buttons].concat(infoButtons) });
        }
      }
    
      return [buttons].concat(infoButtons);
    }
    
    // Get arguments
    let currentEmbed = (interaction.options.getInteger('page') || 1) - 1;
    let playerCount;
    let minOnline;
    let maxOnline;
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
    let minimal = interaction.options.getBoolean('minimal');
    let sort = interaction.options.getString('sort') || 'lastSeen:d';
    let playerCap = interaction.options.getInteger('playercap');
    let isFull = interaction.options.getBoolean('isfull');
    let version = interaction.options.getString('version');
    let protocol = interaction.options.getInteger('protocol');
    let description = interaction.options.getString('description');
    let seenAfter = interaction.options.getInteger('seenafter');
    let ipRange = interaction.options.getString('iprange');
    let excludeRange = interaction.options.getString('excluderange');
    let port = interaction.options.getInteger('port');
    let gamemode = interaction.options.getString('gamemode');
    let country = interaction.options.getString('country');
    let org = interaction.options.getString('org');

    let argumentList = 'Searching...';
    argumentList += `\n- **${sort == 'none' ? 'not sorted' : `sorted by ${{ 'lastSeen': 'Last Ping', 'discovered': 'Dicovery Date' }[sort.split(':')[0]]} (${{ 'a': 'ascending', 'd': 'descending' }[sort.split(':')[1]]})`}**`;
    if (playerCount != null) argumentList += `\n- **playercount:** ${playerCount}`;
    if (playerCap != null) argumentList += `\n- **playercap:** ${playerCap}`;
    if (isFull != null) argumentList += `\n- **${isFull ? 'is' : 'not'} full**`;
    if (version != null) argumentList += `\n- **version:** ${version}`;
    if (protocol != null) argumentList += `\n- **protocol:** ${protocol}`;
    if (description != null) argumentList += `\n- **description:** ${description}`;
    if (seenAfter != null) argumentList += `\n- **seenafter: **<t:${seenAfter}:f>`;
    if (ipRange != null) argumentList += `\n- **iprange: **${ipRange}`;
    if (excludeRange != null) argumentList += `\n- **excluderange: **${excludeRange}`;
    if (port != null) argumentList += `\n- **port: **${port}`;
    if (gamemode != null) argumentList += `\n- **gamemode: **${gamemode}`;
    if (country != null) argumentList += `\n- **country: **:flag_${country.toLowerCase()}: ${country}`;
    if (org != null) argumentList += `\n- **org: **${org}`;

    await interaction.reply(argumentList);

    let args = new URLSearchParams();
    if (sort != 'none') {
      args.append('sort', sort.split(':')[0]);
      args.append('descending', sort.split(':')[1] == 'd'); 
    }
    if (minOnline == maxOnline) { if (minOnline != null) args.append('playerCount', minOnline); }
    else {
      if (minOnline != null) args.append('minPlayers', minOnline);
      if (maxOnline != null) args.append('maxPlayers', maxOnline);
    }
    if (playerCap != null) args.append('playerLimit', playerCap);
    if (isFull != null) args.append('full', isFull);
    if (version != null) args.append('version', version);
    if (protocol != null) args.append('protocol', protocol);
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
      if (quotes.length > 0) args.append('description', `%${quotes.join('%')}%`);
      if (segments.filter((a, i) => i % 2 == 0 || !(i != segments.length - 1 || segments.length % 2 == 1)).join('').length > 0) args.append('description', segments.join(''));
    }
    if (seenAfter != null) args.append('seenAfter', seenAfter);
    if (ipRange != null) {
      let minIp = [];
      let maxIp = [];
      for (let range of ipRange.split(',')) {
        let [ip, subnet] = range.trim().split('/');
        ip = ip.split('.').reverse().map((a, i) => parseInt(a) * 256**i).reduce((a, b) => a + b, 0);
        if (subnet == null || subnet >= 32) args.append('ip', ip);
        else {
          minIp.push((ip & ~((1 << (32 - subnet)) - 1)) >>> 0);
          maxIp.push((ip | ((1 << (32 - subnet)) - 1)) >>> 0);
        }
      }
      if (minIp.length > 0) args.append('minIp', JSON.stringify(minIp));
      if (maxIp.length > 0) args.append('maxIp', JSON.stringify(maxIp));
    }
    if (excludeRange != null) {
      for (let range of excludeRange.split(',')) {
        let [ip, subnet] = range.split('/');
        ip = ip.split('.').reverse().map((a, i) => parseInt(a) * 256**i).reduce((a, b) => a + b, 0);
        if (subnet == null) subnet = 32;
        let excludeMinIp = (ip & ~((1 << (32 - subnet)) - 1)) >>> 0;
        let excludeMaxIp = (ip | ((1 << (32 - subnet)) - 1)) >>> 0;
        args.append('minIp', JSON.stringify([excludeMaxIp <= 0 ? null : 0, excludeMaxIp >= 4294967295 ? null : excludeMaxIp + 1].filter(a => a != null)));
        args.append('maxIp', JSON.stringify([excludeMaxIp <= 0 ? null : excludeMinIp - 1].filter(a => a != null)));
      }
    }
    if (port != null) args.append('port', port);
    if (gamemode != null) args.append('gamemode', gamemode);
    if (country != null) args.append('country', country);
    if (org != null) args.append('org', org);
    
    servers = (await (await fetch(`${config.api}/bedrockServers?limit=10&skip=${currentEmbed}&${args}`)).json());
    if (servers.length > 0) {
      let totalResults;
      if (servers.length == 10) (new Promise(async resolve => resolve(await (await fetch(`${config.api}/bedrockCount?${args}`)).json()))).then(response => totalResults = response);
      else totalResults = servers.length;

      let components = createListButtons(servers.length);
      let newEmbed = createList(servers, currentEmbed, 0, minimal);
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
    } else await interaction.editReply({ content: '', embeds: [new EmbedBuilder().setColor('#02a337').setTitle('No matches could be found')], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('API').setStyle(ButtonStyle.Link).setURL(`${config.displayApi || config.api}/bedrockServers?limit=10&skip=${currentEmbed}&${args}`))] }); 
  }
}
