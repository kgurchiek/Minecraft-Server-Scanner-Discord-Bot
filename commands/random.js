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

module.exports = {
  // Define 'random' command
  data: new SlashCommandBuilder()
    .setName('random')
	  .setDescription('Gets a random online Minecraft server'),
  async execute(interaction) {
    var lastButtonPress = new Date();
    const oldPlayersID = `oldPlayers${interaction.user.id}`;
    const oldPlayersFilter = interaction => interaction.customId == oldPlayersID;
    const oldPlayersCollector = interaction.channel.createMessageComponentCollector({ filter: oldPlayersFilter });
    // Status message
    const interactionReplyMessage = await interaction.reply("Getting a server, please wait...");
    
    // Get a random server from the database
    const totalServers = parseInt(await POST('https://api.cornbread2100.com/countServers', { 'lastSeen': { '$gte': Math.round(new Date().getTime() / 1000) - 3600 }}));
    var index = Math.floor((Math.random() * totalServers));
    const server = (await POST(`https://api.cornbread2100.com/servers?limit=1&skip=${index}`, { 'lastSeen': { '$gte': Math.round(new Date().getTime() / 1000) - 3600 }}))[0];
    
    var hasOldPlayers = false;
    if (server.players.sample != null && Array.isArray(server.players.sample)) {
      for (const player of server.players.sample) {
        if (player.lastSeen != server.lastSeen) {
          hasOldPlayers = true;
          break;
        }
      }
    }

    var buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(oldPlayersID)
          .setLabel('Show Old Players')
          .setStyle(ButtonStyle.Primary)
      );
    
    var newEmbed = new EmbedBuilder()
      .setColor("#02a337")
      .setTitle('Random Server')
      .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
      .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${server.ip}&port=${server.port}`)
      .addFields(
        { name:  `Server ${index}/${totalServers}`, value: ' ' },
        { name: 'IP', value: server.ip },
        { name: 'Port', value: String(server.port) },
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

    newEmbed.addFields({ name: 'Players', value: playersString })
    await interactionReplyMessage.edit({ content:'', embeds: [newEmbed], components: hasOldPlayers ? [buttons] : [] });

    var location = await cityLookup.get(server.ip);
    newEmbed.addFields({ name: 'Country: ', value: location == null ? 'Unknown' : location.country == null ? `:flag_${location.registered_country.iso_code.toLowerCase()}: ${location.registered_country.names.en}` : `:flag_${location.country.iso_code.toLowerCase()}: ${location.country.names.en}` })
    var org = await asnLookup.get(server.ip);
    newEmbed.addFields({ name: 'Organization: ', value: org == null ? 'Unknown' : org.autonomous_system_organization });

    const auth = await (await fetch(`https://ping.cornbread2100.com/cracked/?ip=${server.ip}&port=${server.port}&protocol=${server.version.protocol}`)).text();
    newEmbed.addFields({ name: 'Auth', value: auth == 'true' ? 'Cracked' : auth == 'false' ? 'Premium' : 'Unknown' })
    await interactionReplyMessage.edit({ content:'', embeds: [newEmbed], components: hasOldPlayers ? [buttons] : [] });

    oldPlayersCollector.on('collect', async interaction => {
      lastButtonPress = new Date();
      var newEmbed = new EmbedBuilder()
        .setColor("#02a337")
        .setTitle('Random Server')
        .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
        .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${server.ip}&port=${server.port}`)
        .addFields(
          { name:  `Server ${index}/${totalServers}`, value: ' ' },
          { name: 'IP', value: server.ip },
          { name: 'Port', value: String(server.port) },
          { name: 'Version', value: getVersion(server.version) + ` (${server.version.protocol})` },
          { name: 'Description', value: getDescription(server.description) }
        )
        .setTimestamp()

      var buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(oldPlayersID)
            .setLabel('Show Old Players')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );

      var playersString = `${server.players.online}/${server.players.max}`;
      if (server.players.sample != null) {
        var oldString;
        for (var i = 0; i < server.players.sample.length; i++) {
          oldString = playersString;
          playersString += `\n${server.players.sample[i].name} ${server.players.sample[i].lastSeen == server.lastSeen ? '`online`' : '<t:' + server.players.sample[i].lastSeen + ':R>'}`;
          if (i + 1 < server.players.sample.length) playersString += '\n';
          if (playersString.length > 1020 && i + 1 < server.players.sample.length || playersString.length > 1024) {
            playersString = oldString + '\n...';
            break;
          }
        }
      }
      newEmbed.addFields({ name: 'Players', value: playersString })

      var location = await cityLookup.get(server.ip);
      newEmbed.addFields({ name: 'Country: ', value: location == null ? 'Unknown' : location.country == null ? `:flag_${location.registered_country.iso_code.toLowerCase()}: ${location.registered_country.names.en}` : `:flag_${location.country.iso_code.toLowerCase()}: ${location.country.names.en}` })
      var org = await asnLookup.get(server.ip);
      newEmbed.addFields({ name: 'Organization: ', value: org == null ? 'Unknown' : org.autonomous_system_organization });

      const auth = await (await fetch(`https://ping.cornbread2100.com/cracked/?ip=${server.ip}&port=${server.port}&protocol=${server.version.protocol}`)).text();
      newEmbed.addFields({ name: 'Auth', value: auth == 'true' ? 'Cracked' : auth == 'false' ? 'Premium' : 'Unknown' })
      await interaction.update({ content:'', embeds: [newEmbed], components: hasOldPlayers ? [buttons] : [] });
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
  },
}
