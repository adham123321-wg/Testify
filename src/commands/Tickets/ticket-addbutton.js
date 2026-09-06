const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');
const TicketSetup = require('../../schemas/ticketSetupSystem');

module.exports = {
    usableInDms: false,
    category: "Server Utils",
    permissions: [PermissionFlagsBits.Administrator],
    data: new SlashCommandBuilder()
        .setName('ticket-addbutton')
        .setDescription('Add a ticket category button to the panel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option.setName('label').setDescription('Button text, e.g. "General Support".').setRequired(true))
        .addStringOption(option => option.setName('emoji').setDescription('Emoji for the button.').setRequired(true)),
    async execute(interaction, client) {

        const { guild, options } = interaction;

        try {
            const data = await TicketSetup.findOne({ GuildID: guild.id });

            if (!data) {
                return interaction.reply({
                    content: 'You need to run `/ticket-setup` first before adding buttons.',
                    flags: MessageFlags.Ephemeral
                });
            }

            if (data.Buttons.length >= 5) {
                return interaction.reply({
                    content: 'You already have 5 ticket buttons, which is the maximum allowed in a single row.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const label = options.getString('label');
            const emoji = options.getString('emoji');
            const customId = 'ticket_open_' + label.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30) + '_' + Date.now();

            data.Buttons.push({ CustomId: customId, Label: label, Emoji: emoji });
            await data.save();

            const embed = new EmbedBuilder()
                .setDescription(data.Description);

            const row = new ActionRowBuilder().addComponents(
                data.Buttons.map(b =>
                    new ButtonBuilder()
                        .setCustomId(b.CustomId)
                        .setLabel(b.Label)
                        .setEmoji(b.Emoji)
                        .setStyle(ButtonStyle.Primary)
                )
            );

            const panelChannel = guild.channels.cache.get(data.Channel);
            await panelChannel.send({ embeds: [embed], components: [row] }).catch(error => { return });

            const sendSuccessEmbed = new EmbedBuilder()
                .setAuthor({ name: `Ticket system ${client.config.devBy}` })
                .setTitle(`${client.user.username} ticket system ${client.config.arrowEmoji}`)
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp()
                .setColor('Green')
                .setDescription(`Added ticket button **${label}**. The panel now has ${data.Buttons.length} button(s).`)
                .setFooter({ text: `Created by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            return interaction.reply({ embeds: [sendSuccessEmbed] });
        } catch (err) {
            client.logs.error(`[TICKET_SYSTEM] Error adding ticket button for ${interaction.user.username} in ${guild.name}`, err);

            return interaction.reply({
                content: `${client.config.ticketError}\nIf you believe this to be an error in the bot, please use \`\`/bug-report\`\` and report the problem to the developers.`,
                flags: MessageFlags.Ephemeral
            }).catch(error => { return });
        }
    },
};
