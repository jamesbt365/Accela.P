// Copyright (C) 2022 Brody Jagoe

const osu = require('node-osu');

const Sentry = require('../../../log');
const { Users } = require('../../../database/dbObjects');
const { osu_key } = require('../../../config.json');


module.exports = {
	name: 'link',
	description: 'Links osu! account for use with osu! commands',
	module: 'Osu!',
	usage: '<user>',
	args: true,
	async execute(message, args) {
		const osuApi = new osu.Api(osu_key);

		const user = args.join(' ').replace(/[^\w\s]/gi, '');

		if (user === '') return message.reply('Error: No special characters allowed!');

		let osuID = null;

		let osuName = '';
		await osuApi.getUser({ u: user }).then(u => {
			osuID = u.id;
			osuName = u.name;
		}).catch(e => {
			console.log(e);
			Sentry.captureException(e);
		});

		try {
			await Users.create({
				user_id: message.author.id,
				osu_name: osuName,
				osu_id: osuID,
			});
			return message.channel.send(`Linked ${message.author} to ${args.join(' ')} (osu! ID: ${osuID})`);
		} catch(e) {
			if (e.name === 'SequelizeUniqueConstraintError') {
				try {
					const upUser = await Users.update({
						osu_name: osuName,
						osu_id: osuID,
					},
					{
						where: { user_id: message.author.id },
					});
					if (upUser > 0) {
						return message.reply(`Updated link to ${args.join(' ')} (osu! ID: ${osuID})`);
					}
				} catch(err) {
					console.error(err);
					return message.reply('Could not find a link!');
				}
			}
			Sentry.captureException(e);
			console.error(e);
			return message.reply('Error: "Something" wen\'t wrong.');
		}
	},
};