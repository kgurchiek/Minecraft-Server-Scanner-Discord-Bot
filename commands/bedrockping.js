const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, getVersion } = require('../commonFunctions.js');


module.exports = {
  // Command options
  data: new SlashCommandBuilder()
    .setName('bedrockping')
    .setDescription('Fetches info from a given Minecraft Bedrock server')
    .addStringOption(option =>
      option.setName('ip')
	    .setDescription('The ip of the server to ping')
      .setRequired(true))
    .addIntegerOption(option =>
      option.setName('port')
	    .setDescription('The port of the server to ping')),
    async execute(interaction) {
      // Ping status
      await interaction.reply('Pinging, please wait...');
      // Fetch IP and Port from the command
      const ip = interaction.options.getString('ip');
      const port = interaction.options.getInteger('port') || 19132;

      try {
        const text = await (await fetch(`https://ping.cornbread2100.com/bedrockping/?ip=${ip}&port=${port}`)).text();
        if (text == 'timeout') {
          var errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .addFields({ name: 'Error', value: 'Timeout (is the server offline?)' })
          interaction.editReply({ content: '', embeds: [errorEmbed] })
        } else {
          response = text.split(';');
          var newEmbed = new EmbedBuilder()
            .setColor('#02a337')
            .setTitle('Ping Result')
            .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'})
            .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${ip}&port=${port}`)
            .addFields(
              { name: 'IP', value: ip },
              { name: 'Port', value: port.toString() },
              { name: 'Education Edition', value: response[0] == 'MCEE' ? 'true' : 'false' },
              { name: 'Description', value: `${getDescription(response[1])}\n${getDescription(response[7])}` },
              { name: 'Version', value: getVersion(response[3]) + ` (${response[2]})` },
              { name: 'Players', value: `${response[4]}/${response[5]}` },
              { name: 'Game Mode', value: `${response[8]} (${response[9]})` }
            )
            .setTimestamp()
          await interaction.editReply({ content: '', embeds: [newEmbed] });
        }
      } catch (error) {
        console.log(error);
        var errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .addFields({ name: 'Error', value: error.toString() })
        interaction.editReply({ content: '', embeds: [errorEmbed] })
      }
    }
}
