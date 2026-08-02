const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { CommandPermission } = require('../../models');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('permissions')
    .setDescription('Configure which roles can use which commands')
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Allow a role for a command')
        .addRoleOption((o) => o.setName('role').setDescription('Role to allow').setRequired(true))
        .addStringOption((o) =>
          o.setName('command').setDescription('Command name without /').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove a role from a command')
        .addRoleOption((o) => o.setName('role').setDescription('Role to remove').setRequired(true))
        .addStringOption((o) =>
          o.setName('command').setDescription('Command name without /').setRequired(true)
        )
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('List permission mappings'))
    .addSubcommand((sub) =>
      sub.setName('reset').setDescription('Clear all command role restrictions for this server')
    ),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) {
      return;
    }
    if (!(await assertPermission(interaction, ctx.server, 'permissions', 'manageOrg'))) {
      return;
    }

    const sub = interaction.options.getSubcommand();
    const { guildId } = ctx;

    if (sub === 'set') {
      const role = interaction.options.getRole('role', true);
      const commandName = interaction.options.getString('command', true)
        .toLowerCase()
        .replace(/^\//, '');

      let doc = await CommandPermission.findOne({ guildId, commandName });
      if (!doc) {
        doc = await CommandPermission.create({
          guildId,
          commandName,
          allowedRoles: [role.id],
        });
      } else {
        if (!doc.allowedRoles.includes(role.id)) {
          doc.allowedRoles.push(role.id);
          await doc.save();
        }
      }

      await interaction.reply({
        content: `Role ${role} can now use \`/${commandName}\`.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'remove') {
      const role = interaction.options.getRole('role', true);
      const commandName = interaction.options.getString('command', true)
        .toLowerCase()
        .replace(/^\//, '');

      const doc = await CommandPermission.findOne({ guildId, commandName });
      if (!doc) {
        await interaction.reply({
          content: `No permission entry for \`/${commandName}\`.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      doc.allowedRoles = doc.allowedRoles.filter((id) => id !== role.id);
      if (doc.allowedRoles.length === 0) {
        await doc.deleteOne();
      } else {
        await doc.save();
      }

      await interaction.reply({
        content: `Removed ${role} from \`/${commandName}\`.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'list') {
      const docs = await CommandPermission.find({ guildId }).sort({ commandName: 1 });
      const entries = docs.map((doc) => {
        const roles =
          doc.allowedRoles.map((id) => `<@&${id}>`).join(', ') || '_none_';
        return `**/${doc.commandName}**: ${roles}`;
      });

      await interaction.reply({
        embeds: [
          successEmbed(
            client,
            ctx.server,
            'Command permissions',
            entries.length ? entries.join('\n') : 'No custom role permissions set.'
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'reset') {
      const result = await CommandPermission.deleteMany({ guildId });
      await interaction.reply({
        content: `Reset permissions — removed **${result.deletedCount}** restriction(s).`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
