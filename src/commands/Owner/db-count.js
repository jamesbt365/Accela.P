// Copyright (C) 2022 Brody Jagoe

const { Users } = require('../../../database/dbObjects');

module.exports = {
	name: 'db-count',
	aliases: ['user-count', 'uc', 'db'],
	description: 'Lists amount of members in the user database',
	module: 'Owner',
	owner: true,
	async execute(message) {
		const storedUsers = await Users.findAll();
		message.channel.send(`The database has ${storedUsers.length} souls`);
	},
};