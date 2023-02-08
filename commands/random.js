// Imports
const wait = require('node:timers/promises').setTimeout;
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { MinecraftServerListPing, MinecraftQuery } = require("minecraft-status");
const { totalServers, successIPs, successPorts } = require("../serverList.json");

module.exports = {
    // Define 'randserver' command
    data: new SlashCommandBuilder()
        .setName('random')
	.setDescription('Gets a random Minecraft server'),
    async execute(interaction) {
	// Status message
	await interaction.reply("Getting a server, please wait..."); 
        
    function sendMessage() {
      // Generate a random number to select a server from the list of successful pings
      var matchNumber = Math.round((Math.random() * totalServers));
	    
      //console.log(successIPs[matchNumber] + ":" + successPorts[matchNumber]);

      fetch("https://api.mcstatus.io/v2/status/java/" + successIPs[matchNumber])
      .then(text => text.json())
      .then(response => {
        //console.log(response);
        
        if (response.online) {
          var description = response.motd.clean;
  
          if (description == '') {
            description = 'ㅤ';
          }
          var newEmbed = new EmbedBuilder()
            .setColor("#02a337")
            .setTitle('Random Server')
            .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */})
            .setThumbnail("https://api.mcstatus.io/v2/icon/" + successIPs[matchNumber])
            .addFields(
              { name: 'Ip', value: successIPs[matchNumber] },
              { name: 'Port', value: String(successPorts[matchNumber]) },
              { name: 'Version', value: response.version.name_clean },
              { name: 'Description', value: description },
              { name: 'Players', value: response.players.online + '/' + response.players.max }
            )
            .setTimestamp()

          interaction.editReply({ content:'', embeds: [newEmbed] });
        } else {
          // if the server is offline, try again with another server
          sendMessage();
        }
      })
      .catch(error => {
	// If the ping fails, try again with a different server
        sendMessage();
      });
    }

    sendMessage();
  },
};
