const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { MinecraftServerListPing, MinecraftQuery } = require("minecraft-status");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("pingserver")
		.setDescription("Pings a server for info")
    .addStringOption(option =>
			option.setName("ip")
				.setDescription("The ip of the server to ping")
        .setRequired(true))
    .addStringOption(option =>
			option.setName("port")
				.setDescription("The port of the server to ping")
        .setRequired(true)),
	async execute(interaction) {
    await interaction.reply("pinging...");
    
    const ip = interaction.options.getString("ip");
    const port = interaction.options.getString("port")
    
    MinecraftServerListPing.ping(0, ip, port, 2000)
      .then(response => {
        var description = "";
        if (response.description.extra != null) {
          for (var i = 0; i < response.description.extra.length; i++) {
            description += response.description.extra[i].text;
          }
        } else if (response.description.text != null) {
          description = response.description.text;
        } else if ("description: " + response.description != null) {
          description = response.description;
        } else {
          description = "Couldn't get description";
        }

        var newEmbed = new EmbedBuilder()
          .setColor("#02a337")
          .setTitle('Search Results')
          .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */})
          .addFields(
            //{ name: 'Result ' + (i + 1) + '/' + results.length, value: 'ㅤ' },
            { name: 'ip', value: ip, inline: true },
            { name: 'port', value: port, inline: true },
            { name: 'version', value: response.version.name, inline: true },
            { name: 'description', value: description, inline: true },
            { name: 'players', value: response.players.online + '/' + response.players.max, inline: true }
          )
          .setTimestamp()
        
        interaction.editReply({ content:'', embeds:[newEmbed] });
      })
      .catch(error => {
        console.log(error);
        interaction.editReply("ip is invalid or server is offline");
      });
  }
}