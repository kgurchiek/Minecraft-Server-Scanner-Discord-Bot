const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
module.exports = {
	data: new SlashCommandBuilder()
		.setName('uptime')
		.setDescription('Sends how long the bot has been online.'),
	async execute(interaction) {
        let totalSeconds = (interaction.client.uptime / 1000);
        let days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = Math.floor(totalSeconds % 60);
    const exampleEmbed = new EmbedBuilder()
	    .setColor("#02a337")
    	.setTitle('Uptime:')
    	.setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'/*, url: 'https://discord.js.org' */})
    	.addFields(
    		{ name: `Seconds: `, value: `${seconds}` },
            { name: 'Minutes: ', value: `${minutes}`},
            { name: "Hours: ", value: `${hours}`},
            { name: "Days: ", value: `${days}`}
        )
    	.setTimestamp()
    interaction.reply({ embeds: [exampleEmbed], ephemeral:true });
	},
};