// Fectches dependencies and inits variables
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, getVersion } = require('../commonFunctions.js');
const config = require('../config.json');
const languages = require('../languages.json');
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
    // Import Mongo Client
    const { scannedServersDB } = require('../index.js');
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
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(oldPlayersID)
              .setLabel('Show Old Players')
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
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId(oldPlayersID)
              .setLabel('Show Old Players')
              .setStyle(ButtonStyle.Primary)
          );
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

        const server = (await (await scannedServersDB.find(mongoFilter).skip(currentEmbed).limit(1)).toArray())[0];

        // Updates UI when 'Next Page' pressed
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

        const streamLinks = [];
        var thumbnail;
        for (const player of server.players.sample) {
          if (streamers.includes(player.name)) {
            streamLinks.push(`https://twitch.tv/${streams[streamers.indexOf(player.name)].user_login}`);
            if (!thumbnail) thumbnail = streams[streamers.indexOf(player.name)].thumbnail_url.replaceAll('-{width}x{height}', '');
          }
        }
        for (var i = 0; i < streamLinks.length; i++) {
          newEmbed.addFields(
            { name: `Stream${i > 0 ? i + 1 : ''}`, value: streamLinks[i] }
          )
        }
        newEmbed.setImage(thumbnail);
        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });

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

        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });

        const auth = await (await fetch(`https://ping.cornbread2100.com/cracked/?ip=${server.ip}&port=${server.port}`)).text();
        if (auth == 'true') {
          newEmbed.addFields(
            { name: 'Auth', value: 'Cracked' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        } else if (auth == 'false') {
          newEmbed.addFields(
            { name: 'Auth', value: 'Premium' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        } else {
          newEmbed.addFields(
            { name: 'Auth', value: 'Unknown' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        }
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

        const server = (await (await scannedServersDB.find(mongoFilter).skip(currentEmbed).limit(1)).toArray())[0];
    
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

        const streamLinks = [];
        var thumbnail;
        for (const player of server.players.sample) {
          if (streamers.includes(player.name)) {
            streamLinks.push(`https://twitch.tv/${streams[streamers.indexOf(player.name)].user_login}`);
            if (!thumbnail) thumbnail = streams[streamers.indexOf(player.name)].thumbnail_url.replaceAll('-{width}x{height}', '');
          }
        }
        for (var i = 0; i < streamLinks.length; i++) {
          newEmbed.addFields(
            { name: `Stream${i > 0 ? i + 1 : ''}`, value: streamLinks[i] }
          )
        }
        newEmbed.setImage(thumbnail);
        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });

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

        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });

        const auth = await (await fetch(`https://ping.cornbread2100.com/cracked/?ip=${server.ip}&port=${server.port}`)).text();
        if (auth == 'true') {
          newEmbed.addFields(
            { name: 'Auth', value: 'Cracked' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        } else if (auth == 'false') {
          newEmbed.addFields(
            { name: 'Auth', value: 'Premium' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        } else {
          newEmbed.addFields(
            { name: 'Auth', value: 'Unknown' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        }
      });

      // Event listener for 'Show Old Players' button
      oldPlayersCollector.on('collect', async interaction => {
        lastButtonPress = new Date();

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
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(oldPlayersID)
                .setLabel('Show Old Players')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
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
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId(oldPlayersID)
                .setLabel('Show Old Players')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
            );
        }

        const server = (await scannedServersDB.find(mongoFilter).skip(currentEmbed).limit(1).toArray())[0];

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
        const interactionUpdate = await interaction.update({ content:'', embeds: [newEmbed], components: [buttons] });

        newEmbed.addFields(
          { name: 'Players', value: playersString },
          { name: 'Last Seen', value: `<t:${server.lastSeen}:f>` }
        )
  
        await interactionUpdate.edit({ content: '', embeds: [newEmbed], components: [buttons] });

        const streamLinks = [];
        var thumbnail;
        for (const player of server.players.sample) {
          if (streamers.includes(player.name)) {
            streamLinks.push(`https://twitch.tv/${streams[streamers.indexOf(player.name)].user_login}`);
            if (!thumbnail) thumbnail = streams[streamers.indexOf(player.name)].thumbnail_url.replaceAll('-{width}x{height}', '');
          }
        }
        for (var i = 0; i < streamLinks.length; i++) {
          newEmbed.addFields(
            { name: `Stream${i > 0 ? i + 1 : ''}`, value: streamLinks[i] }
          )
        }
        newEmbed.setImage(thumbnail);
        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });

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

        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });

        const auth = await (await fetch(`https://ping.cornbread2100.com/cracked/?ip=${server.ip}&port=${server.port}`)).text();
        if (auth == 'true') {
          newEmbed.addFields(
            { name: 'Auth', value: 'Cracked' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        } else if (auth == 'false') {
          newEmbed.addFields(
            { name: 'Auth', value: 'Premium' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        } else {
          newEmbed.addFields(
            { name: 'Auth', value: 'Unknown' }
          )
          await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
        }
      });
    
      return buttons;
    }

    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Client-ID': config.twitchClientId,
        'Authorization': `Bearer ${config.twitchAccessToken}`
      }
    };
    var response = await (await fetch('https://api.twitch.tv/helix/streams?game_id=27471&first=100', options)).json();
    var streams = response.data;
    do {
      response = await (await fetch(`https://api.twitch.tv/helix/streams?game_id=27471&first=100&after=${response.pagination.cursor}`, options)).json();
      streams = streams.concat(response.data);
    } while (response.pagination.cursor)
    if (interaction.options.getString('language')) streams = streams.filter(item => item.language == interaction.options.getString('language'));

    await interactReplyMessage.edit('Searching servers...');

    const streamers = [];
    for (const stream of streams) {
      streamers.push(stream.user_name);
    }
    mongoFilter['players.sample'] = { '$elemMatch': { 'name': { '$in': streamers } } }
    mongoFilter['ip'] = { '$ne': '109.123.240.84' }

    const totalResults = await scannedServersDB.countDocuments(mongoFilter);

    // If at least one server was found, send the message
    if (totalResults > 0) {
      var buttons = createButtons(totalResults);

      const server = (await (await scannedServersDB.find(mongoFilter).limit(1)).toArray())[0];
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
      await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });

      const streamLinks = [];
      var thumbnail;
      for (const player of server.players.sample) {
        if (streamers.includes(player.name)) {
          streamLinks.push(`https://twitch.tv/${streams[streamers.indexOf(player.name)].user_login}`);
          if (!thumbnail) thumbnail = streams[streamers.indexOf(player.name)].thumbnail_url.replaceAll('-{width}x{height}', '');
        }
      }
      for (var i = 0; i < streamLinks.length; i++) {
        newEmbed.addFields(
          { name: `Stream${i > 0 ? i + 1 : ''}`, value: streamLinks[i] }
        )
      }
      newEmbed.setImage(thumbnail);
      await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });

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

      await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });

      const auth = await (await fetch(`https://ping.cornbread2100.com/cracked/?ip=${server.ip}&port=${server.port}`)).text();
      if (auth == 'true') {
        newEmbed.addFields(
          { name: 'Auth', value: 'Cracked' }
        )
        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
      } else if (auth == 'false') {
        newEmbed.addFields(
          { name: 'Auth', value: 'Premium' }
        )
        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
      } else {
        newEmbed.addFields(
          { name: 'Auth', value: 'Unknown' }
        )
        await interactReplyMessage.edit({ content: '', embeds: [newEmbed], components: [buttons] });
      }
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
        await interactReplyMessage.edit({ content: '', components: [buttons] });

        searchNextResultCollector.stop();
        searchLastResultCollector.stop();
      } else {
        setTimeout(function() { buttonTimeoutCheck() }, 500);
      }
    }
  },
};