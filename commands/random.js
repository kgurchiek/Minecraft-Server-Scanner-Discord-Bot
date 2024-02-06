// Imports
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, getVersion, POST } = require('../commonFunctions.js')
const buttonTimeout = 60;
const maxmind = require('maxmind');
var cityLookup;
var asnLookup;
(async () => {
  cityLookup = await maxmind.open('./GeoLite2-City.mmdb');
  asnLookup = await maxmind.open('./GeoLite2-ASN.mmdb');
})();

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
    .setTitle('Search Results')
    .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
    .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${server.ip}&port=${server.port}`)
    .addFields(
      { name: 'Result ' + (currentEmbed + 1) + '/' + totalResults, value: '​' },
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
  return newEmbed;
}

module.exports = {
  // Define 'random' command
  data: new SlashCommandBuilder()
    .setName('random')
	  .setDescription('Gets a random online Minecraft server'),
  async execute(interaction) {
    const user = interaction.user;
    var lastButtonPress = new Date();
    const oldPlayersID = `oldPlayers${interaction.user.id}`;
    const oldPlayersFilter = interaction => interaction.customId == oldPlayersID;
    const oldPlayersCollector = interaction.channel.createMessageComponentCollector({ filter: oldPlayersFilter });
    // Status message
    const interactionReplyMessage = await interaction.reply('Getting a server, please wait...');
    
    // Get a random server from the database
    const totalServers = await (await fetch(`https://api.cornbread2100.com/countServers?skip=${index}&query={"lastSeen":{"$gte":${Math.round(new Date().getTime() / 1000) - 3600}}}`)).json();
    var index = Math.floor((Math.random() * totalServers));
    const server = (await (await fetch(`https://api.cornbread2100.com/servers?limit=1&skip=${index}`, { 'lastSeen': { '$gte': Math.round(new Date().getTime() / 1000) - 3600 }})).json())[0];
    
    if (server == null) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('No recent servers found')
        .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
        .setDescription('This is a bug, please ping @cornbread2100 in the official support server (https://discord.gg/3u2fNRAMAN)')
        await interaction.editReply({ content: '', embeds: [embed] });
      return;
    }

    const hasOldPlayers = server.players.history != null && typeof server.players.history == 'object';
    var showingOldPlayers = false;

    var buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(oldPlayersID)
          .setLabel('Show Old Players')
          .setStyle(ButtonStyle.Primary)
      );
    
    var embed = createEmbed(server, index, totalServers);
    await interaction.editReply({ content:'', embeds: [embed], components: hasOldPlayers ? [buttons] : [] });

    oldPlayersCollector.on('collect', async interaction => {
      if (interaction.user.id != user.id) return interaction.reply({ content: 'That\'s another user\'s command, use /search to create your own', ephemeral: true });
      lastButtonPress = new Date();
      showingOldPlayers = !showingOldPlayers;
      buttons.components[0].data.label = showingOldPlayers ? 'Online Players' : 'Player History';
      if (showingOldPlayers) {
        var playersString = `${server.players.online}/${server.players.max}`;
        for (const player in server.players.history) playersString += `\n\`${player.replace(':', ' ')}\` <t:${server.players.history[player]}:${(new Date().getTime() / 1000) - server.players.history[player] > 86400 ? 'D' : 'R'}>`;
        embed.data.fields[5].value = playersString;
      }
      await interaction.update({ content: '', embeds: [embed], components: [buttons] });
    });
    
    
    // Times out the buttons after a few seconds of inactivity (set in buttonTimeout variable)
    async function buttonTimeoutCheck() {
      if (timeSinceDate(lastButtonPress) >= buttonTimeout) {
        var buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(oldPlayersID)
            .setLabel('Show Old Players')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
          );
        await interactionReplyMessage.edit({ components: [buttons] });
        
        oldPlayersCollector.stop();
      } else {
        setTimeout(function() { buttonTimeoutCheck() }, 500);
      }
    }
    if (hasOldPlayers) buttonTimeoutCheck();
  }
}