const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const {
  ServerConfig,
  Division,
  Member,
  Rank,
  Territory,
  BusinessLicense,
  DivisionCommand,
  ChannelCommand,
  CommandPermission,
  Unit,
} = require('../../models');
const { requireServer, assertPermission } = require('../../utils/serverContext');
const { loadGuildCustomCommands } = require('../../utils/customCommands');
const { registerGuildFromDatabase } = require('../../utils/registerGuildCommands');

module.exports = {
  types: ['setup'],
  data: new SlashCommandBuilder()
    .setName('restore')
    .setDescription('Import server data from a backup JSON attachment')
    .addAttachmentOption((o) =>
      o.setName('file').setDescription('Backup JSON from /backup').setRequired(true)
    )
    .addBooleanOption((o) =>
      o.setName('confirm').setDescription('Must be true to overwrite').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'setup');
    if (!ctx) return;
    if (!(await assertPermission(interaction, ctx.server, 'restore', 'admin'))) return;

    if (!interaction.options.getBoolean('confirm', true)) {
      await interaction.reply({
        content: 'Set `confirm: True` to restore.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const file = interaction.options.getAttachment('file', true);
    if (!file.name?.endsWith('.json') && file.contentType && !file.contentType.includes('json')) {
      await interaction.editReply('Please upload a JSON backup file.');
      return;
    }

    const res = await fetch(file.url);
    const payload = await res.json();
    const guildId = ctx.guildId;

    if (payload.guildId && payload.guildId !== guildId) {
      await interaction.editReply(
        `Backup guild \`${payload.guildId}\` does not match this server \`${guildId}\`.`
      );
      return;
    }

    await Promise.all([
      ServerConfig.deleteMany({ guildId }),
      Division.deleteMany({ guildId }),
      Member.deleteMany({ guildId }),
      Rank.deleteMany({ guildId }),
      Territory.deleteMany({ guildId }),
      BusinessLicense.deleteMany({ guildId }),
      DivisionCommand.deleteMany({ guildId }),
      ChannelCommand.deleteMany({ guildId }),
      CommandPermission.deleteMany({ guildId }),
      Unit.deleteMany({ guildId }),
    ]);

    const strip = (docs = []) =>
      docs.map((doc) => {
        const copy = { ...doc, guildId };
        delete copy._id;
        delete copy.__v;
        return copy;
      });

    if (payload.server) {
      const server = { ...payload.server, guildId };
      delete server._id;
      delete server.__v;
      await ServerConfig.create(server);
    }

    if (payload.divisions?.length) await Division.insertMany(strip(payload.divisions));
    if (payload.members?.length) await Member.insertMany(strip(payload.members));
    if (payload.ranks?.length) await Rank.insertMany(strip(payload.ranks));
    if (payload.territories?.length) await Territory.insertMany(strip(payload.territories));
    if (payload.licenses?.length) await BusinessLicense.insertMany(strip(payload.licenses));
    if (payload.units?.length) await Unit.insertMany(strip(payload.units));
    if (payload.commandPermissions?.length) {
      await CommandPermission.insertMany(strip(payload.commandPermissions));
    }

    // Rebuild division id map for division commands if possible by name
    if (payload.customCommands?.length) {
      const divisions = await Division.find({ guildId });
      const byName = new Map(divisions.map((d) => [d.name.toLowerCase(), d._id]));
      const oldDivs = payload.divisions || [];
      const oldIdToName = new Map(oldDivs.map((d) => [String(d._id), d.name]));
      const cmds = payload.customCommands
        .map((cmd) => {
          const divName = oldIdToName.get(String(cmd.divisionId));
          const newId = divName ? byName.get(divName.toLowerCase()) : null;
          if (!newId) return null;
          const copy = { ...cmd, guildId, divisionId: newId };
          delete copy._id;
          delete copy.__v;
          return copy;
        })
        .filter(Boolean);
      if (cmds.length) await DivisionCommand.insertMany(cmds);
    }

    if (payload.channelCommands?.length) {
      await ChannelCommand.insertMany(strip(payload.channelCommands));
    }

    await loadGuildCustomCommands(client, guildId);
    await registerGuildFromDatabase(client, guildId);
    await interaction.editReply('Restore complete. Commands reloaded for this server type.');
  },
};
