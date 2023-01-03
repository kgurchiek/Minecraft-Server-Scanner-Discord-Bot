const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { MinecraftServerListPing, MinecraftQuery } = require("minecraft-status");

module.exports = {
	// Command options
	data: new SlashCommandBuilder()
		.setName("pingserver")
		.setDescription("Pings a server for info")
    .addStringOption(option =>
			option.setName("ip")
				.setDescription("The ip of the server to ping")
        .setRequired(true))
    .addIntegerOption(option =>
			option.setName("port")
				.setDescription("The port of the server to ping")
        .setRequired(true)),
	// Execute the command
	async execute(interaction) {
	// Ping status
    await interaction.reply("pinging...");
    
	// Fetch IP and Port from the command
    const ip = interaction.options.getString("ip");
    const port = interaction.options.getInteger("port");
        
	// Parse the server's description
    function getDescription(response) {
      var description = "";
      if (response.description.extra != null) {
        if (response.description.extra[0].extra == null) {
	// concatenate the text fields of each object in the extra array
          for (var i = 0; i < response.description.extra.length; i++) {
            description += response.description.extra[i].text;
          }
        } else {
	// concatenate the text fields of each object in the extra[0].extra array
          for (var i = 0; i < response.description.extra[0].extra.length; i++) {
            description += response.description.extra[0].extra[i].text;
          }
        }
      } else if (response.description.text != null) {
        description = response.description.text;
      } else if (response.description.translate != null) {
        description = response.description.translate;
      } else if ("description: " + response.description != null) {
        description = response.description;
	// if none of the above cases apply, set the description to a default value
      } else {
        description = "Couldn't get description";
      }

	// if the description is too long, truncate it and add an ellipsis
      if (description.length > 150) {
        description = description.substring(0, 150) + "...";
      }

      //remove Minecraft color/formatting codes
      while (description.startsWith('§')) {
        description = description.substring(2, description.length);
      }

	// Split into an array and concatenate all elements
      if (description.split('§').length > 1) {
	// Use § as the delimiter
        var splitDescription = description.split('§');

        description = splitDescription[0];
        for (var i = 1; i < splitDescription.length; i++) {
          description += splitDescription[i].substring(1, splitDescription[i].length);
        }
      }

	// If desc. is empty, set a default value
      if (description == '') {
        description = 'ㅤ';
      }

      return String(description);
    }
    
    MinecraftServerListPing.ping(0, ip, port, 2000)
      .then(response => {
	// Parse server description
        var description = getDescription(response);

        var newEmbed = new EmbedBuilder()
          .setColor("#02a337")
          .setTitle('Ping Results')
          .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */})
          .addFields(
		// Add all fields to embed
            { name: 'ip', value: ip },
            { name: 'port', value: String(port) },
            { name: 'version', value: response.version.name },
            { name: 'description', value: description },
            { name: 'players', value: response.players.online + '/' + response.players.max }
          )
          .setTimestamp()
        
        interaction.editReply({ content:'', embeds:[newEmbed] });
      })
	// If any errors occur, send to channel
      .catch(error => {
        interaction.editReply("ip is invalid or server is offline");
      });
  }
}
