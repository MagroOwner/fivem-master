const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { Roster, Division, Rank } = require('../../models');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');
const { escapeRegex } = require('../../utils/customCommands');
const {
  nextAutoCallsign,
  nextAutoBadge,
  formatBadge,
  isValidDiscordId,
  applyRosterNickname,
} = require('../../utils/rosterHelpers');

const UPDATE_FIELDS = ['badge', 'callsign', 'timezone', 'division', 'rank'];

module.exports = {
  types: ['department'],
  data: new SlashCommandBuilder()
    .setName('roster')
    .setDescription('Manage the department roster')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Add a roster entry (5-digit badge is auto-assigned)')
        .addStringOption((o) =>
          o
            .setName('discord_id')
            .setDescription('Discord user ID (snowflake)')
            .setRequired(true)
        )
        .addStringOption((o) => o.setName('name').setDescription('Display name').setRequired(true))
        .addStringOption((o) => o.setName('timezone').setDescription('Timezone').setRequired(true))
        .addStringOption((o) =>
          o.setName('callsign').setDescription('Callsign (auto-generated if omitted)').setRequired(false)
        )
        .addStringOption((o) => o.setName('division').setDescription('Division name').setRequired(false))
        .addStringOption((o) => o.setName('rank').setDescription('Rank name').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove a roster entry by name or badge')
        .addStringOption((o) => o.setName('name').setDescription('Roster name').setRequired(false))
        .addStringOption((o) =>
          o.setName('badge').setDescription('5-digit badge e.g. 00001').setRequired(false)
        )
    )
    .addSubcommand((s) =>
      s
        .setName('update')
        .setDescription('Update a roster field')
        .addStringOption((o) => o.setName('name').setDescription('Roster name').setRequired(true))
        .addStringOption((o) =>
          o
            .setName('field')
            .setDescription('Field to update')
            .setRequired(true)
            .addChoices(
              { name: 'badge', value: 'badge' },
              { name: 'callsign', value: 'callsign' },
              { name: 'timezone', value: 'timezone' },
              { name: 'division', value: 'division' },
              { name: 'rank', value: 'rank' }
            )
        )
        .addStringOption((o) => o.setName('value').setDescription('New value').setRequired(true))
    )
    .addSubcommand((s) => s.setName('view').setDescription('View the full roster'))
    .addSubcommand((s) =>
      s
        .setName('search')
        .setDescription('Search the roster')
        .addStringOption((o) => o.setName('query').setDescription('Search text').setRequired(true))
    ),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, ['department']);
    if (!ctx) return;

    const sub = interaction.options.getSubcommand();

    if (sub === 'view' || sub === 'search') {
      let entries;
      if (sub === 'search') {
        const query = interaction.options.getString('query', true).trim();
        const rx = new RegExp(escapeRegex(query), 'i');
        entries = await Roster.find({
          guildId: ctx.guildId,
          $or: [
            { name: rx },
            { callsign: rx },
            { timezone: rx },
            { division: rx },
            { rank: rx },
            { userId: rx },
            { badge: rx },
          ],
        }).sort({ badge: 1 });

        if (/^\d+$/.test(query)) {
          const padded = formatBadge(query) || query.padStart(5, '0').slice(-5);
          const byBadge = await Roster.find({
            guildId: ctx.guildId,
            $or: [{ badge: query }, { badge: padded }],
          });
          const ids = new Set(entries.map((e) => String(e._id)));
          for (const row of byBadge) {
            if (!ids.has(String(row._id))) entries.push(row);
          }
        }
      } else {
        entries = await Roster.find({ guildId: ctx.guildId }).sort({ badge: 1 });
      }

      const lines = entries.map(
        (e) =>
          `**${e.callsign}** | ${e.name} · Badge \`${e.badge}\` · ${e.timezone}` +
          (e.division ? ` · ${e.division}` : '') +
          (e.rank ? ` · ${e.rank}` : '') +
          (e.userId ? ` · <@${e.userId}> (\`${e.userId}\`)` : '')
      );

      await interaction.reply({
        embeds: [
          successEmbed(
            client,
            ctx.server,
            sub === 'search' ? 'Roster search' : 'Roster',
            lines.join('\n') || (sub === 'search' ? 'No matches.' : 'Roster is empty. Use `/roster add`.')
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'roster', 'manageOrg'))) return;

    if (sub === 'add') {
      const discordId = interaction.options.getString('discord_id', true).trim();
      const name = interaction.options.getString('name', true).trim();
      const timezone = interaction.options.getString('timezone', true).trim();
      let callsign = interaction.options.getString('callsign')?.trim() || null;
      const divisionName = interaction.options.getString('division')?.trim() || null;
      const rankName = interaction.options.getString('rank')?.trim() || null;

      if (!isValidDiscordId(discordId)) {
        await interaction.reply({
          content: 'Invalid `discord_id`. Provide a numeric Discord user ID (17–20 digits).',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (!name || !timezone) {
        await interaction.reply({
          content: 'Name and timezone are required.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const existingUser = await Roster.findOne({ guildId: ctx.guildId, userId: discordId });
      if (existingUser) {
        await interaction.reply({
          content: `Discord ID \`${discordId}\` is already on the roster as **${existingUser.name}**.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (divisionName) {
        const div = await Division.findOne({
          guildId: ctx.guildId,
          name: new RegExp(`^${escapeRegex(divisionName)}$`, 'i'),
        });
        if (!div) {
          await interaction.reply({
            content: `Division **${divisionName}** not found. Create it with \`/division add\` first.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
      }

      if (rankName) {
        const rank = await Rank.findOne({
          guildId: ctx.guildId,
          name: new RegExp(`^${escapeRegex(rankName)}$`, 'i'),
        });
        if (!rank) {
          await interaction.reply({
            content: `Rank **${rankName}** not found. Create it with \`/rank add\` first.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
      }

      if (!callsign) {
        const generated = await nextAutoCallsign(ctx.server);
        if (generated.error) {
          await interaction.reply({ content: generated.error, flags: MessageFlags.Ephemeral });
          return;
        }
        callsign = generated.callsign;
      }

      const badgeResult = await nextAutoBadge(ctx.guildId);
      if (badgeResult.error) {
        await interaction.reply({ content: badgeResult.error, flags: MessageFlags.Ephemeral });
        return;
      }
      const badge = badgeResult.badge;

      let entry;
      try {
        entry = await Roster.create({
          guildId: ctx.guildId,
          userId: discordId,
          name,
          badge,
          callsign,
          timezone,
          division: divisionName,
          rank: rankName,
        });
      } catch (error) {
        if (error.code === 11000) {
          await interaction.reply({
            content: 'A roster entry with that Discord ID or badge already exists. Try again.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        throw error;
      }

      const nick = await applyRosterNickname(interaction, discordId, callsign, name);
      const nickNote = nick.ok
        ? `Nickname set to \`${nick.nickname}\`.`
        : `Could not set nickname (\`${nick.error}\`). Ensure the bot has **Manage Nicknames** and a higher role.`;

      await interaction.reply({
        embeds: [
          successEmbed(
            client,
            ctx.server,
            'Roster entry added',
            [
              `**${entry.name}** (<@${entry.userId}> / \`${entry.userId}\`)`,
              `Callsign: **${entry.callsign}**`,
              `Badge: **${entry.badge}** _(auto-assigned, 5 digits)_`,
              `Timezone: **${entry.timezone}**`,
              entry.division ? `Division: **${entry.division}**` : null,
              entry.rank ? `Rank: **${entry.rank}**` : null,
              nickNote,
            ]
              .filter(Boolean)
              .join('\n')
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'remove') {
      const name = interaction.options.getString('name')?.trim();
      let badge = interaction.options.getString('badge')?.trim() || null;
      if (!name && !badge) {
        await interaction.reply({
          content: 'Provide `name` or `badge` to remove an entry.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const filter = { guildId: ctx.guildId };
      if (badge) {
        const padded = formatBadge(badge) || ( /^\d{1,5}$/.test(badge) ? badge.padStart(5, '0') : null);
        if (!padded || !/^\d{5}$/.test(padded)) {
          await interaction.reply({
            content: 'Badge must be a 5-digit number (e.g. `00001`).',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        filter.badge = padded;
      }
      if (name) filter.name = new RegExp(`^${escapeRegex(name)}$`, 'i');

      const entry = await Roster.findOne(filter);
      if (!entry) {
        await interaction.reply({
          content: 'No matching roster entry found.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await entry.deleteOne();
      await interaction.reply({
        content: `Removed **${entry.name}** (badge \`${entry.badge}\`, callsign \`${entry.callsign}\`) from the roster.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'update') {
      const name = interaction.options.getString('name', true).trim();
      const field = interaction.options.getString('field', true);
      const value = interaction.options.getString('value', true).trim();

      if (!UPDATE_FIELDS.includes(field)) {
        await interaction.reply({
          content: `Field must be one of: ${UPDATE_FIELDS.join(', ')}`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const entry = await Roster.findOne({
        guildId: ctx.guildId,
        name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
      });
      if (!entry) {
        await interaction.reply({
          content: `No roster entry named **${name}**.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (field === 'badge') {
        const badge = formatBadge(value) || (/^\d{5}$/.test(value) ? value : null);
        if (!badge) {
          await interaction.reply({
            content: 'Badge must be exactly 5 digits (e.g. `00042` or `42` → `00042`).',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        const clash = await Roster.findOne({
          guildId: ctx.guildId,
          badge,
          _id: { $ne: entry._id },
        });
        if (clash) {
          await interaction.reply({
            content: `Badge **${badge}** is already assigned to **${clash.name}**.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        entry.badge = badge;
      } else if (field === 'callsign') {
        entry.callsign = value;
      } else if (field === 'timezone') {
        entry.timezone = value;
      } else if (field === 'division') {
        const div = await Division.findOne({
          guildId: ctx.guildId,
          name: new RegExp(`^${escapeRegex(value)}$`, 'i'),
        });
        if (!div) {
          await interaction.reply({
            content: `Division **${value}** not found.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        entry.division = div.name;
      } else if (field === 'rank') {
        const rank = await Rank.findOne({
          guildId: ctx.guildId,
          name: new RegExp(`^${escapeRegex(value)}$`, 'i'),
        });
        if (!rank) {
          await interaction.reply({
            content: `Rank **${value}** not found.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        entry.rank = rank.name;
      }

      await entry.save();

      let nickNote = '';
      if (field === 'callsign') {
        const nick = await applyRosterNickname(interaction, entry.userId, entry.callsign, entry.name);
        nickNote = nick.ok
          ? ` Nickname updated to \`${nick.nickname}\`.`
          : ` Nickname could not be updated.`;
      }

      await interaction.reply({
        content: `Updated **${entry.name}** \`${field}\` → **${entry[field]}**.${nickNote}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
