const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { requireServer, assertPermission, successEmbed, parseColor } = require('../../utils/serverContext');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Edit server settings')
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Set a settings key')
        .addStringOption((o) => o.setName('key').setDescription('Setting key').setRequired(true))
        .addStringOption((o) => o.setName('value').setDescription('Setting value').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('name')
        .setDescription('Set organization name')
        .addStringOption((o) => o.setName('value').setDescription('Name').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('color')
        .setDescription('Set theme color hex')
        .addStringOption((o) => o.setName('hex').setDescription('e.g. #5865F2').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('view').setDescription('View current settings')),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) {
      return;
    }
    if (!(await assertPermission(interaction, ctx.server, 'config', 'manageOrg'))) {
      return;
    }

    const sub = interaction.options.getSubcommand();
    const { server } = ctx;

    if (sub === 'view') {
      const settings = server.settings || {};
      const lines = Object.entries(settings).map(([k, v]) => `**${k}**: ${v}`);
      await interaction.reply({
        embeds: [
          successEmbed(
            client,
            server,
            'Server settings',
            [
              `Name: **${server.name || 'Unset'}**`,
              `Type: **${server.type}**`,
              `Color: **${server.color || 'default'}**`,
              '',
              lines.length ? lines.join('\n') : '_No custom settings_',
            ].join('\n')
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'name') {
      server.name = interaction.options.getString('value', true).trim();
      await server.save();
      await interaction.reply({ content: `Name set to **${server.name}**.`, flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === 'color') {
      const hex = interaction.options.getString('hex', true).trim();
      parseColor(hex);
      server.color = hex.startsWith('#') ? hex : `#${hex}`;
      await server.save();
      await interaction.reply({ content: `Color set to **${server.color}**.`, flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === 'set') {
      const key = interaction.options.getString('key', true).trim();
      const value = interaction.options.getString('value', true);
      if (!server.settings || typeof server.settings !== 'object') {
        server.settings = {};
      }
      server.settings[key] = value;
      server.markModified('settings');
      await server.save();
      await interaction.reply({
        content: `Setting **${key}** = \`${value}\`.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
