// Fetches dependencies and inits variables
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, getVersion } = require('../commonFunctions.js');
const config = require('../config.json');
const languages = require('../languages.json');
const fs = require('fs');

function createEmbed(server, player) {
  const newEmbed = new EmbedBuilder()
    .setColor('#02a337')
    .setTitle(`${player}'s Server`)
    .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
    .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${server.ip}&port=${server.port}`)
    .addFields(
      { name: 'IP', value: server.ip },
      { name: 'Port', value: String(server.port) },
      { name: 'Version', value: `${getVersion(server.version)} (${server.version.protocol})` },
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
  newEmbed.addFields({ name: 'Players', value: playersString });
  const discoverDate = parseInt(server._id.slice(0, 8), 16);
  newEmbed.addFields(
    { name: 'Discovered', value: `<t:${discoverDate}:${(new Date().getTime() / 1000) - discoverDate > 86400 ? 'D' : 'R'}>`},
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
    .setName('stalk')
    .setDescription('Sends you a message when a user is playing the game')
    .addStringOption(option =>
      option
      .setName('username')
      .setDescription('Specifies the username of person to stalk')
      .setRequired(true))
    .addBooleanOption(option =>
      option
      .setName('stalk')
      .setDescription('Set to false to stop stalking')),
  async execute(interaction) {
    // Status message
    await interaction.deferReply({ ephemeral: true });

    if (interaction.guild.id === "1005132317297221785" && interaction.channel.id !== "1097756128345063504") { // if it's the official MC server scanner discord server, but not the right channel (#commands)
      var errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .addFields({ name: 'Error', value: 'Please use <#1097756128345063504> for commands.' })
	    interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    } else {

      const pingList = getPingList();
      if (pingList[interaction.user.id] == null) pingList[interaction.user.id] = [];
      var newEmbed;
      if (interaction.options.getBoolean('stalk') == null ? true : interaction.options.getBoolean('stalk')) {
       pingList[interaction.user.id].push(interaction.options.getString('username'));

        newEmbed = new EmbedBuilder()
          .setColor('#02a337')
          .setTitle(`Stalking ${interaction.options.getString('username')}`)
          .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
          .setDescription(`You will be notified when ${interaction.options.getString('username')} is playing on a server in the database.` )
      } else {
        pingList[interaction.user.id] = pingList[interaction.user.id].filter(username => username != interaction.options.getString('username'));

        newEmbed = new EmbedBuilder()
          .setColor('#02a337')
          .setTitle(`Stopped Stalking`)
          .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
          .setDescription(`You've stopped stalking ${interaction.options.getString('username')}.`)
      }
      fs.writeFileSync('./data/stalk.json', JSON.stringify(pingList));
      await interaction.editReply({ embeds: [newEmbed] });
    }
  }
}

function getPingList() {
  if (fs.existsSync('./data/stalk.json')) {
    return JSON.parse(fs.readFileSync('./data/stalk.json'));
  } else {
    return {};
  }
}

const players = {};
async function stalkCheck() {
  const { client } = require('../bot.js');
  const pingList = getPingList();
  for (const user in pingList) {
    for (const player of pingList[user]) {
      const resultCount = await (await fetch(`https://api.cornbread2100.com/countServers?query=${JSON.stringify({ 'players.sample.name': player, lastSeen: { $gte: Math.floor(new Date().getTime() / 1000) - 600}})}&onlineplayers=["${player}"]`)).json();
      if (resultCount == 0) continue;
      const result = (await (await fetch(`https://api.cornbread2100.com/servers?query=${JSON.stringify({ 'players.sample.name': player, lastSeen: { $gte: Math.floor(new Date().getTime() / 1000) - 300}})}&onlineplayers=["${player}"]`)).json())[0];
      if (players[player] == null || (result.ip != players[player].ip && result.port != players[player].port && result.lastSeen < players[player].lastSeen)) {
        players[player] = result;
        newEmbed = createEmbed(result, player);
        await client.users.fetch(user)
        await client.users.cache.get(user).send({ content: `<@${user}> ${player} is online.`, embeds: [newEmbed]});
      }
    }
  }
}
stalkCheck();
setInterval(stalkCheck, 300000); // every 5 minutes
