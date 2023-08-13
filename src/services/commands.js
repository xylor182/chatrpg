import fs from "fs";
import path from "path";
import { generateLog, printLog } from "../utils/logs.js";

const permissions = ["all", "sub", "mod"];

export const handleModerationCommand = async (chat, command, message, mod, debug = false) => {
	const splitMessage = message.split(" ");

	if (
		((command === "!cadd" || command === "!cedit") && splitMessage.length < 3) ||
		(command === "!cdel" && splitMessage.length < 2)
	) {
		return chat.say(
			global.channel,
			`Command syntax: ${command.toLowerCase()} ${command === "!cadd" ? "[-ul=all/sub/mod] " : ""}!command ${command === "!cadd" || command === "!cedit" ? "description" : ""
			}`
		);
	}

	if (command === "!cadd") {
		let permission = "all";

		if (splitMessage[1].startsWith("-ul=")) {
			const tempPermission = splitMessage[1].replace("-ul=", "");
			if (permissions.includes(tempPermission)) {
				permission = tempPermission;
			} else {
				return chat.say(
					global.channel,
					"Command syntax: !cadd [-ul=all/sub/mod] !command description"
				);
			}

			if (!splitMessage[3]) {
				return chat.say(
					global.channel,
					"Command syntax: !cadd [-ul=all/sub/mod] !command description"
				);
			}

			addCommand(chat, splitMessage[2], permission, 20, splitMessage.slice(3).join(" "), mod, debug);
		} else {
			if (!splitMessage[2]) {
				return chat.say(
					global.channel,
					"Command syntax: !cadd [-ul=all/sub/mod] !command description"
				);
			}

			addCommand(chat, splitMessage[1], "all", 20, splitMessage.slice(2).join(" "), mod, debug);
		}
	} else if (command === "!cedit") {
	} else if (command === "!cdel") {
	}
};

export function sendCommand(chat, command, tags, target, debug = false) {
	for (let i = 0; i < global.commands.length; i++) {
		if (command === global.commands[i].name) {
			if (!checkCooldown(command)) {
				const perm = global.commands[i].permission;

				if (perm === "mod") {
					if (tags.isModerator || tags.badges.broadcaster) {
						let tempDesc = global.commands[i].description;

						if (tempDesc.includes("@count")) {
							global.commands[i].count++;
							tempDesc = tempDesc.replace("@count", global.commands[i].count);
							saveCommands();
						}

						if (tempDesc.includes("@target")) {
							if (target) {
								tempDesc = tempDesc.replace("@target", target);
							} else {
								tempDesc = tempDesc.replace("@target", tags.displayName);
							}
						}

						global.twitchSettings.cooldowns.push(command);
						resetCooldown(command, Number(global.commands[i].cooldown) * 1000 || 20000);

						return chat.say(global.channel, tempDesc);
					}
				}

				if (perm === "sub") {
					if (tags.subscriber === "1" || tags.isModerator || tags.badges.broadcaster) {
						let tempDesc = global.commands[i].description;

						if (tempDesc.includes("@count")) {
							global.commands[i].count++;
							tempDesc = tempDesc.replace("@count", global.commands[i].count);
							saveCommands();
						}

						if (tempDesc.includes("@target")) {
							if (target) {
								tempDesc = tempDesc.replace("@target", target);
							} else {
								tempDesc = tempDesc.replace("@target", tags.displayName);
							}
						}

						global.twitchSettings.cooldowns.push(command);
						resetCooldown(command, Number(global.commands[i].cooldown) * 1000 || 20000);

						return chat.say(global.channel, tempDesc);
					}
				}

				if (perm === "all") {
					let tempDesc = global.commands[i].description;

					if (tempDesc.includes("@count")) {
						global.commands[i].count++;
						tempDesc = tempDesc.replace("@count", global.commands[i].count);
						saveCommands();
					}

					if (tempDesc.includes("@target")) {
						if (target) {
							tempDesc = tempDesc.replace("@target", target);
						} else {
							tempDesc = tempDesc.replace("@target", tags.displayName);
						}
					}

					global.twitchSettings.cooldowns.push(command);
					console.log("global.twitchSettings.cooldowns", global.twitchSettings.cooldowns);
					resetCooldown(command, Number(global.commands[i].cooldown) * 1000 || 20000);

					return chat.say(global.channel, tempDesc);
				}
			}

			break;
		}
	}
}

function checkCooldown(command) {
	return global.twitchSettings.cooldowns.some((cmd) => cmd === command);
}

function resetCooldown(command, cooldown) {
	setTimeout(() => {
		for (var i = 0; i < global.twitchSettings.cooldowns.length; i++) {
			if (command === global.twitchSettings.cooldowns[i]) {
				global.twitchSettings.cooldowns.splice(i, 1);
				break;
			}
		}
	}, cooldown);
}

export function nonce(length) {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export function getTicks() {
	var d = new Date();
	return d.getTime();
}

function addCommand(chat, command, permission, cooldown, description, mod, debug = false) {
	for (var i = 0; i < global.commands.length; i++) {
		if (command === global.commands[i].name) {
			chat.say(global.channel, command + " already exists.");
			return;
		}
	}

	global.commands.push({
		name: command,
		permission: permission,
		description: description,
		count: 0,
		cooldown: cooldown,
	});

	global.discordClient.channels.cache
		.get("364532946528370688")
		.send(mod + " created command `" + command + "` with the following description `" + description + "`");

	chat.say(global.channel, "Command added.");
	saveCommands();
}

function saveCommands() {
	fs.writeFile(
		path.resolve(process.cwd(), "./src/data/commands.json"),
		JSON.stringify(global.commands, null, 4),
		(err) => {
			if (err) {
				generateLog("twitch", "An error has occurred when trying to save commands.");
			}

			printLog("Commands file has been saved.");
		}
	);
}