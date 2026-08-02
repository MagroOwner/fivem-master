const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { ChannelCommand } = require('../../models');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');
const {
  escapeRegex,
  loadGuildCustomCommands,
  executeChannelCommand,
} = require('../../utils/customCommands');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('channel-command')
    .setDescription('Create custom commands bound to a channel')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Add a channel command')
        .addChannelOption((o) => o.setName('channel').setDescription('Bound channel').setRequired(true))
        .addStringOption((o) => o.setName('name').setDescription('Command name').setRequired(true))
        .addStringOption((o) => o.setName('response').setDescription('Response text').setRequired(true))
        .addStringOption((o) => o.setName('description').setDescription('Description').setRequired(false))
        .addStringOption((o) => o.setName('embed').setDescription('Saved embed name').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove a channel command')
        .addChannelOption((o) => o.setName('channel').setDescription('Bound channel').setRequired(true))
        .addStringOption((o) => o.setName('name').setDescription('Command name').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('list')
        .setDescription('List channel commands')
        .addChannelOption((o) => o.setName('channel').setDescription('Bound channel').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('run')
        .setDescription('Run a channel custom command (only in its bound channel)')
        .addStringOption((o) => o.setName('name').setDescription('Command name').setRequired(true))
    ),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'run') {
      const name = interaction.options.getString('name', true).trim();
      const result = await executeChannelCommand(client, interaction, name);
      if (result.error) {
        await interaction.reply({ content: result.error, flags: MessageFlags.Ephemeral });
        return;
      }
      const payload = { content: result.content };
      if (result.embed) payload.embeds = [result.embed];
      await interaction.reply(payload);
      return;
    }

    const channel = interaction.options.getChannel('channel', true);
    const channelId = channel.id;

    if (sub === 'list') {
      const cmds = await ChannelCommand.find({ guildId: ctx.guildId, channelId });
      const lines = cmds.map((c) => `**${c.name}**${c.description ? ` — ${c.description}` : ''}`);
      await interaction.reply({
        embeds: [
          successEmbed(
            client,
            ctx.server,
            `Commands in #${channel.name || channelId}`,
            lines.join('\n') || 'No channel commands.'
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'channel-command', 'manageOrg'))) return;

    if (sub === 'add') {
      const name = interaction.options.getString('name', true).trim().toLowerCase();
      try {
        await ChannelCommand.create({
          guildId: ctx.guildId,
          channelId,
          name,
          response: interaction.options.getString('response', true),
          description: interaction.options.getString('description'),
          embedName: interaction.options.getString('embed'),
          createdBy: interaction.user.id,
        });
      } catch {
        await interaction.reply({
          content: `Command **${name}** already exists in <#${channelId}>.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await loadGuildCustomCommands(client, ctx.guildId);
      await interaction.reply({
        content: `Added channel command **${name}** for <#${channelId}>. Run with \`/channel-command run\` only in that channel.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const name = interaction.options.getString('name', true).trim();
    const res = await ChannelCommand.deleteOne({
      guildId: ctx.guildId,
      channelId,
      name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    });
    await loadGuildCustomCommands(client, ctx.guildId);
    await interaction.reply({
      content: res.deletedCount
        ? `Removed command **${name}** from <#${channelId}>.`
        : `Command **${name}** not found in <#${channelId}>.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
