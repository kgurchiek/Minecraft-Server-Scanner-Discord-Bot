const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const minecraftData = require('minecraft-data');

module.exports = {
  // Command options
  data: new SlashCommandBuilder()
    .setName("auth")
    .setDescription("Checks if a server requires account authentication")
    .addStringOption(option =>
      option.setName("ip")
	    .setDescription("The ip of the server")
      .setRequired(true))
    .addIntegerOption(option =>
      option.setName("port")
      .setDescription("The port of the server (default: 25565)"))
    .addStringOption(option =>
      option.setName("version")
      .setDescription("The Minecraft version to attempt a join from")),
    async execute(interaction) {
  	  // Fetch IP and Port from the command
      const ip = interaction.options.getString("ip");
      const port = interaction.options.getInteger("port") || 25565;
      var version;
      if (interaction.options.getString("version") == null) {
        await interaction.reply("Pinging server...");
        try {
          const text = await (await fetch(`https://ping.cornbread2100.com/ping/?ip=${ip}&port=${port}`)).text()
          if (text == 'timeout') {
            var errorEmbed = new EmbedBuilder()
              .setColor("#ff0000")
              .addFields({ name: 'Error', value: "Timeout (is the server offline?)" })
            interaction.editReply({ content: '', embeds: [errorEmbed] })
          } else {
            response = JSON.parse(text);
            version = minecraftData.postNettyVersionsByProtocolVersion.pc[response.version.protocol][0].minecraftVersion;
            await interaction.editReply("Attempting login...");
          }
        } catch(error) {
          console.log(error);
          var errorEmbed = new EmbedBuilder()
            .setColor("#ff0000")
            .addFields({ name: 'Error', value: error.toString() })
          interaction.editReply({ content: '', embeds: [errorEmbed] })
        };
      } else {
        version = interaction.options.getString("version");
        await interaction.reply("Attempting login...");
      }

      fetch(`https://ping.cornbread2100.com/cracked/?ip=${ip}&port=${port}&version=${version}`)
        .then(rawtext => rawtext.text())
        .then(text => {
          if (text == 'true') {
            var errorEmbed = new EmbedBuilder()
              .setColor('#02a337')
              .setTitle(`${ip}:${port}`)
              .addFields({ name: 'Cracked', value: 'You can join this server from a cracked client' })
            interaction.editReply({ content: '', embeds: [errorEmbed] })
          } else if (text == 'false') {
            var errorEmbed = new EmbedBuilder()
              .setColor("#02a337")
              .setTitle(`${ip}:${port}`)
              .addFields({ name: 'Premium', value: 'You need a paid account to join this server' })
            interaction.editReply({ content: '', embeds: [errorEmbed] })
          } else if (text == 'timeout') {
            var errorEmbed = new EmbedBuilder()
              .setColor("#ff0000")
              .addFields({ name: 'Error', value: 'IP is invalid or server is offline' })
            interaction.editReply({ content: '', embeds: [errorEmbed] })
          } else {
            var errorEmbed = new EmbedBuilder()
              .setColor("#ff0000")
              .addFields({ name: 'Error', value: `Unknown error (response: ${text})` })
            interaction.editReply({ content: '', embeds: [errorEmbed] })
          }
        })
        .catch(error => {
          console.log(error);
          var errorEmbed = new EmbedBuilder()
            .setColor("#ff0000")
            .addFields({ name: 'Error', value: error.toString() })
          interaction.editReply({ content: '', embeds: [errorEmbed] })
        });
    }
}
