const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');
const { createId } = require('../../utils/ids');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('note')
    .setDescription('Add notes to members or the organization')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Add a note')
        .addStringOption((o) =>
          o
            .setName('target')
            .setDescription('Target type')
            .setRequired(true)
            .addChoices({ name: 'org', value: 'org' }, { name: 'member', value: 'member' })
        )
        .addStringOption((o) => o.setName('content').setDescription('Note content').setRequired(true))
        .addUserOption((o) => o.setName('user').setDescription('Member (if target=member)').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('list')
        .setDescription('List notes')
        .addStringOption((o) =>
          o
            .setName('target')
            .setDescription('Filter by target')
            .setRequired(false)
            .addChoices({ name: 'org', value: 'org' }, { name: 'member', value: 'member' })
        )
        .addUserOption((o) => o.setName('user').setDescription('Member filter').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove a note by id')
        .addStringOption((o) => o.setName('id').setDescription('Note id').setRequired(true))
    ),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) return;
    if (!Array.isArray(ctx.server.notes)) ctx.server.notes = [];

    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      let notes = ctx.server.notes;
      const target = interaction.options.getString('target');
      const user = interaction.options.getUser('user');
      if (target) notes = notes.filter((n) => n.targetType === target);
      if (user) notes = notes.filter((n) => n.targetId === user.id);
      const lines = notes.map(
        (n) =>
          `\`${n.id}\` [${n.targetType}${n.targetId ? `:${n.targetId}` : ''}] ${n.content}`
      );
      await interaction.reply({
        embeds: [successEmbed(client, ctx.server, 'Notes', lines.join('\n') || 'No notes.')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'note', 'manageOrg'))) return;

    if (sub === 'add') {
      const targetType = interaction.options.getString('target', true);
      const content = interaction.options.getString('content', true);
      const user = interaction.options.getUser('user');
      if (targetType === 'member' && !user) {
        await interaction.reply({
          content: 'Provide `user` when target is member.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const note = {
        id: createId('note'),
        targetType,
        targetId: targetType === 'member' ? user.id : ctx.guildId,
        content,
        authorId: interaction.user.id,
        createdAt: new Date(),
      };
      ctx.server.notes.push(note);
      await ctx.server.save();
      await interaction.reply({
        content: `Added note \`${note.id}\`.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const id = interaction.options.getString('id', true).trim();
    const before = ctx.server.notes.length;
    ctx.server.notes = ctx.server.notes.filter((n) => n.id !== id);
    if (ctx.server.notes.length === before) {
      await interaction.reply({ content: `Note \`${id}\` not found.`, flags: MessageFlags.Ephemeral });
      return;
    }
    await ctx.server.save();
    await interaction.reply({ content: `Removed note \`${id}\`.`, flags: MessageFlags.Ephemeral });
  },
};
