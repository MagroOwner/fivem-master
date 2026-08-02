const { Events, EmbedBuilder } = require('discord.js');
const { ServerConfig } = require('../models');
const { registerGuildFromDatabase } = require('../utils/registerGuildCommands');

module.exports = {
  name: Events.GuildCreate,
  async execute(guild, client) {
    try {
      await registerGuildFromDatabase(client, guild.id);
    } catch (error) {
      console.error(`Failed to register commands for guild ${guild.id}:`, error);
    }

    const existing = await ServerConfig.findOne({ guildId: guild.id });
    if (existing) {
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle('FiveM Org Bot')
      .setDescription(
        'Thanks for inviting me. Run `/setup` and choose **Department**, **Gang**, or **Business** to activate the matching module for this server.'
      );

    const channel =
      guild.systemChannel ||
      guild.channels.cache.find(
        (ch) => ch.isTextBased() && ch.permissionsFor(guild.members.me)?.has('SendMessages')
      );

    if (channel) {
      await channel.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
