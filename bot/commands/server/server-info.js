const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { Division, Member, Rank, CustomCommand, ChannelCommand } = require('../../models');
const { requireServer, successEmbed } = require('../../utils/serverContext');

module.exports = {
  types: ['shared'],
  data: new SlashCommandBuilder()
    .setName('server-info')
    .setDescription('Show server configuration and module status'),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'any');
    if (!ctx) {
      return;
    }

    const { server, guildId } = ctx;
    const [divisions, members, ranks, divCmds, chCmds] = await Promise.all([
      Division.countDocuments({ guildId }),
      Member.countDocuments({ guildId }),
      Rank.countDocuments({ guildId }),
      CustomCommand.countDocuments({ guildId }),
      ChannelCommand.countDocuments({ guildId }),
    ]);

    const modules = server.modules || {};
    const moduleLines = ['department', 'gang', 'business']
      .map((key) => {
        const on = modules[key];
        const active = server.type === key ? ' (active type)' : '';
        return `• **${key}**: ${on ? 'enabled' : 'disabled'}${active}`;
      })
      .join('\n');

    await interaction.reply({
      embeds: [
        successEmbed(
          client,
          server,
          server.name || interaction.guild.name,
          [
            `Guild ID: \`${guildId}\``,
            `Type: **${server.type}**`,
            `Color: **${server.color || 'default'}**`,
            '',
            '**Modules**',
            moduleLines,
            '',
            `Divisions: **${divisions}** · Members: **${members}** · Ranks: **${ranks}**`,
            `Division commands: **${divCmds}** · Channel commands: **${chCmds}**`,
          ].join('\n')
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
