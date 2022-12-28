const wait = require('node:timers/promises').setTimeout;
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { MinecraftServerListPing, MinecraftQuery } = require("minecraft-status");
const { totalServers, successIPs, successPorts } = require("../serverList.json");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('randserver')
		.setDescription('Gets a random Minecraft server'),
	async execute(interaction) {
		await interaction.reply("Getting a server, please wait..."); 
    function getDescription(response) {
      var description = "";
      if (response.description.extra != null) {
        if (response.description.extra[0].extra == null) {
          for (var i = 0; i < response.description.extra.length; i++) {
            description += response.description.extra[i].text;
          }
        } else {
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
        } else {
          description = "Couldn't get description";
        }

        if (description.length > 150) {
          description = description.substring(0, 150) + "...";
        }

        //remove Minecraft color/formatting codes
        while (description.startsWith('§')) {
          description = description.substring(2, description.length);
        }

        if (description.split('§').length > 1) {
          var splitDescription = description.split('§');

          description = splitDescription[0];
          for (var i = 1; i < splitDescription.length; i++) { //skip the first one
            description += splitDescription[i].substring(1, splitDescription[i].length);
          }
        }

        if (description == '') {
          description = 'ㅤ';
        }

        return String(description);
    }
        
    function sendMessage() {
      var matchNumber = Math.round((Math.random() * totalServers));
      //console.log(successIPs[matchNumber] + ":" + successPorts[matchNumber]);

      MinecraftServerListPing.ping(0, successIPs[matchNumber], successPorts[matchNumber], 1500)
      .then(response => {
        //console.log(response);

        var description = getDescription(response);

        var newEmbed = new EmbedBuilder()
          .setColor("#02a337")
          .setTitle('Random Server')
          .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */})
          .addFields(
            { name: 'ip', value: successIPs[matchNumber] },
            { name: 'port', value: String(successPorts[matchNumber]) },
            { name: 'version', value: response.version.name },
            { name: 'description', value: description },
            { name: 'players', value: response.players.online + '/' + response.players.max }
          )
          .setTimestamp()

        interaction.editReply({ content:'', embeds: [newEmbed] });
      })
      .catch(error => {
        //console.log(error);
        sendMessage();
      });
    }

    sendMessage();
  },
};