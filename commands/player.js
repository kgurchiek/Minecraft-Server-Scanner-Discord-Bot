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

// Exports an object with the parameters for the target server
module.exports = {
  data: new SlashCommandBuilder()
    .setName('player')
    .setDescription('Searches for servers a player has played on')
    .addIntegerOption(option =>
      option
        .setName('skip')
        .setDescription('Skips to a page of results'))
    .addStringOption(option =>
      option
        .setName('username')
        .setDescription('The username of the player'))
    .addStringOption(option =>
      option
        .setName('uuid')
        .setDescription('The uuid of the player')),
  async execute(interaction) {
    const interactReplyMessage = await interaction.reply({ content: 'Searching...', fetchReply: true });
    
    // Get arguments
    if (interaction.options.getInteger('skip') != null) currentEmbed = interaction.options.getInteger('skip') - 1;
    var username = interaction.options.getString('username');
    var uuid = interaction.options.getString('uuid');

    if (username == null && uuid == null) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .addFields({ name: 'User Error', value: 'Must enter a username or uuid' })
    }

    var argumentList = '**Checking database for player:**';
    if (username != null) argumentList += `\n**username:** ${username}`;
    if (uuid != null) argumentList += `\n**uuid:** ${uuid}`;
    await interactReplyMessage.edit(argumentList);

    const mongoFilter = {};
    if (username != null) mongoFilter.name = username;
    if (uuid != null) mongoFilter.uuid = uuid;

    const player = (await (await fetch(`https://api.cornbread2100.com/players?limit=1&query=${JSON.stringify(mongoFilter)}`)).json())[0];
    if (player == null || player.servers == null || Object.keys(players.servers).length == 0) return await interactReplyMessage.edit(`No data recorded for player \`${username == null ? uuid : username }\`.`);
    const servers = [];
    for (const server in player.servers) servers.push({ host: server.replaceAll('_', '.'), lastSeen: player.servers[server].lastSeen });
    servers.sort((a, b) => b.lastSeen - a.lastSeen);
    const embed = new EmbedBuilder()
      .setColor('#02a337')
      .setTitle(`${username == null ? uuid : username }'s History`)
      .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
    embed.data.description = '';
    for (const server of servers) embed.data.description += `${embed.data.description == '' ? '' : '\n'}**${server.host}** <t:${server.lastSeen}:${(new Date().getTime() / 1000) - server.lastSeen > 86400 ? 'D' : 'R'}>`;
    interactReplyMessage.edit({ content: '', embeds: [embed] });
  }
}