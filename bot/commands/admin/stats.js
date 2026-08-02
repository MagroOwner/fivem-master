const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { ServerConfig, Member, Division, CustomCommand, ChannelCommand } = require('../../models');
const { requireServer, successEmbed } = require('../../utils/serverContext');

module.exports = {
  types: ['setup'],
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show bot stats'),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'setup');
    if (!ctx) return;

    const [servers, members, divisions, divCmds, chCmds] = await Promise.all([
      ServerConfig.countDocuments(),
      Member.countDocuments(),
      Division.countDocuments(),
      CustomCommand.countDocuments(),
      ChannelCommand.countDocuments(),
    ]);

    await interaction.reply({
      embeds: [
        successEmbed(
          client,
          ctx.server,
          'Bot stats',
          [
            `Guilds (cached): **${client.guilds.cache.size}**`,
            `Configured servers: **${servers}**`,
            `Members: **${members}** · Divisions: **${divisions}**`,
            `Division commands: **${divCmds}** · Channel commands: **${chCmds}**`,
            `Loaded slash commands: **${client.commands.size}**`,
            `Uptime: **${Math.floor(process.uptime())}s**`,
          ].join('\n')
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
