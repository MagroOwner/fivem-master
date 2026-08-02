const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { Member, Rank, Division, Territory, BusinessLicense } = require('../../models');
const { requireServer, successEmbed } = require('../../utils/serverContext');
const { escapeRegex } = require('../../utils/customCommands');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('lookup')
    .setDescription('Search members, divisions, or records')
    .addStringOption((o) =>
      o
        .setName('type')
        .setDescription('What to search')
        .setRequired(true)
        .addChoices(
          { name: 'member', value: 'member' },
          { name: 'division', value: 'division' },
          { name: 'rank', value: 'rank' },
          { name: 'territory', value: 'territory' },
          { name: 'license', value: 'license' },
          { name: 'field', value: 'field' }
        )
    )
    .addStringOption((o) => o.setName('query').setDescription('Search text').setRequired(true))
    .addUserOption((o) => o.setName('user').setDescription('User (for member lookup)').setRequired(false)),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) return;

    const type = interaction.options.getString('type', true);
    const query = interaction.options.getString('query', true).trim();
    const user = interaction.options.getUser('user');
    const rx = new RegExp(escapeRegex(query), 'i');
    let description = 'No results.';

    if (type === 'member') {
      const filter = { guildId: ctx.guildId };
      if (user) filter.userId = user.id;
      const members = await Member.find(filter);
      const filtered = user
        ? members
        : members.filter(
            (m) =>
              rx.test(m.badge || '') ||
              rx.test(m.callsign || '') ||
              rx.test(JSON.stringify(m.meta || {}))
          );
      description =
        filtered.map((m) => `<@${m.userId}> badge=${m.badge || '-'} callsign=${m.callsign || '-'}`).join('\n') ||
        'No members matched.';
    } else if (type === 'division') {
      const items = await Division.find({ guildId: ctx.guildId, name: rx });
      description = items.map((d) => `**${d.name}** — ${d.description || 'no description'}`).join('\n') || description;
    } else if (type === 'rank') {
      const items = await Rank.find({ guildId: ctx.guildId, name: rx });
      description = items.map((r) => `**${r.name}** (order ${r.order})`).join('\n') || description;
    } else if (type === 'territory') {
      const items = await Territory.find({ guildId: ctx.guildId, name: rx });
      description = items.map((t) => `**${t.name}**`).join('\n') || description;
    } else if (type === 'license') {
      const items = await BusinessLicense.find({ guildId: ctx.guildId, name: rx });
      description =
        items.map((l) => `**${l.name}** [${l.kind}]`).join('\n') || description;
    } else if (type === 'field') {
      const fields = ctx.server.customFields || {};
      const entries = Object.entries(fields).filter(([k, v]) => rx.test(k) || rx.test(String(v)));
      description = entries.map(([k, v]) => `**${k}**: ${v}`).join('\n') || description;
    }

    await interaction.reply({
      embeds: [successEmbed(client, ctx.server, `Lookup: ${type}`, description)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
