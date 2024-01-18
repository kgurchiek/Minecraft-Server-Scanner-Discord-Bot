// Fectches dependencies and inits variables
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, getVersion, POST } = require('../commonFunctions.js');
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
    // Status message
    const interactReplyMessage = await interaction.reply({ content: 'Searching...', fetchReply: true });

    // Create unique IDs for each button
    const lastResultID = 'lastResult' + interaction.id;
    const nextResultID = 'nextResult' + interaction.id;
    const oldPlayersID = 'oldPlayers' + interaction.id;
    const searchNextResultFilter = interaction => interaction.customId == nextResultID;
    const searchLastResultFilter = interaction => interaction.customId == lastResultID;
    const oldPlayersFilter = interaction => interaction.customId == oldPlayersID;
    const searchNextResultCollector = interaction.channel.createMessageComponentCollector({ filter: searchNextResultFilter });
    const searchLastResultCollector = interaction.channel.createMessageComponentCollector({ filter: searchLastResultFilter });
    const oldPlayersCollector = interaction.channel.createMessageComponentCollector({ filter: oldPlayersFilter });
    var lastButtonPress = null;
    const mongoFilter = {};

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
          .setColor('#02a337')
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

        const server = (await POST(`https://api.cornbread2100.com/servers?limit=1`, { ip: servers[currentEmbed].ip, port: servers[currentEmbed].port }))[0];

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

        // Updates UI when 'Next Page' pressed
        newEmbed = new EmbedBuilder()
          .setColor('#02a337')
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
  
        buttonTimeoutCheck();
  
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
          .setColor('#02a337')
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

        const server = (await POST(`https://api.cornbread2100.com/servers?limit=1`, { ip: servers[currentEmbed].ip, port: servers[currentEmbed].port }))[0];
    
        if (server.players.sample != null && Array.isArray(server.players.sample)) {
          for (const player of server.players.sample) {
            if (player.lastSeen != server.lastSeen) {
              hasOldPlayers = true;
              break;
            }
          }
        }

        // Updates UI when 'Last Page' pressed
        var newEmbed = new EmbedBuilder()
          .setColor('#02a337')
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
  
        buttonTimeoutCheck();
  
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

      oldPlayersCollector.on('collect', async interaction => { 
        var newEmbed = new EmbedBuilder()
          .setColor('#02a337')
          .setTitle('Search Results')
          .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
          .addFields(
            { name: 'Updating page...', value: '​' },
          )
          .setTimestamp();
        const interactionUpdate = await interaction.update({ content: '', embeds: [newEmbed], components: [] });
        lastButtonPress = new Date();

        const server = (await POST(`https://api.cornbread2100.com/servers?limit=1`, { ip: servers[currentEmbed].ip, port: servers[currentEmbed].port }))[0];

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

        // Updates UI when 'Last Page' pressed
        var newEmbed = new EmbedBuilder()
          .setColor('#02a337')
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
  
        buttonTimeoutCheck();
  
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
    
      return buttons;
    }
    
    // Get arguments
    if (interaction.options.getInteger('skip') != null) currentEmbed = interaction.options.getInteger('skip') - 1;
    var username = interaction.options.getString('username');
    var uuid = interaction.options.getString('uuid');

    if (username == null && uuid == null) {
      const newEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle('Error')
        .setDescription('Must enter a username or uuid')
      await interactReplyMessage.edit({ content: '', embeds: [newEmbed] });
      return;
    }

    var argumentList = '**Searching with these arguments:**';
    if (username != null) argumentList += `\n**username:** ${username}`;
    if (uuid != null) argumentList += `\n**uuid:** ${uuid}`;

    await interactReplyMessage.edit(argumentList);

    if (username != null) mongoFilter['username'] = username;
    if (uuid != null) mongoFilter['uuid'] = uuid;

    const servers = (await POST('https://api.cornbread2100.com/players', mongoFilter)).servers;
    const totalResults = servers == null ? 0 : servers.length;
    if (currentEmbed > totalResults) currentEmbed = totalResults - 1;

    // If at least one server was found, send the message
    if (totalResults > 0) {
      const server = (await POST(`https://api.cornbread2100.com/servers?limit=1`, { ip: servers[currentEmbed].ip, port: servers[currentEmbed].port }))[0];
        
      var buttons = createButtons(totalResults);

      var newEmbed = new EmbedBuilder()
        .setColor('#02a337')
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
      await interactReplyMessage.edit(`No servers recorded for ${username == null ? 'uuid' : 'user'} \`${username == null ? uuid : username}\`.`);
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
        oldPlayersCollector.stop();
      } else {
        setTimeout(function() { buttonTimeoutCheck() }, 500);
      }
    }
  }
}