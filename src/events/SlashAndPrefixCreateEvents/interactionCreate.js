const { EmbedBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");
const { color, getTimestamp } = require('../../utils/loggingEffects.js');
const { checkDmUsability } = require("../../utils/commandParams/dmCommandCheck.js");
const { checkUnderDevelopment } = require("../../utils/commandParams/underDevelopmentCheck.js");
const { logCommandError } = require("../../utils/errorLogging.js");

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        
        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.autocomplete(interaction, client);
            } catch (error) {
                console.error(`${color.red}[${getTimestamp()}]${color.reset} [ERROR] Error in autocomplete:`, error);
            }
            return;
        }
        
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) return

        if (!checkDmUsability(command, interaction)) return;
        
        if (!checkUnderDevelopment(command, interaction)) return;

        if (command.permissions && command.permissions.length) {
            const missingPerms = command.permissions.filter(perm => {
                if (!interaction.member.permissions.has(perm)) {
                    return true;
                }
                return false;
            }).map(perm => {
                return Object.keys(PermissionFlagsBits).find(p => 
                    PermissionFlagsBits[p] === perm
                ).replace(/_/g, ' ').toLowerCase();
            });

            if (missingPerms.length > 0) {
                return interaction.reply({ 
                    content: client.config.noPerms(missingPerms),
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
        
        try{
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`${color.red}[${getTimestamp()}] [INTERACTION_CREATE] Error while executing command. \n${color.red}[${getTimestamp()}] [INTERACTION_CREATE] Please check you are using the correct execute method: "async execute(interaction, client)": \n${color.red}[${getTimestamp()}] [INTERACTION_CREATE]`, error);

            await logCommandError(error, interaction, client);

            const errorEmbed = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`There was an error while executing this command!\n\`\`\`${error}\`\`\``)

            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.followUp({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
                }
            } catch (replyError) {
                console.error(`${color.red}[${getTimestamp()}] [INTERACTION_CREATE] Failed to reply to interaction:`, replyError);
            }
        }
    },
};;
