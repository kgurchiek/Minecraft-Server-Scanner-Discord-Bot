const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Author, credits, and source code'),
  async execute(interaction) {
    const newEmbed = new EmbedBuilder()
      .setColor("#02a337")
    	.setTitle('Info and Credits')
    	.setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */})
    	.addFields(
			{ name: 'Author', value: 'Cornbread2100' + '​' },
			{ name: 'Source Code', value: 'https://github.com/kgurchiek/Minecraft-Server-Scanner\nhttps://github.com/kgurchiek/Minecraft-Server-Rescanner/\nhttps://github.com/kgurchiek/Minecraft-Server-Scanner-Discord-Bot\nhttps://github.com/kgurchiek/Minecraft-Ping-API/' },
			{ name: 'Sponsors', value: 'No current sponsorships' },
		)
    interaction.reply({ embeds: [newEmbed], ephemeral: true });
	}
}
