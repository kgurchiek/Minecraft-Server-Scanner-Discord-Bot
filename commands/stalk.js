// Fectches dependencies and inits variables
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, getVersion, POST } = require('../commonFunctions.js');
const config = require('../config.json');
const languages = require('../languages.json');
const fs = require('fs')

// Exports an object with the parameters for the target server
module.exports = {
    data: new SlashCommandBuilder()
        .setName("stalk")
        .setDescription("Sends you a message when a user is playing the game")
        .addStringOption(option =>
            option
            .setName("username")
            .setDescription("Specifies the username (in MC) of person to stalk")
            .setRequired(true))
        .addBooleanOption(option =>
            option
            .setName('stalk')
            .setDescription('Set to false to stop stalking')),
    async execute(interaction) {
        // Status message
        await interaction.deferReply({ ephemeral: true });

        const pingList = getPingList();
        var newEmbed;
        if (interaction.options.getBoolean('stalk') == null ? true : interaction.options.getBoolean('stalk')) {
            pingList[interaction.user.id] = interaction.options.getString('username');
            fs.writeFileSync('./data/stalk.json', JSON.stringify(pingList));

            newEmbed = new EmbedBuilder()
                .setColor("#02a337")
                .setTitle(`Stalking ${interaction.options.getString('username')}`)
                .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
                .addFields({ name: 'Success', value: `You will be notified when '${interaction.options.getString('username')}' is playing on a server in the database.` })
        } else {
            delete pingList[interaction.user.id];
            fs.writeFileSync('./data/stalk.json', JSON.stringify(pingList));

            newEmbed = new EmbedBuilder()
                .setColor("#02a337")
                .setTitle(`Stopped Stalking`)
                .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
                .addFields({ name: 'Success', value: `You've stopped stalking ${interaction.options.getString('username')}.` })
        }
        await interaction.editReply({ embeds: [newEmbed] });
    }
};

function getPingList() {
    if (fs.existsSync('./data/stalk.json')) {
        return JSON.parse(fs.readFileSync('./data/stalk.json'));
    } else {
        return {};
    }
}

// ai generated code
// please rewrite this section
/*setInterval(() => {
    const pingList = getPingList();
    for (const authorUserId in pingList) {
        const userId = pingList[authorUserId];
        const user = client.users.cache.get(userId);
        if (user) {
            // TODO: code to check if a player is playing the game and fill the user.send command with actual data
            user.send(`<@${userId}>, <player> is online.`);
        }
    }
}, 60 * 60 * 1000);*/ // each hour
