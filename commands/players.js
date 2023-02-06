const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { MinecraftServerListPing } = require("minecraft-status");

module.exports = {
	// The command has two options: an IP and a port, both of which are required
	 data: new SlashCommandBuilder()
    .setName("players")
    .setDescription("Pings a server for info")
    .addStringOption(option =>
      option.setName("ip")
        .setDescription("The ip of the server")
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName("port")
        .setDescription("The port of the server")),
	// Pings a Minecraft server with the provided IP and port and returns a list of online players
	async execute(interaction) {
	// Get the IP and port of the server from the interaction options
    const ip = interaction.options.getString("ip");
    var port = 25565;
    if (interaction.options.getInteger("port") != null) {
    	const port = interaction.options.getInteger("port");
    }
    
      // Ping the server
    MinecraftServerListPing.ping(0, ip, port, 3000)
      .then(response => {
	    // If the response includes a list of players, create an embed message with the player list
        if (response.players.sample != null) {
          var newEmbed = new EmbedBuilder()
	          .setColor("#02a337")
          	.setTitle('Online Players')
            .setDescription(ip + ' : ' + port)
          	.setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'})
          	.setTimestamp()

	  // Add a field for each player in the response
          for (var i = 0; i < response.players.sample.length; i++) {
            newEmbed.addFields({ name: String(response.players.sample[i].name), value: String(response.players.sample[i].id) });
          }
	// Reply to the interaction with the embed message
          interaction.reply({ embeds: [newEmbed] });
        } else {
          interaction.reply('Couldn\'t get players (no sample in ping)');
        }
      })
      .catch(error => {
	    // If the ping is unsuccessful, reply to the interaction with an error message
        interaction.reply('Ip is invalid or server is offline');
      })
	},
};
