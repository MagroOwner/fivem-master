const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { requireServer, successEmbed } = require('../../utils/serverContext');

const SHARED = [
  '/config', '/reset', '/permissions', '/module-toggle', '/server-info',
  '/rank', '/member', '/org', '/division', '/division-channel', '/division-command',
  '/division-settings', '/custom', '/note', '/lookup', '/delete',
  '/channel-command', '/channel-settings', '/tag', '/embed', '/help',
];

const BY_TYPE = {
  department: ['/badge', '/callsign', '/unit', '/roster'],
  gang: ['/territory', '/color', '/turfmap'],
  business: ['/license', '/permit', '/employee'],
};

const ADMIN = ['/reload', '/stats', '/ping', '/dbtest', '/backup', '/restore', '/setup'];

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show available commands for this server type'),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'setup');
    if (!ctx) return;

    if (!ctx.server) {
      await interaction.reply({
        content: 'This server is not set up. Start with `/setup`.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const typeCmds = BY_TYPE[ctx.server.type] || [];
    await interaction.reply({
      embeds: [
        successEmbed(
          client,
          ctx.server,
          `Help — ${ctx.server.type}`,
          [
            '**Server type commands**',
            typeCmds.join(', '),
            '',
            '**Shared**',
            SHARED.join(', '),
            '',
            '**Admin**',
            ADMIN.join(', '),
            '',
            'Division custom commands: `/division-command run`',
            'Channel custom commands: `/channel-command run`',
          ].join('\n')
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
