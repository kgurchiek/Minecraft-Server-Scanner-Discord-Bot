const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const {
    getDescription,
    getVersion,
    POST
} = require('../commonFunctions.js');
const maxmind = require('maxmind');
var cityLookup;
var asnLookup;
(async () => {
    cityLookup = await maxmind.open('./GeoLite2-City.mmdb');
    asnLookup = await maxmind.open('./GeoLite2-ASN.mmdb');
})();


module.exports = {
    // Command options
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Fetches info from a given Minecraft server')
        .addStringOption(option =>
            option.setName('ip')
            .setDescription('The ip of the server to ping')
            .setRequired(true))
        .addIntegerOption(option =>
            option.setName('port')
            .setDescription('The port of the server to ping')),
    async execute(interaction) {
        const oldPlayersID = `oldPlayers${interaction.user.id}`;
        const oldPlayersFilter = interaction => interaction.customId == oldPlayersID;
        const oldPlayersCollector = interaction.channel.createMessageComponentCollector({
            filter: oldPlayersFilter
        });
        // Ping status
        await interaction.reply('Pinging, please wait...');
        // Fetch IP and Port from the command
        const ip = interaction.options.getString('ip');
        const port = interaction.options.getInteger('port') || 25565;

        try {
            const text = await (await fetch(`https://ping.cornbread2100.com/ping/?ip=${ip}&port=${port}`)).text();
            if (text == 'timeout') {
                var errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .addFields({
                        name: 'Error',
                        value: 'Timeout (is the server offline?)'
                    })
                interaction.editReply({
                    content: '',
                    embeds: [errorEmbed]
                })
            } else {
                response = JSON.parse(text);
                var newEmbed = new EmbedBuilder()
                    .setColor('#02a337')
                    .setTitle('Ping Result')
                    .setAuthor({
                        name: 'MC Server Scanner',
                        iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'
                    })
                    .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${ip}&port=${port}`)
                    .addFields({
                        name: 'IP',
                        value: ip
                    }, {
                        name: 'Port',
                        value: port.toString()
                    }, {
                        name: 'Version',
                        value: getVersion(response.version) + ` (${response.version.protocol})`
                    }, {
                        name: 'Description',
                        value: getDescription(response.description)
                    })
                    .setTimestamp()

                var playersString = `${response.players.online}/${response.players.max}`;
                if (response.players.sample != null && Array.isArray(response.players.sample)) {
                    var oldString;
                    for (var i = 0; i < response.players.sample.length; i++) {
                        oldString = playersString;
                        playersString += `\n${response.players.sample[i].name}\n${response.players.sample[i].id}`;
                        if (i + 1 < response.players.sample.length) playersString += '\n';
                        if (playersString.length > 1024) {
                            playersString = oldString;
                            break;
                        }
                    }
                }
                newEmbed.addFields({
                    name: 'Players',
                    value: playersString
                })
                await interaction.editReply({
                    content: '',
                    embeds: [newEmbed]
                });

                var location = await cityLookup.get(ip);
                newEmbed.addFields({
                    name: 'Country: ',
                    value: location == null ? 'Unknown' : location.country == null ? `:flag_${location.registered_country.iso_code.toLowerCase()}: ${location.registered_country.names.en}` : `:flag_${location.country.iso_code.toLowerCase()}: ${location.country.names.en}`
                })
                var org = await asnLookup.get(ip);
                newEmbed.addFields({
                    name: 'Organization: ',
                    value: org == null ? 'Unknown' : org.autonomous_system_organization
                });

                const auth = await (await fetch(`https://ping.cornbread2100.com/cracked/?ip=${ip}&port=${port}&protocol=${response.version.protocol}`)).text();
                newEmbed.addFields({
                    name: 'Auth',
                    value: auth == 'true' ? 'Cracked' : auth == 'false' ? 'Premium' : 'Unknown'
                })
                await interaction.editReply({
                    content: '',
                    embeds: [newEmbed]
                });

                const document = await POST('https://api.cornbread2100.com/servers?limit=1', {
                    ip: ip,
                    port: port
                })
                if (document.length > 0 && document[0].players.sample != null) {
                    var buttons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                            .setCustomId(oldPlayersID)
                            .setLabel('Show Old Players')
                            .setStyle(ButtonStyle.Primary)
                        );
                    await interaction.editReply({
                        components: [buttons]
                    });
                }

                oldPlayersCollector.on('collect', async interaction => {
                    var buttons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                            .setCustomId(oldPlayersID)
                            .setLabel('Show Old Players')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                        );

                    var newEmbed = new EmbedBuilder()
                        .setColor('#02a337')
                        .setTitle('Ping Result')
                        .setAuthor({
                            name: 'MC Server Scanner',
                            iconURL: 'https://cdn.discordapp.com/app-icons/1037250630475059211/21d5f60c4d2568eb3af4f7aec3dbdde5.png'
                        })
                        .setThumbnail(`https://ping.cornbread2100.com/favicon/?ip=${ip}&port=${port}`)
                        .addFields({
                            name: 'IP',
                            value: ip
                        }, {
                            name: 'Port',
                            value: port.toString()
                        }, {
                            name: 'Version',
                            value: getVersion(response.version) + ` (${response.version.protocol})`
                        }, {
                            name: 'Description',
                            value: getDescription(response.description)
                        })
                        .setTimestamp()

                    const oldPlayers = document[0].players.sample == null ? [] : document[0].players.sample;
                    for (var i = oldPlayers.length - 1; i >= 0; i--) {
                        const player = oldPlayers[i];
                        if (response.players.sample != null && Array.isArray(response.players.sample) && response.players.sample.some(p => p.name == player.name && p.id == player.id)) oldPlayers.splice(i, 1);
                    }

                    var playersString = `${response.players.online}/${response.players.max}`;
                    var oldString;
                    if (response.players.sample != null && Array.isArray(response.players.sample)) {
                        for (const player of response.players.sample) {
                            oldString = playersString;
                            playersString += `\n${player.name} \`online\``;
                            if (playersString.length > 1020 && i + 1 < response.players.sample.length || playersString.length > 1024) {
                                playersString = oldString + '\n...';
                                break;
                            }
                        }
                    }

                    for (const player of oldPlayers) {
                        oldString = playersString;
                        playersString += `\n${player.name} <t:${player.lastSeen}:R>`;
                        if (playersString.length > 1020 && i + 1 < response.players.sample.length || playersString.length > 1024) {
                            playersString = oldString + '\n...';
                            break;
                        }
                    }

                    newEmbed.addFields({
                        name: 'Players',
                        value: playersString
                    })

                    var location = await cityLookup.get(ip);
                    newEmbed.addFields({
                        name: 'Country: ',
                        value: location == null ? 'Unknown' : location.country == null ? `:flag_${location.registered_country.iso_code.toLowerCase()}: ${location.registered_country.names.en}` : `:flag_${location.country.iso_code.toLowerCase()}: ${location.country.names.en}`
                    })
                    var org = await asnLookup.get(ip);
                    newEmbed.addFields({
                        name: 'Organization: ',
                        value: org == null ? 'Unknown' : org.autonomous_system_organization
                    });

                    const auth = await (await fetch(`https://ping.cornbread2100.com/cracked/?ip=${ip}&port=${port}&protocol=${response.version.protocol}`)).text();
                    newEmbed.addFields({
                        name: 'Auth',
                        value: auth == 'true' ? 'Cracked' : auth == 'false' ? 'Premium' : 'Unknown'
                    })
                    await interaction.update({
                        embeds: [newEmbed],
                        components: [buttons]
                    });
                })
            }
        } catch (error) {
            console.log(error);
            var errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .addFields({
                    name: 'Error',
                    value: error.toString()
                })
            interaction.editReply({
                content: '',
                embeds: [errorEmbed]
            })
        }
    }
}
