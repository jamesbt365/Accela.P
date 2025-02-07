// Copyright (C) 2022 Brody Jagoe

const { EmbedBuilder, ChannelType } = require('discord.js');

const Sentry = require('../../../log');
const { prefix, owners } = require('../../../config.json');
const { checkPerm } = require('../../utils');
const { sConfig } = require('../../../database/dbObjects');

function ucFirst(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {
	name: 'help',
	aliases: ['commands'],
	description: 'Lists all commands or info about a specific command',
	module: 'Utility',
	usage: '[command]',
	cooldown: 5,
	async execute(message, args) {
		const data = [];
		const { commands } = message.client;
		const modules = ['osu!', 'fun', 'utility', 'owner'];
		let serverConfig;
		let sprefix = prefix;

		if (message.channel.type === ChannelType.GuildText) {
			serverConfig = await sConfig.findOne({ where: { guild_id: message.guild.id } });
		}

		if (serverConfig) {
			sprefix = serverConfig.get('prefix');
		}

		if (!args.length) {
			const helpEmbed = new EmbedBuilder()
				.setAuthor({ name: message.client.user.tag, iconURL: message.client.user.displayAvatarURL() })
				.setTitle('Command Directory')
				.addFields([
					{ name: 'osu!', value: `\`${sprefix}help osu!\``, inline: true },
					{ name: 'Fun', value : `\`${sprefix}help fun\``, inline: true },
					{ name: 'Utility', value: `\`${sprefix}help utility\``, inline: true },
				])
				.setFooter({ text: `You can use ${sprefix}help [command name] to get info on a specific command!` });

			return message.channel.send({ embeds: [helpEmbed] });
		}

		const name = args[0].toLowerCase();
		const nameU = ucFirst(name);
		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

		if (!command) {
			if (modules.includes(name)) {
				if (name === 'owner') {
					let ownerCheck = false;
					owners.forEach(owner => {
						if (owner === message.author.id) ownerCheck = true;
					});
					if (!ownerCheck) return;
				}
				data.push(`**__${nameU} Commands__**\n`);

				commands.forEach(c => {
					if (c.module === nameU) {
						if (c.perms) {
							if (!checkPerm(message.member, c.perms, message)) return;
						}

						if (c.owner) {
							let ownerCheck = false;
							owners.forEach(owner => {
								if (owner === message.author.id) ownerCheck = true;
							});
							if (!ownerCheck) return;
						}

						if (c.osuDiscord) {
							if (!message.guild) return;
							if (message.guild.id !== '98226572468690944') return;
						}

						data.push(`**${c.name}**: ${c.description}`);
					}
				});
				data.push('');
				data.push(`You can send \`${sprefix}help [command name]\` to get info on a specific command!`);

				const text = data.join('\n');

				const helpEmbed = new EmbedBuilder()
					.setColor('BLUE')
					.setDescription(text);

				return message.author.send({ embeds: [helpEmbed] })
					.then(() => {
						if (message.channel.type === ChannelType.DM) return;
						message.reply('I\'ve sent you a DM with the commands!');
					})
					.catch(error => {
						console.error(error);
						Sentry.captureException(error);
						message.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
					});
			}
		} else {
			data.push(`**Name:** ${command.name}`);

			let alias = 'None';
			let description = 'None';
			let module = 'None';
			let usage = '';

			if (command.aliases) {
				if (command.aliases.isArray) {
					alias = command.aliases.join(', ');
				} else {
					alias = command.aliases;
				}
			}

			if (command.description) description = command.description;
			if (command.module) module = command.module;
			if (command.usage) usage = command.usage;

			data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);

			const commandEmbed = new EmbedBuilder()
				.setTitle(`${ucFirst(command.name)} Command`)
				.setDescription(`**Aliases:** ${alias}

**Description:** ${description}

**Category:** ${module}

**Usage:** ${sprefix}${command.name} ${usage}

**Cooldown:** ${command.cooldown || 3} second(s)`);

			message.channel.send({ embeds: [commandEmbed] });
		}
	},
};