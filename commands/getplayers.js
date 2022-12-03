const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { MinecraftServerListPing } = require("minecraft-status");

module.exports = {
	 data: new SlashCommandBuilder()
    .setName("getplayers")
    .setDescription("Pings a server for info")
    .addStringOption(option =>
      option.setName("ip")
        .setDescription("The ip of the server")
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName("port")
        .setDescription("The port of the server")
        .setRequired(true)),
	async execute(interaction) {
    const ip = interaction.options.getString("ip");
    const port = interaction.options.getInteger("port");
    
    MinecraftServerListPing.ping(0, ip, port, 3000)
      .then(response => {
        if (response.players.sample != null) {
          var newEmbed = new EmbedBuilder()
	          .setColor("#02a337")
          	.setTitle('Online Players')
            .setDescription(ip + ' : ' + port)
          	.setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'})
          	.setTimestamp()

          for (var i = 0; i < response.players.sample.length; i++) {
            newEmbed.addFields({ name: String(response.players.sample[i].name), value: String(response.players.sample[i].id) });
          }
          interaction.reply({ embeds: [newEmbed] });
        } else {
          interaction.reply('couldn\'t get players (no sample in ping)');
        }
      })
      .catch(error => {
        interaction.reply('ip is invalid or server is offline');
        console.log(error);
      })
	},
};