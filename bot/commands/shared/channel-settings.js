const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('channel-settings')
    .setDescription('Configure channel behavior for this server')
    .addSubcommand((s) =>
      s
        .setName('set')
        .setDescription('Set a channel setting')
        .addStringOption((o) => o.setName('key').setDescription('Setting key').setRequired(true))
        .addStringOption((o) => o.setName('value').setDescription('Value').setRequired(true))
        .addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('view')
        .setDescription('View channel settings')
        .addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('clear')
        .setDescription('Clear a channel setting')
        .addStringOption((o) => o.setName('key').setDescription('Setting key').setRequired(true))
        .addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(false))
    ),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) return;

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const channelId = channel.id;
    if (!ctx.server.channels || typeof ctx.server.channels !== 'object') {
      ctx.server.channels = {};
    }
    if (!ctx.server.channels[channelId] || typeof ctx.server.channels[channelId] !== 'object') {
      ctx.server.channels[channelId] = {};
    }

    const sub = interaction.options.getSubcommand();
    if (sub === 'view') {
      const settings = ctx.server.channels[channelId];
      const lines = Object.entries(settings).map(([k, v]) => `**${k}**: ${v}`);
      await interaction.reply({
        embeds: [
          successEmbed(
            client,
            ctx.server,
            `Channel settings`,
            lines.length ? lines.join('\n') : '_No settings for this channel._'
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'channel-settings', 'manageOrg'))) return;

    if (sub === 'set') {
      const key = interaction.options.getString('key', true).trim();
      const value = interaction.options.getString('value', true);
      ctx.server.channels[channelId][key] = value;
      ctx.server.markModified('channels');
      await ctx.server.save();
      await interaction.reply({
        content: `Set <#${channelId}> \`${key}\` = \`${value}\`.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const key = interaction.options.getString('key', true).trim();
    delete ctx.server.channels[channelId][key];
    ctx.server.markModified('channels');
    await ctx.server.save();
    await interaction.reply({
      content: `Cleared <#${channelId}> setting \`${key}\`.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
