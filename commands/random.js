// Imports
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, thousandsSeparators, cleanIp, displayPlayers } = require('../commonFunctions.js')
const config = require('../config.json')
const buttonTimeout = 60;

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
  let description;
  try {
    description = JSON.parse(server.rawDescription);
  } catch (err) {
    description = server.description;
  }
  const newEmbed = new EmbedBuilder()
    .setColor("#02a337")
    .setTitle(`Server ${thousandsSeparators(currentEmbed + 1)}/${thousandsSeparators(totalResults)}`)
    .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
    .addFields(
      { name: 'IP', value: cleanIp(parseInt(server.ip)) },
      { name: 'Port', value: String(server.port) },
      { name: 'Version', value: `${server.version.name} (${server.version.protocol})` },
      { name: 'Description', value: getDescription(description) },
      { name: 'Players', value: displayPlayers(server) },
      { name: 'Discovered', value: `<t:${server.discovered}:${(new Date().getTime() / 1000) - server.discovered > 86400 ? 'D' : 'R'}>`},
      { name: 'Last Seen', value: `<t:${server.lastSeen}:${(new Date().getTime() / 1000) - server.lastSeen > 86400 ? 'D' : 'R'}>` }
    )
    .setTimestamp();

  if (server.geo?.country == null) newEmbed.addFields({ name: 'Country: ', value: 'Unknown' })
  else newEmbed.addFields({ name: 'Country: ', value: `:flag_${server.geo.country.toLowerCase()}: ${server.geo.country}` })
  
  if (server.org == null) newEmbed.addFields({ name: 'Organization: ', value: 'Unknown' });
  else newEmbed.addFields({ name: 'Organization: ', value: server.org });

  newEmbed.addFields({ name: 'Auth', value: server.cracked == true ? 'Cracked' : server.cracked == false ? 'Premium' : 'Unknown' });
  newEmbed.addFields({ name: 'Whitelist', value: server.whitelisted == true ? 'Enabled' : server.whitelisted == false ? 'Disabled' : 'Unknown' });
  return newEmbed;
}

module.exports = {
  // Define 'random' command
  data: new SlashCommandBuilder()
    .setName('random')
	  .setDescription('Gets a random online Java Edition server'),
  async execute(interaction, buttonCallbacks, client, totalServers, setTotalServers, recentServers) {
    if (interaction.isChatInputCommand()) await interaction.deferReply();
    else await interaction.deferUpdate();
    const user = interaction.user;
    var lastButtonPress = new Date();
    const randomizeID = `randomize${interaction.user.id}`;
    const oldPlayersID = `oldPlayers${interaction.user.id}`;
    // Status message
    const interactionReplyMessage = await interaction.editReply({ content: 'Getting a server, please wait...', embeds: [], components: [] });
    
    // Get a random server from the database
    if (recentServers == null) recentServers = await (await fetch(`${config.api}/count?seenAfter=${Math.round(new Date().getTime() / 1000) - 3600}`)).json();
    var index = Math.floor((Math.random() * recentServers));
    const server = (await (await fetch(`${config.api}/servers?limit=1&skip=${index}&seenAfter=${Math.round(new Date().getTime() / 1000) - 3600}`)).json())[0];
    let playerList;
    
    if (server == null) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('No recent servers found')
        .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
        .setDescription('This is a bug, please ping @cornbread2100 in the official support server (https://discord.gg/3u2fNRAMAN)')
      await interaction.editReply({ content: '', embeds: [embed] });
      return;
    }

    const hasOldPlayers = server.players.hasPlayerSample;
    var showingOldPlayers = true;

    var buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(randomizeID)
          .setLabel('↻')
          .setStyle(ButtonStyle.Primary)
      )
    if (hasOldPlayers) {
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(oldPlayersID)
          .setLabel('Show Players')
          .setStyle(ButtonStyle.Primary)
      )
    }
    
    var embed = createEmbed(server, index, recentServers);
    await interaction.editReply({ content: '', embeds: [embed], components: [buttons] });

    buttonCallbacks[randomizeID] = async interaction => module.exports.execute(interaction, buttonCallbacks, client, totalServers, setTotalServers, recentServers);

    buttonCallbacks[oldPlayersID] = async interaction => {
      if (interaction.user.id != user.id) return interaction.reply({ content: 'That\'s another user\'s command, use /random to create your own', ephemeral: true });
      embed.data.fields[4].value =  `${server.players.online}/${server.players.max}\nLoading Players...`;
      buttons.components[0].data.disabled = true;
      buttons.components[1].data.disabled = true;
      await interaction.update({ content: '', embeds: [embed], components: [buttons] });
      if (playerList == null) {
        playerList = await (await fetch(`${config.api}/playerHistory?ip=${server.ip}&port=${server.port}`)).json();
        playerList.sort((a, b) => b.lastSession - a.lastSession);
      }
      lastButtonPress = new Date();
      showingOldPlayers = !showingOldPlayers;
      buttons.components[1].data.label = showingOldPlayers ? 'Online Players' : 'Player History';
      embed.data.fields[4].value = displayPlayers(server, playerList, showingOldPlayers);
      buttons.components[0].data.disabled = false;
      buttons.components[1].data.disabled = false;
      await interaction.editReply({ content: '', embeds: [embed], components: [buttons] });
    };
    
    
    // Times out the buttons after a few seconds of inactivity (set in buttonTimeout variable)
    async function buttonTimeoutCheck() {
      if (timeSinceDate(lastButtonPress) >= buttonTimeout) {
        var buttons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(randomizeID)
              .setLabel('↻')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
            )
        if (hasOldPlayers) {
          buttons.addComponents(
            new ButtonBuilder()
              .setCustomId(oldPlayersID)
              .setLabel(showingOldPlayers ? 'Online Players' : 'Player History')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
            )
        }
        await interactionReplyMessage.edit({ components: [buttons] });
      } else setTimeout(function() { buttonTimeoutCheck() }, 500);
    }
    buttonTimeoutCheck();
  }
}