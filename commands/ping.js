const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, getVersion, POST } = require('../commonFunctions.js');
const maxmind = require('maxmind');
var cityLookup;
var asnLookup;
(async () => {
  cityLookup = await maxmind.open('./GeoLite2-City.mmdb');
  asnLookup = await maxmind.open('./GeoLite2-ASN.mmdb');
})();

function createEmbed(server, ip, port) {
  const newEmbed = new EmbedBuilder()
    .setColor("#02a337")
    .setTitle(`${ip}:${port}`)
    .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
    .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${server.ip}&port=${server.port}`)
    .addFields(
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
  newEmbed.addFields(
    { name: 'Players', value: playersString },
    { name: 'Last Seen', value: `<t:${server.lastSeen}:${(new Date().getTime() / 1000) - server.lastSeen > 86400 ? 'D' : 'R'}>` }
  )

  return newEmbed;
}

module.exports = {
  // Command options
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Fetches info from a given Minecraft server')
    .addStringOption(option =>
      option.setName('ip')
	    .setDescription('The ip of the server to ping')
      .setRequired(true))
    .addIntegerOption(option =>
      option.setName('port')
	    .setDescription('The port of the server to ping')),
    async execute(interaction) {
      await interaction.reply(`Pinging \`${ip}:${port}\`, please wait...`);
      // Fetch IP and Port from the command
      const ip = interaction.options.getString('ip');
      const port = interaction.options.getInteger('port') || 25565;

      const text = await (await fetch(`https://ping.cornbread2100.com/ping/?ip=${ip}&port=${port}`)).text();
      if (text == 'timeout') {
        var errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .addFields({ name: 'Timeout', value: 'If you know this server is online, ping @cornbread2100 in the official support server (https://discord.gg/3u2fNRAMAN)' })
        interaction.editReply({ content: '', embeds: [errorEmbed] })
      } else {
        response = JSON.parse(text);
        var newEmbed = createEmbed(response, ip, port);
        await interaction.editReply({ content: '', embeds: [newEmbed] });
      }
    }
}
