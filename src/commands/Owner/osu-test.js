// Copyright (C) 2022 Brody Jagoe

const { EmbedBuilder } = require('discord.js');
const { Users } = require('../../../database/dbObjects');

module.exports = {
	name: 'osu-test',
	aliases: ['osutest', 'testosu'],
	description: 'Tests osu! commands',
	module: 'Owner',
	owner: true,
	async execute(message, args) {
		let menUser = message.mentions.users.first();
		let memberFlag = false;
		if (!menUser && args[0]) {
			memberFlag = true;
			menUser = message.guild.members.cache.get(args[0]);
		}
		if (!menUser && !memberFlag) menUser = message.member;

		const user = await Users.findOne({ where: { user_id: menUser.id } });
		if (!user) return message.reply('Could not find user!');

		const modeNums = {
			0: 'osu!std',
			1: 'osu!taiko',
			2: 'osu!ctb',
			3: 'osu!mania',
		};

		const mode = modeNums[user.get('osu_mode')];
		const std_rank = user.get('std_rank');
		const taiko_rank = user.get('taiko_rank');
		const ctb_rank = user.get('ctb_rank');
		const mania_rank = user.get('mania_rank');

		const searchEmbed = new EmbedBuilder()
			.setAuthor({ name: `${menUser.user.tag} (${menUser.id})` })
			.setTitle(`${menUser.displayName}'s Info`)
			.setColor('0xff69b4')
			.setDescription(`Current Mode: ${mode}
osu!std: ${std_rank}
osu!taiko: ${taiko_rank}
osu!ctb: ${ctb_rank}
osu!mania: ${mania_rank}`);

		message.channel.send({ embeds: [searchEmbed] });
	},
};
