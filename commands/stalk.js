// Fetches dependencies and inits variables
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, getVersion, POST } = require('../commonFunctions.js');
const config = require('../config.json');
const languages = require('../languages.json');
const fs = require('fs');
const maxmind = require('maxmind');
var cityLookup;
var asnLookup;
(async () => {
  cityLookup = await maxmind.open('./GeoLite2-City.mmdb');
  asnLookup = await maxmind.open('./GeoLite2-ASN.mmdb');
})();

async function embed(ip, port, response, message) {
  const oldPlayersID = `oldPlayers${message.id}`;
  const oldPlayersFilter = interaction => interaction.customId == oldPlayersID;
  const oldPlayersCollector = message.channel.createMessageComponentCollector({ filter: oldPlayersFilter });
  var newEmbed = new EmbedBuilder()
    .setColor('#02a337')
    .setTitle('Ping Result')
    .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'})
    .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${ip}&port=${port}`)
    .addFields(
      { name: 'IP', value: ip },
      { name: 'Port', value: port.toString() },
      { name: 'Version', value: getVersion(response.version) + ` (${response.version.protocol})` },
      { name: 'Description', value: getDescription(response.description) }
    )
    .setTimestamp()

  var playersString = `${response.players.online}/${response.players.max}`;
  if (response.players.sample != null && Array.isArray(response.players.sample)) {
    var oldString;
    for (var i = 0; i < response.players.sample.length; i++) {
      oldString = playersString;
      playersString += `\n${response.players.sample[i].name}\n${response.players.sample[i].id}`;
      if (i + 1 < response.players.sample.length) playersString += '\n';
      if (playersString.length > 1024) {
        playersString = oldString;
        break;
      }
    }
  }
  newEmbed.addFields({ name: 'Players', value: playersString })
  await message.edit({ embeds: [newEmbed] });

  var location = await cityLookup.get(ip);
  newEmbed.addFields({ name: 'Country: ', value: location == null ? 'Unknown' : location.country == null ? `:flag_${location.registered_country.iso_code.toLowerCase()}: ${location.registered_country.names.en}` : `:flag_${location.country.iso_code.toLowerCase()}: ${location.country.names.en}` })
  var org = await asnLookup.get(ip);
  newEmbed.addFields({ name: 'Organization: ', value: org == null ? 'Unknown' : org.autonomous_system_organization });

  const auth = await (await fetch(`https://ping.cornbread2100.com/cracked/?ip=${ip}&port=${port}&protocol=${response.version.protocol}`)).text();
  newEmbed.addFields({ name: 'Auth', value: auth == 'true' ? 'Cracked' : auth == 'false' ? 'Premium' : 'Unknown' })
  await message.edit({ embeds: [newEmbed] });

  const document = await POST('https://api.cornbread2100.com/servers?limit=1', { ip: ip, port: port })
  if (document.length > 0 && document[0].players.sample != null) {
    var buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(oldPlayersID)
          .setLabel('Show Old Players')
          .setStyle(ButtonStyle.Primary)
      );
    await message.edit({ components: [buttons] });
  }

  oldPlayersCollector.on('collect', async interaction => {
    var buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(oldPlayersID)
          .setLabel('Show Old Players')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );

    var newEmbed = new EmbedBuilder()
      .setColor('#02a337')
      .setTitle('Ping Result')
      .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'})
      .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${ip}&port=${port}`)
      .addFields(
        { name: 'IP', value: ip },
        { name: 'Port', value: port.toString() },
        { name: 'Version', value: getVersion(response.version) + ` (${response.version.protocol})` },
        { name: 'Description', value: getDescription(response.description) }
      )
      .setTimestamp()

    const oldPlayers = document[0].players.sample == null ? [] : document[0].players.sample;
    for (var i = oldPlayers.length - 1; i >= 0; i--) {
      const player = oldPlayers[i];
      if (response.players.sample != null && Array.isArray(response.players.sample) && response.players.sample.some(p => p.name == player.name && p.id == player.id)) oldPlayers.splice(i, 1);
    }

    var playersString = `${response.players.online}/${response.players.max}`;
    var oldString;
    if (response.players.sample != null && Array.isArray(response.players.sample)) {
      for (const player of response.players.sample) {
        oldString = playersString;
        playersString += `\n${player.name} \`online\``;
        if (playersString.length > 1020 && i + 1 < response.players.sample.length || playersString.length > 1024) {
          playersString = oldString + '\n...';
          break;
        }
      }
    }

    for (const player of oldPlayers) {
      oldString = playersString;
      playersString += `\n${player.name} <t:${player.lastSeen}:R>`;
      if (playersString.length > 1020 && i + 1 < response.players.sample.length || playersString.length > 1024) {
        playersString = oldString + '\n...';
        break;
      }
    }

    newEmbed.addFields({ name: 'Players', value: playersString })

    var location = await cityLookup.get(ip);
    newEmbed.addFields({ name: 'Country: ', value: location == null ? 'Unknown' : location.country == null ? `:flag_${location.registered_country.iso_code.toLowerCase()}: ${location.registered_country.names.en}` : `:flag_${location.country.iso_code.toLowerCase()}: ${location.country.names.en}` })
    var org = await asnLookup.get(ip);
    newEmbed.addFields({ name: 'Organization: ', value: org == null ? 'Unknown' : org.autonomous_system_organization });

    const auth = await (await fetch(`https://ping.cornbread2100.com/cracked/?ip=${ip}&port=${port}&protocol=${response.version.protocol}`)).text();
    newEmbed.addFields({ name: 'Auth', value: auth == 'true' ? 'Cracked' : auth == 'false' ? 'Premium' : 'Unknown' })
    await interaction.update({ embeds: [newEmbed], components: [buttons] });
  })
}

// Exports an object with the parameters for the target server
module.exports = {
  data: new SlashCommandBuilder()
    .setName("stalk")
    .setDescription("Sends you a message when a user is playing the game")
    .addStringOption(option =>
      option
      .setName("username")
      .setDescription("Specifies the username (in MC) of person to stalk")
      .setRequired(true))
    .addBooleanOption(option =>
      option
      .setName('stalk')
      .setDescription('Set to false to stop stalking')),
  async execute(interaction) {
    // Status message
    await interaction.deferReply({ ephemeral: true });

    const pingList = getPingList();
    if (pingList[interaction.user.id] == null) pingList[interaction.user.id] = [];
    var newEmbed;
    if (interaction.options.getBoolean('stalk') == null ? true : interaction.options.getBoolean('stalk')) {
      pingList[interaction.user.id].push(interaction.options.getString('username'));

      newEmbed = new EmbedBuilder()
        .setColor("#02a337")
        .setTitle(`Stalking ${interaction.options.getString('username')}`)
        .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
        .addFields({ name: 'Success', value: `You will be notified when ${interaction.options.getString('username')} is playing on a server in the database.` })
    } else {
      pingList[interaction.user.id] = pingList[interaction.user.id].filter(username => username != interaction.options.getString('username'));

      newEmbed = new EmbedBuilder()
        .setColor("#02a337")
        .setTitle(`Stopped Stalking`)
        .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
        .addFields({ name: 'Success', value: `You've stopped stalking ${interaction.options.getString('username')}.` })
    }
    fs.writeFileSync('./data/stalk.json', JSON.stringify(pingList));
    await interaction.editReply({ embeds: [newEmbed] });
  }
};

function getPingList() {
  if (fs.existsSync('./data/stalk.json')) {
    return JSON.parse(fs.readFileSync('./data/stalk.json'));
  } else {
    return {};
  }
}

const players = {};
async function stalkCheck() {
  const { client } = require('../index.js');
  const pingList = getPingList();
  for (const user in pingList) {
    for (const player of pingList[user]) {
      if (players[player] == 'inactive') continue;
      const result = (await POST(`https://api.cornbread2100.com/servers?limit=1`, { 'players.sample': { '$exists': true, "$elemMatch": { "name": player }},  'lastSeen': { '$gte': Math.round(new Date().getTime() / 1000) - 600 }}))[0];
      if (result == null) {
        players[player] = 'inactive';
        continue;
      }
      if (players[player] == null || (result.ip != players[player].ip && result.port != players[player].port)) {
        players[player] = result;
        await client.users.fetch(user)
        embed(result.ip, result.port, result, await client.users.cache.get(user).send({ content: `<@${user}>, ${player} is online.` }));
      }
    }
  }
  if (Object.keys(players).length > 0) for (const player in players) if (players[player] == 'inactive') players[player] = null;
}
stalkCheck();
setInterval(stalkCheck, 600000); // every 10 minutes
