// Copyright (C) 2022 Brody Jagoe

const { EmbedBuilder, Collection, ChannelType } = require('discord.js');

const { timeSince } = require('../../utils');
const { upDate } = require('../../events/ready');
const { Users, sConfig } = require('../../../database/dbObjects');

const userList = new Collection();

module.exports = {
	name: 'leaderboard',
	guildOnly: true,
	aliases: 'lb',
	description: 'Leaderboard of verified osu! accounts in the server',
	module: 'Osu!',
	disableOsu: true,
	async execute(message, args) {
		const users = await Users.findAll();
		const server = message.guild;
		const newDate = upDate();

		let mode = 'std';
		if (args[0]) mode = args[0];
		const modes = ['std', 'taiko', 'ctb', 'mania'];

		let prefix = '>>';
		if (message.channel.type !== ChannelType.DM) {
			const serverConfig = await sConfig.findOne({ where: { guild_id: message.guild.id } });
			if (serverConfig) {
				prefix = serverConfig.get('prefix');
			}
		}

		if (!args[0]) {
			const nameColumnWidth = 32;
			const rankColumnWidth = 9;

			let table = '';

			table += getHeader(nameColumnWidth, rankColumnWidth) + '\n';

			await users.forEach(u => userList.set(u.user_id, { verified_id: u.verified_id, user_id: u.user_id, osu_name: u.osu_name, rank: u.std_rank }));

			const newList = userList.sort((a, b) => a.rank - b.rank)
				.filter(user => server.members.cache.has(user.user_id))
				.filter(user => message.guild.members.cache.get(user.user_id))
				.filter(user => user.verified_id !== null)
				.filter(user => user.rank !== null && user.rank > 0);

			const leaderList = newList.first(10);

			for (let i = 0; i < leaderList.length; i++) {
				table += getRow(i + 1, leaderList[i], nameColumnWidth, rankColumnWidth) + '\n';
			}

			const listArray = new Array(newList);
			const posNumber = listArray.findIndex(u => u.user_id === message.author.id) + 1;
			const listUser = newList.get(message.author.id);

			table += getPos(posNumber, listArray, listUser, nameColumnWidth, rankColumnWidth);

			const leaderEmbed = new EmbedBuilder()
				.addField(`${message.guild.name} Discord Leaderboard (osu!${mode})`, `\`\`\`scala
${table}
\`\`\``)
				.setColor('#af152a')
				.setFooter(`Last Updated ${timeSince(newDate)} • ${prefix}lb [mode] for other gamemodes`);

			message.channel.send({ embeds: [leaderEmbed] });
		} else {
			mode = args[0].toLowerCase();
			if (!modes.includes(mode)) return message.channel.send('Invalid Mode! Please try again.');


			const nameColumnWidth = 32;
			const rankColumnWidth = 9;

			let table = '';

			table += getHeader(nameColumnWidth, rankColumnWidth) + '\n';

			if (mode === 'std') await users.forEach(u => userList.set(u.user_id, { verified_id: u.verified_id, user_id: u.user_id, osu_name: u.osu_name, rank: u.std_rank }));
			if (mode === 'taiko') await users.forEach(u => userList.set(u.user_id, { verified_id: u.verified_id, user_id: u.user_id, osu_name: u.osu_name, rank: u.taiko_rank }));
			if (mode === 'ctb') await users.forEach(u => userList.set(u.user_id, { verified_id: u.verified_id, user_id: u.user_id, osu_name: u.osu_name, rank: u.ctb_rank }));
			if (mode === 'mania') await users.forEach(u => userList.set(u.user_id, { verified_id: u.verified_id, user_id: u.user_id, osu_name: u.osu_name, rank: u.mania_rank }));

			const newList = userList.sort((a, b) => a.rank - b.rank)
				.filter(user => server.members.cache.has(user.user_id))
				.filter(user => user.verified_id !== null)
				.filter(user => user.rank !== null && user.rank > 0);

			const leaderList = newList.first(10);

			for (let i = 0; i < leaderList.length; i++) {
				table += getRow(i + 1, leaderList[i], nameColumnWidth, rankColumnWidth) + '\n';
			}

			const listArray = newList.array();
			const posNumber = listArray.findIndex(u => u.user_id === message.author.id) + 1;
			const listUser = listArray.find(u => u.user_id === message.author.id);

			table += getPos(posNumber, listArray, listUser, nameColumnWidth, rankColumnWidth);

			const leaderEmbed = new EmbedBuilder()
				.addField(`${message.guild.name} Discord Leaderboard (osu!${mode})`, `\`\`\`scala
${table}
\`\`\``)
				.setColor('#af152a')
				.setFooter(`Last Updated ${timeSince(newDate)}`);

			message.channel.send({ embeds: [leaderEmbed] });
		}

		/*
		/////////////////////////// EMBED BUILDING ///////////////////////////
		*/

		function getHeader(nameWidth, rankWidth) {
			let header = '';
			header += 'Name (osu! User)';

			for (let i = header.length; i <= nameWidth; i++) {
				header += ' ';
			}

			header += '| Rank';

			for (let i = 5; i < rankWidth; i++) {
				header += ' ';
			}

			header += '|';

			header += '\n';

			for (let i = 0; i <= nameWidth; i++) {
				header += '-';
			}

			header += '+';

			for (let i = 0; i < rankWidth; i++) {
				header += '-';
			}

			header += '+';

			return header;
		}

		function getRow(pos, user, nameWidth, rankWidth) {
			let row = '';
			let longName;
			const discordUser = server.members.cache.get(user.user_id).user;
			const discordTag = titleCase(discordUser.tag);

			let userName = `${pos}. ${discordTag} (${user.osu_name})`;
			if (userName.length > nameWidth) {
				userName = `${pos}. ${discordTag}`;
				longName = user.osu_name;
			}

			row += userName;

			for (let i = userName.length; i <= nameWidth; i++) {
				row += ' ';
			}

			row += '| ';

			row += user.rank;

			for (let i = user.rank.length; i < rankWidth - 1; i++) {
				row += ' ';
			}

			row += '|';

			if (longName) {
				row += '\n' + `(${longName})`;

				for (let i = longName.length; i < nameWidth - 1; i++) {
					row += ' ';
				}

				row += '| ';

				for (let i = 1; i < rankWidth; i++) {
					row += ' ';
				}

				row += '|';
			}

			return row;
		}

		function getPos(pos, list, user, nameWidth, rankWidth) {
			let posHolder = '';
			if (!user) return posHolder;
			const rank = user.rank;
			console.log(pos);

			let positionText = `Your Position: ${pos}/${list.length}`;

			for (let i = 0; i <= nameWidth; i++) {
				posHolder += '-';
			}

			posHolder += '+';

			for (let i = 0; i < rankWidth; i++) {
				posHolder += '-';
			}

			posHolder += '+ \n';

			if (pos === 0) {
				positionText = '';
				posHolder += positionText;
			} else {
				posHolder += positionText;
			}

			for (let i = positionText.length; i <= nameWidth; i++) {
				posHolder += ' ';
			}

			posHolder += '| ';

			posHolder += rank;

			for (let i = rank.length; i < rankWidth - 1; i++) {
				posHolder += ' ';
			}

			posHolder += '|';

			return posHolder;
		}
	},
};

function titleCase(str) {
	str = str.toLowerCase().split(' ');
	for (let i = 0; i < str.length; i++) {
		str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
	}
	return str.join(' ');
}

/*
Name                      	 | Rank          |
-----------------------------|---------------|
1. shoultzz#1111 (shoultzzz) | 4,500
2. taiki#1111 (taiki)        | 5,000
3. nyanise#1111 (nyanise)    | 14,589
4. klarp#1111 (klarp)   	 | 43,878
5. phil#1111 (phil)          | 56,789
6. man#1111 (man 1)          | 100,223
7. man2#1111 (man 2)         | 125,554
8. man3#1111 (man 3)         | 300,433
9. man4#1111 (man 4)         | 345,567
10.man5#1111 (man 5)         | 589,998
-----------------------------|---------------|
Your position: 4/200
*/