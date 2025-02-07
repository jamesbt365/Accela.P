// Copyright (C) 2022 Brody Jagoe

const { EmbedBuilder } = require('discord.js');
const { Client } = require('../../index');

module.exports = {
	name: 'support',
	description: 'Get the link to the support server',
	module: 'Utility',
	execute(message) {
		const bot = Client.user;
		const invEmbed = new EmbedBuilder()
			.setAuthor({ name: bot.username, iconURL: bot.displayAvatarURL() })
			.setTitle('Join Accela\'s Support Server')
			.setColor('#2F3136')
			.setURL('https://discord.gg/jgzXHkU');

		message.channel.send({ embeds: [invEmbed] });
	},
};