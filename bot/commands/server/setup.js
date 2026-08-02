const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  MessageFlags,
} = require('discord.js');
const { ServerConfig } = require('../../models');
const {
  requireServer,
  assertPermission,
  moduleDefaultsForType,
} = require('../../utils/serverContext');
const { loadGuildCustomCommands } = require('../../utils/customCommands');
const { registerGuildCommands } = require('../../utils/registerGuildCommands');

const TYPE_LABELS = {
  department: 'Department',
  gang: 'Gang',
  business: 'Business',
};

module.exports = {
  types: ['setup'],
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Initialize this FiveM server and choose its type')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Server type')
        .setRequired(true)
        .addChoices(
          { name: 'Department', value: 'department' },
          { name: 'Gang', value: 'gang' },
          { name: 'Business', value: 'business' }
        )
    )
    .addStringOption((option) =>
      option.setName('name').setDescription('Organization name').setRequired(false)
    )
    .addBooleanOption((option) =>
      option.setName('overwrite').setDescription('Overwrite existing setup').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'setup');
    if (!ctx) {
      return;
    }

    if (!(await assertPermission(interaction, ctx.server, 'setup', 'setup'))) {
      return;
    }

    const type = interaction.options.getString('type', true);
    const overwrite = interaction.options.getBoolean('overwrite') || false;
    const name =
      interaction.options.getString('name')?.trim() || interaction.guild.name || null;

    if (ctx.server && !overwrite) {
      await interaction.reply({
        content: `Already configured as **${TYPE_LABELS[ctx.server.type]}**. Use \`overwrite: True\` to change it.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const modules = moduleDefaultsForType(type);
    let server = ctx.server;

    if (server) {
      server.type = type;
      server.name = name;
      server.modules = modules;
      await server.save();
    } else {
      server = await ServerConfig.create({
        guildId: ctx.guildId,
        type,
        name,
        modules,
        settings: {},
        customFields: {},
        permissions: {},
      });
    }

    await loadGuildCustomCommands(client, ctx.guildId);
    await registerGuildCommands(client, ctx.guildId, type);

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle('Server initialized')
      .setDescription(
        `Detected guild \`${ctx.guildId}\` and saved it to MongoDB.\n` +
          `Active type: **${TYPE_LABELS[type]}** — only that module's commands are registered.`
      )
      .addFields(
        { name: 'Organization', value: server.name || 'Unset', inline: true },
        { name: 'Type', value: TYPE_LABELS[type], inline: true }
      );

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
