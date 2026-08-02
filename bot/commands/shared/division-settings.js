const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { Division } = require('../../models');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');
const { escapeRegex } = require('../../utils/customCommands');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('division-settings')
    .setDescription('Configure division behavior')
    .addSubcommand((s) =>
      s
        .setName('set')
        .setDescription('Set a division setting')
        .addStringOption((o) => o.setName('division').setDescription('Division').setRequired(true))
        .addStringOption((o) => o.setName('key').setDescription('Setting key').setRequired(true))
        .addStringOption((o) => o.setName('value').setDescription('Value').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('enable')
        .setDescription('Enable or disable a division')
        .addStringOption((o) => o.setName('division').setDescription('Division').setRequired(true))
        .addBooleanOption((o) => o.setName('enabled').setDescription('Enabled').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('view')
        .setDescription('View division settings')
        .addStringOption((o) => o.setName('division').setDescription('Division').setRequired(true))
    ),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) return;

    const name = interaction.options.getString('division', true).trim();
    const division = await Division.findOne({
      guildId: ctx.guildId,
      name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    });
    if (!division) {
      await interaction.reply({ content: `Division **${name}** not found.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const sub = interaction.options.getSubcommand();
    if (sub === 'view') {
      const settings = division.settings || {};
      const lines = Object.entries(settings).map(([k, v]) => `**${k}**: ${v}`);
      await interaction.reply({
        embeds: [
          successEmbed(
            client,
            ctx.server,
            `${division.name} settings`,
            [
              `Enabled: **${division.enabled !== false}**`,
              `Channel: ${division.channelId ? `<#${division.channelId}>` : '_none_'}`,
              '',
              lines.length ? lines.join('\n') : '_No custom settings_',
            ].join('\n')
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'division-settings', 'manageOrg'))) return;

    if (sub === 'enable') {
      division.enabled = interaction.options.getBoolean('enabled', true);
      await division.save();
      await interaction.reply({
        content: `Division **${division.name}** is now **${division.enabled ? 'enabled' : 'disabled'}**.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const key = interaction.options.getString('key', true).trim();
    const value = interaction.options.getString('value', true);
    if (!division.settings || typeof division.settings !== 'object') {
      division.settings = {};
    }
    division.settings[key] = value;
    division.markModified('settings');
    await division.save();
    await interaction.reply({
      content: `Set **${division.name}** setting \`${key}\` = \`${value}\`.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
