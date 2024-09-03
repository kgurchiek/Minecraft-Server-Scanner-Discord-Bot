// Imports
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  // Sets up the command
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Sends helpful info about the bot'),
  async execute(interaction, buttonCallbacks, client, totalServers) {

    // Status message
    await interaction.reply({ content: 'Retrieving stats...', ephemeral: true });
 
    const newEmbed = new EmbedBuilder()
      .setColor("#02a337")
      .setTitle('Statistics')
      .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'})
      .addFields(
        { name: 'Author:', value: '<@720658048611516559> (@cornbread2100)' },
        { name: 'Total Servers:', value: String(totalServers), inline: true },
        { name: 'Bot Stats:', value: `In ${(await client.shard.fetchClientValues('guilds.cache.size')).reduce((a, b) => a + b, 0)} Discord servers. Last restart: <t:${Math.floor((new Date().getTime() - client.uptime) / 1000)}:R>`}
      )
    await interaction.editReply({ content: '', embeds: [newEmbed], ephemeral:true });
  } 
}