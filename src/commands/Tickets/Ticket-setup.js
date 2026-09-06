
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const TicketSetup = require('../../schemas/ticketSetupSystem');

module.exports = {
    usableInDms: false,
    category: "Server Utils",
    permissions: [PermissionFlagsBits.Administrator],
    data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('Configure the ticket system (run this first, before adding buttons).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option => option.setName('channel').setDescription('Select the channel where the ticket panel will be sent.').setRequired(true).addChannelTypes(ChannelType.GuildText))
        .addChannelOption(option => option.setName('category').setDescription('Select the parent where tickets should be created.').setRequired(true).addChannelTypes(ChannelType.GuildCategory))
        .addChannelOption(option => option.setName('transcripts').setDescription('Select the channel where transcripts should be sent.').setRequired(true).addChannelTypes(ChannelType.GuildText))
        .addRoleOption(option => option.setName('handlers').setDescription('Select the ticket handlers role.').setRequired(true))
        .addRoleOption(option => option.setName('everyone').setDescription('Select the everyone role.').setRequired(true))
        .addStringOption(option => option.setName('description').setDescription('Choose a description for the ticket panel embed.').setRequired(true)),
    async execute(interaction, client) {

        const { guild, options } = interaction;

        try {
            const channel = options.getChannel('channel');
            const category = options.getChannel('category');
            const transcripts = options.getChannel('transcripts');
            const handlers = options.getRole('handlers');
            const everyone = options.getRole('everyone');
            const description = options.getString('description');

            await TicketSetup.findOneAndUpdate(
                { GuildID: guild.id },
                {
                    Channel: channel.id,
                    Category: category.id,
                    Transcripts: transcripts.id,
                    Handlers: handlers.id,
                    Everyone: everyone.id,
                    Description: description,
                    $setOnInsert: { Buttons: [] },
                },
                {
                    new: true,
                    upsert: true,
                }
            );

            return interaction.reply({
                content: 'Ticket system configured successfully. Now use `/ticket-addbutton` to add one or more ticket categories (e.g. General Support, Billing, Bug Report) — the panel will be sent/updated automatically as you add them.'
            });
        } catch (err) {
            client.logs.error(`[TICKET_SYSTEM] Error configuring ticket system for ${interaction.user.username} in ${guild.name}`, err);

            return interaction.reply({
                content: `${client.config.ticketError}\nIf you believe this to be an error in the bot, please use \`\`/bug-report\`\` and report the problem to the developers.`,
                flags: MessageFlags.Ephemeral
            }).catch(error => { return });
        }
    },
};
