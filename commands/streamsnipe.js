// Fectches dependencies and inits variables
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDescription, getVersion, cleanIp, displayPlayers } = require('../lib.js');
const config = require('../config.json');
const languages = require('../languages.json');
const { buttonHandler } = require('./search.js');

let twitchStreams;
process.on('message', (message) => {
    switch (message.type) {
        case 'twitchStreams': {
            twitchStreams = message.streams;
            break;
        }
    }
});

let results;
async function updateResults() {
    results = (await (await fetch(`${config.api}/servers?includePlayers=true&limit=1000`, {
        method: 'POST',
        body: JSON.stringify({
            onlinePlayer: {
                caseInsensitive: true,
                data: twitchStreams.map(a => a.user_name)
            }
        })
    })).json()).data;

    for (let result of results) {
        result.streams = twitchStreams
            .filter(a => result.playerHistory.filter(a => a.lastSession == result.lastSeen).map(a => a.name.toLowerCase()).includes(a.user_name.toLowerCase()))
            .filter((a, i, arr) => !arr.slice(0, i).some(b => a.user_name == b.user_name))
            .slice(0, 10);
    }
    results = results.filter(a => a.streams.length > 0);
}
if (config.twitch.enabled) {
    (async () => {
        while (twitchStreams == null) await new Promise(res => setTimeout(res, 100));
        updateResults();
        setTimeout(updateResults, 60000);
    })()
}

function createEmbed(servers, index, showingOldPlayers) {
    let server = servers[index];
    let description;
    try {
        description = JSON.parse(server.rawDescription);
    } catch (err) {
        description = server.description;
    }
    const embed = new EmbedBuilder()
        .setColor('#02a337')
        .setTitle(`${cleanIp(server.ip)}${server.port == 25565 ? '' : `:${server.port}`}`)
        .setAuthor({ name: 'MC Server Scanner', iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png' })
        // .setThumbnail(`https://ping.cornbread2100.com/favicon?ip=${server.ip}&port=${server.port}&errors=false`) // looks like discord waits a few seconds for it to load before displaying the embed at all, which is annoying when scrolling 
        .addFields(
            { name: 'Version', value: `${server.version.name} (${server.version.protocol})` },
            { name: 'Description', value: String(getDescription(description)) || '​' },
            { name: 'Players', value: displayPlayers(server, server.playerHistory, showingOldPlayers) },
            { name: 'Discovered', value: `<t:${server.discovered}:${(new Date().getTime() / 1000) - server.discovered > 86400 ? 'D' : 'R'}>`},
            { name: 'Last Seen', value: `<t:${server.lastSeen}:${(new Date().getTime() / 1000) - server.lastSeen > 86400 ? 'D' : 'R'}>` },
            { name: 'Country', value: `${server.geo.country == null ? 'Unknown' : `:flag_${server.geo.country.toLowerCase()}: ${server.geo.country}`}` },
            { name: 'Organization', value: server.org == null ? 'Unknown' : server.org },
            { name: 'Auth', value: server.cracked == true ? 'Cracked' : server.cracked == false ? 'Premium' : 'Unknown' },
            { name: 'Whitelist', value: server.whitelisted == true ? 'Enabled' : server.whitelisted == false ? 'Disabled' : 'Unknown' },
            { name: 'Streams', value: server.streams.map(stream => `https://www.twitch.tv/${stream.user_name} (${languages.find(a => a.value == stream.language).name})`).join('\n') }
        )
        .setImage(server.streams[0].thumbnail_url.replace('{width}', config.commands.streamsnipe.thumbnailResolution.width).replace('{height}', config.commands.streamsnipe.thumbnailResolution.height))
        .setFooter({ text: `${(index + 1).toLocaleString()}/${servers.length.toLocaleString()}` });

    return embed;
}

function createButtons(index, pages, server, showingOldPlayers, language, user) {
    let buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`streamsnipe-page-${user};${index - 1};${language};false`)
                .setLabel('◀')
                .setStyle(pages ? ButtonStyle.Primary : ButtonStyle.Secondary)
                .setDisabled(!pages),
            new ButtonBuilder()
                .setCustomId(`streamsnipe-page-${user};${index + 1};${language};false`)
                .setLabel('▶')
                .setStyle(pages ? ButtonStyle.Primary : ButtonStyle.Secondary)
                .setDisabled(!pages)
        )
    if (server?.playerHistory?.length > 0) {
        buttons.addComponents(
            new ButtonBuilder()
                .setCustomId(`streamsnipe-page-${user};${index};${language};${!showingOldPlayers}`)
                .setLabel(showingOldPlayers ? 'Online Players' : 'Player History')
                .setStyle(ButtonStyle.Secondary)
        )
    }
    return buttons;
}

async function getServer(language, index, interaction, user, showingOldPlayers) {
    if (twitchStreams == null) {
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#02a337').setDescription(`Fetching streams...`)], components: [createButtons(0)] });
        while (twitchStreams == null) await new Promise(res => setTimeout(res, 100));
    }
    if (twitchStreams.length == 0) return interaction.editReply('No streams found. This is likely a bug, please ping @cornbread2100 in the official support server (https://discord.gg/3u2fNRAMAN)');
    if (results == null) {
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#02a337').setDescription(`Found ${twitchStreams.length.toLocaleString()} Twitch streams. Searching servers...`)], components: [createButtons(0)] });
        while (results == null) await new Promise(res => setTimeout(res, 100));
    }

    let filteredResults = results;
    if (language != null) filteredResults = filteredResults.filter(a => a.streams.some(b => b.language == language));
    if (filteredResults.length == 0) return await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#ff0000').setDescription('No servers could be found streaming in that language.')]});

    while (index >= filteredResults.length) index -= filteredResults.length;
    while (index < 0) index += filteredResults.length;

    embed = createEmbed(filteredResults, index, showingOldPlayers);
    buttons = createButtons(index, filteredResults.length > 1, filteredResults[index], showingOldPlayers, language, user);
    await interaction.editReply({ embeds: [embed], components: [buttons] });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('streamsnipe')
        .setDescription('Searches for Twitch streamers\' servers')
        .addStringOption(option =>
            option
                .setName('language')
                .setDescription('The language of the stream')
                .setAutocomplete(true)),
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const filtered = languages.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase())).splice(0, 25);
        await interaction.respond(filtered.map(choice => ({ name: choice.name, value: choice.value })));
    },
    async buttonHandler(interaction) {
        const [command, id, ...content] = interaction.customId.split('-');
        switch (id) {
            case 'page': {
                let [user, index, language, showingOldPlayers] = content.join('-').split(';');
                index = parseInt(index);
                if (language == 'null') language = null;
                showingOldPlayers = showingOldPlayers == 'true';
                if (interaction.user.id != user) return interaction.reply({ content: 'That\'s another user\'s command, use /streamsnipe to create your own', ephemeral: true });
                await interaction.deferUpdate();
                getServer(language, index, interaction, user, showingOldPlayers);
                break;
            }
        }
    },
    async execute(interaction, buttonCallbacks) {
        await interaction.deferReply();
        if (!config.twitch.enabled) return await interaction.editReply({ content: 'Twitch features have been disabled on this bot, edit your config.json to enable them' });

        let language = interaction.options.getString('language');
        if (language != null && languages.find(a => a.value == language) == null) {
            let backup = languages.find(a => a.name.toLowerCase() == language.toLowerCase());
            if (backup == null) return await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#ff0000').setDescription(`Unknown language "${language}". Please use one of the autocomplete suggestions.`)]});
            else language = backup.value;
        }

        await getServer(language, 0, interaction, interaction.user.id, false);
    }
}