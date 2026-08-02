const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { loadCommands } = require('../../utils/loadCommands');
const { loadModules } = require('../../utils/loadModules');
const { loadAllCustomCommands } = require('../../utils/customCommands');
const { assertPermission, requireServer } = require('../../utils/serverContext');

module.exports = {
  types: ['setup'],
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reload commands, modules, and runtime custom commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    const ctx = await requireServer(interaction, 'setup');
    if (!ctx) return;
    if (!(await assertPermission(interaction, ctx.server, 'reload', 'admin'))) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    client.commands.clear();
    client.modules.clear();
    loadCommands(client);
    loadModules(client);
    const total = await loadAllCustomCommands(client);
    await interaction.editReply(
      `Reloaded **${client.commands.size}** slash commands, **${client.modules.size}** modules, **${total}** runtime custom commands.`
    );
  },
};
