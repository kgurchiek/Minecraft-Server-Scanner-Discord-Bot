const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cornbreadImages = require('../cornbreadImages.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cornbread')
    .setDescription('Fetches a random cornbread image'),
  async execute(interaction) {
    // Fetch a random cornbread image URL
    const randomIndex = Math.floor(Math.random() * cornbreadImages.length);
    const imageURL = cornbreadImages[randomIndex];

    // Create an embed message with the image
    const embed = new EmbedBuilder()
      .setColor('#FFFF00') // Set the color of the embed to yellow
      .setTitle('Cornbread Image')
      .setImage(imageURL);

    // Send the embed message
    await interaction.reply({ embeds: [embed] });
  }
};
