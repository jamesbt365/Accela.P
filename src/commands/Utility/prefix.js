// Copyright (C) 2022 Brody Jagoe

const { EmbedBuilder } = require('discord.js');

const { sConfig } = require('../../../database/dbObjects');
const Sentry = require('../../../log');

module.exports = {
	name: 'prefix',
	description: 'Set\'s prefix for the server',
	module: 'Owner',
	guildOnly: true,
	perms: 'MANAGE_GUILD',
	args: true,
	usage: '<prefix>',
	async execute(message, args) {
		const prefix = args[0];

		try {
			// Create a new prefix in the server config database
			await sConfig.create({
				guild_id: message.guild.id,
				prefix: prefix,
			});
		} catch(e) {
			// Updated the new prefix in the server config database
			if (e.name === 'SequelizeUniqueConstraintError') {
				try {
					const upConfig = await sConfig.update({
						prefix: prefix,
					},
					{
						where: { guild_id: message.guild.id },
					});
					// Log once updated
					if (upConfig > 0) {
						console.log(`Updated server config on ${message.guild.name}`);
					}
				} catch(err) {
					Sentry.captureException(err);
					console.error(err);
				}
			}
		}
		// Config Embed Start
		const configEmbed = new EmbedBuilder()
			.setTitle('Server Config')
			.setDescription(`Prefix: ${prefix}`);
		// Send config embed
		message.channel.send({ embeds: [configEmbed] });
	},
};