const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Sends helpful info about the bot'),
	async execute(interaction) {
    const exampleEmbed = new EmbedBuilder()
	    .setColor("#02a337")
    	.setTitle('Help Menu')
    	.setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */})
    	.addFields(
    		{ name: '/randserver', value: 'Gets a random Minecraft server\n' + 'ㅤ' },
    		{ name: '/pingserver <ip> <port>', value: 'gets info from a server'},
    		{ name: 'ip', value: 'The ip address of the server\n' + 'ㅤ', inline: true },
        { name: 'port', value: 'The port of the server\n' + 'ㅤ', inline: true },
        { name: '/search [minonline] [maxonline] [isfull] [version]', value: 'searches for a server with specific properties'},
        { name: 'minonline (integer)', value: 'The minimum number of players online', inline: true },
        { name: 'maxonline (integer)', value: 'The maximum number of players online (not to be confused with the server\'s player cap)', inline: true },
        { name: 'isfull (true|false)', value: 'Whether or not the server is full', inline: true },
        { name: 'version (version number)', value: 'The version of the server', inline: true },
    	)
    	.setTimestamp()
    interaction.reply({ embeds: [exampleEmbed] });
	},
};