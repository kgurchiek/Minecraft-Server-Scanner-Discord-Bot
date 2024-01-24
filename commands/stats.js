// Imports
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { POST } = require('../commonFunctions.js');

module.exports = {
  // Sets up the command
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Sends helpful info about the bot'),
  async execute(interaction) {
    const { client, totalServers, totalPlayers } = require('../index.js');

    // Status message
    await interaction.reply({ content: 'Retrieving stats...', ephemeral: true });

    const userTag = await client.users.fetch("720658048611516559"); 
    var users = 0;
    client.guilds.cache.forEach(guild => {
      if (guild.id != 110373943822540800) users += guild.memberCount; // exclude Discord bot list server
    });
    const newEmbed = new EmbedBuilder()
      .setColor("#02a337")
      .setTitle('Statistics')
      .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'})
      .addFields(
        { name: 'Author:', value: userTag.username },
        { name: 'Total Servers:', value: String(totalServers), inline: true },
        { name: 'Total Players:', value: String(totalPlayers), inline: true },
        { name: 'Bot Stats:', value: `In ${client.guilds.cache.size} Discord servers. ${users} users. Last restart: <t:${Math.floor(new Date().getTime() / 1000) - client.uptime}:R>`}
      )
    await interaction.editReply({ content: '', embeds: [newEmbed], ephemeral:true });
  } 
}