const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDescription, getVersion } = require('../commonFunctions.js');
const maxmind = require('maxmind');
var cityLookup;
var asnLookup;
(async () => {
  cityLookup = await maxmind.open('./GeoLite2-City.mmdb');
  asnLookup = await maxmind.open('./GeoLite2-ASN.mmdb');
})();


module.exports = {
  // Command options
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Fetches info from a given Minecraft server")
    .addStringOption(option =>
      option.setName("ip")
	    .setDescription("The ip of the server to ping")
      .setRequired(true))
    .addIntegerOption(option =>
      option.setName("port")
	    .setDescription("The port of the server to ping")),
    async execute(interaction) {
      // Ping status
      await interaction.reply("Pinging, please wait...");
      // Fetch IP and Port from the command
      const ip = interaction.options.getString("ip");
      const port = interaction.options.getInteger("port") || 25565;

      try {
        const text = await (await fetch(`https://ping.cornbread2100.com/ping/?ip=${ip}&port=${port}`)).text();
        if (text == 'timeout') {
          var errorEmbed = new EmbedBuilder()
            .setColor("#ff0000")
            .addFields({ name: 'Error', value: "Timeout (is the server offline?)" })
          interaction.editReply({ content: '', embeds: [errorEmbed] })
        } else {
          response = JSON.parse(text);
          var newEmbed = new EmbedBuilder()
            .setColor("#02a337")
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
          if (response.players.sample != null) {
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

          await interaction.editReply({ content:'', embeds: [newEmbed] });

          var location = await cityLookup.get(ip);
          if (location == null) {
            newEmbed.addFields({ name: 'Country: ', value: `Unknown` })
          } else {
            if (location.country != null) {
              newEmbed.addFields({ name: 'Country: ', value: `:flag_${location.country.iso_code.toLowerCase()}: ${location.country.names.en}` })
            } else {
              newEmbed.addFields({ name: 'Country: ', value: `:flag_${location.registered_country.iso_code.toLowerCase()}: ${location.registered_country.names.en}` })
            }
          }
          var org = await asnLookup.get(ip);
          if (org == null) {
            newEmbed.addFields({ name: 'Organization: ', value: 'Unknown' });
          } else {
            newEmbed.addFields({ name: 'Organization: ', value: org.autonomous_system_organization });
          }

          await interaction.editReply({ content: '', embeds: [newEmbed] });
          
          const auth = await (await fetch(`https://ping.cornbread2100.com/cracked/?ip=${ip}&port=${port}`)).text();
          if (auth == 'true') {
            newEmbed.addFields(
              { name: 'Auth', value: 'Cracked' }
            )
            await interaction.editReply({ content:'', embeds: [newEmbed] });
          } else if (auth == 'false') {
            newEmbed.addFields(
              { name: 'Auth', value: 'Premium' }
            )
            await interaction.editReply({ content:'', embeds: [newEmbed] });
          } else {
            newEmbed.addFields(
              { name: 'Auth', value: 'Unknown' }
            )
            await interaction.editReply({ content:'', embeds: [newEmbed] });
          }
        }
      } catch (error) {
        console.log(error);
        var errorEmbed = new EmbedBuilder()
          .setColor("#ff0000")
          .addFields({ name: 'Error', value: error.toString() })
        interaction.editReply({ content: '', embeds: [errorEmbed] })
      }
    }
}
