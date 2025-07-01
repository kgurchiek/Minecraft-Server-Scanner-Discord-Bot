module.exports = {
  minecraftToAnsi: (text) => {
    colors = {
      '0': 30,
      '1': 34,
      '2': 32,
      '3': 36,
      '4': 31,
      '5': 35,
      '6': 33,
      '7': 37,
      '8': 30,
      '9': 34,
      'a': 32,
      'b': 36,
      'c': 31,
      'd': 35,
      'e': 33,
      'f': 37,
    }
    
    formats = {
      'l': 1,
      'm': 0,
      'n': 4,
      'r': 0,
    }
    
    result = '```ansi\n'
    splitText = text.split('§');
    if (splitText.length == 1) return text;
    color = 30;
    format = 0;
    if (text.startsWith('§')) {
      if (colors[text.charAt(1)] != null) {
        color = colors[text.charAt(1)];
      }

      if (formats[text.charAt(1)] != null) {
        format = formats[text.charAt(1)];
      }

      result += `\u001b[${format};${color}m` + String(splitText[0]).substring(1);
    } else {
      result += splitText[0];
    }
    for (var i = 1; i < splitText.length; i++) {
      if (colors[splitText[i].charAt(0)] != null) {
        color = colors[splitText[i].charAt(0)];
      }

      if (formats[splitText[i].charAt(0)] != null) {
        format = formats[splitText[i].charAt(0)];
      }

      result += `\u001b[${format};${color}m` + splitText[i].substring(1);
    }

    result += '```';
    return result;
  },
  getDescription: (description) => {
    if (description == null) return '';
    if (typeof description != 'object') return module.exports.getDescription({ text: String(description) });
    if (Array.isArray(description)) return description.reduce((a, b) => a + module.exports.getDescription(b), '');
    let newDescription = String(description.text == null ? '' : description.text) + String(description.translate == null ? '' : description.translate) + (description.extra || []).reduce((a, b) => a + module.exports.getDescription(b), '');
    description = '';
    for (let i = 0; i < newDescription.length; i++) {
      if (newDescription[i] == '§') i++;
      else description += newDescription[i];
    }
    return description;
  },
  getVersion: (rawVersion) => {
    version = '';

    if (rawVersion == null) {
      version = '​'; // zero width space
    } else if (rawVersion.name == null) {
      version = rawVersion;
    } else {
      version = rawVersion.name;
    }

    version = String(version);

    if (version.length > 150) {
      version = version.substring(0, 150) + '...';
    }

    // Convert Minecraft color and formatting codes to ANSI format
    version = module.exports.minecraftToAnsi(version);

    if (version == '') {
      version = '​'; //zero width space
    }

    return version;
  },
  thousandsSeparators: (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
  cleanIp: (ip) => ('0'.repeat(8 - ip.toString(16).length) + ip.toString(16)).match(/.{1,2}/g).map(a => parseInt(a, 16)).join('.'),
  displayPlayers: (server, playerList, showingOldPlayers) => {
    var result = `${server.players.online}/${server.players.max}`;
    if (playerList == null) return result;
    if (playerList != null && playerList.length > 0 && (showingOldPlayers || playerList.filter(a => a.lastSession == server.lastSeen).length > 0)) {
      result += `${showingOldPlayers ? '' : '\n```'}`;
      var oldString;
      playerList.sort((a, b) => b.lastSeen - a.lastSeen);
      for (var i = 0; i < playerList.length; i++) {
        oldString = result;
        if (!showingOldPlayers && playerList[i].lastSession != server.lastSeen) continue;
        result += showingOldPlayers ? `\n${result.endsWith('```') || showingOldPlayers ? '' : '\n'}\`${playerList[i].name.replaceAll('`', `'`) || ' '}\` <t:${playerList[i].lastSession}:${(new Date().getTime() / 1000) - playerList[i].lastSession > 86400 ? 'D' : 'R'}>` : `\n${result.endsWith('\`\`\`') ? '' : '\n'}${playerList[i].name.replaceAll('`', `'`) || ' '}\n${playerList[i].id.replaceAll('`', `'`) || ' '}`;
        if (result.length > 1024) {
          result = oldString;
          break;
        }
      }
      if (!showingOldPlayers) result += '```';
    }
    return result;
  }
}