const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { Division, DivisionCommand } = require('../../models');
const { requireServer, assertPermission, successEmbed } = require('../../utils/serverContext');
const {
  escapeRegex,
  loadGuildCustomCommands,
  executeDivisionCommand,
} = require('../../utils/customCommands');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('division-command')
    .setDescription('Create and run custom commands inside a division')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Add a division command')
        .addStringOption((o) => o.setName('division').setDescription('Division').setRequired(true))
        .addStringOption((o) => o.setName('name').setDescription('Command name').setRequired(true))
        .addStringOption((o) => o.setName('response').setDescription('Response text').setRequired(true))
        .addStringOption((o) => o.setName('description').setDescription('Description').setRequired(false))
        .addStringOption((o) => o.setName('embed').setDescription('Saved embed name').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove a division command')
        .addStringOption((o) => o.setName('division').setDescription('Division').setRequired(true))
        .addStringOption((o) => o.setName('name').setDescription('Command name').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('list')
        .setDescription('List division commands')
        .addStringOption((o) => o.setName('division').setDescription('Division').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('run')
        .setDescription('Run a division custom command')
        .addStringOption((o) => o.setName('division').setDescription('Division').setRequired(true))
        .addStringOption((o) => o.setName('name').setDescription('Command name').setRequired(true))
    ),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) return;
    const sub = interaction.options.getSubcommand();
    const divisionName = interaction.options.getString('division', true).trim();

    const division = await Division.findOne({
      guildId: ctx.guildId,
      name: new RegExp(`^${escapeRegex(divisionName)}$`, 'i'),
    });
    if (!division) {
      await interaction.reply({
        content: `Division **${divisionName}** not found.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'run') {
      const name = interaction.options.getString('name', true).trim();
      const result = await executeDivisionCommand(client, interaction, division.name, name);
      if (result.error) {
        await interaction.reply({ content: result.error, flags: MessageFlags.Ephemeral });
        return;
      }
      const payload = { content: result.content };
      if (result.embed) payload.embeds = [result.embed];
      await interaction.reply(payload);
      return;
    }

    if (sub === 'list') {
      const cmds = await DivisionCommand.find({ guildId: ctx.guildId, divisionId: division._id });
      const lines = cmds.map((c) => `**${c.name}**${c.description ? ` — ${c.description}` : ''}`);
      await interaction.reply({
        embeds: [
          successEmbed(
            client,
            ctx.server,
            `${division.name} commands`,
            lines.join('\n') || 'No custom commands. Use `/division-command add`.'
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'division-command', 'manageOrg'))) return;

    if (sub === 'add') {
      const name = interaction.options.getString('name', true).trim().toLowerCase();
      try {
        await DivisionCommand.create({
          guildId: ctx.guildId,
          divisionId: division._id,
          name,
          response: interaction.options.getString('response', true),
          description: interaction.options.getString('description'),
          embedName: interaction.options.getString('embed'),
          createdBy: interaction.user.id,
        });
      } catch {
        await interaction.reply({
          content: `Command **${name}** already exists in **${division.name}**.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await loadGuildCustomCommands(client, ctx.guildId);
      await interaction.reply({
        content: `Added division command **${name}** to **${division.name}**. Run with \`/division-command run\`.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const name = interaction.options.getString('name', true).trim();
    const res = await DivisionCommand.deleteOne({
      guildId: ctx.guildId,
      divisionId: division._id,
      name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    });
    await loadGuildCustomCommands(client, ctx.guildId);
    await interaction.reply({
      content: res.deletedCount
        ? `Removed command **${name}** from **${division.name}**.`
        : `Command **${name}** not found.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
