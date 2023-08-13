import fs from "fs";
import path from "path";
import Twitch from "twitch-js";
import axios from "axios";
import { MinionSettings, secrets, config } from "../configs/index.js";
import { generateLog, printLog } from "../utils/logs.js";
import { handleRPGCommand, initializeHunt } from "../services/minions.js";
import { DateTime } from "luxon";

async function onAuthenticationFailure() {
	try {
		const response = await axios({
			method: "post",
			url: "https://id.twitch.tv/oauth2/token",
			params: {
				grant_type: "refresh_token",
				refresh_token: secrets.twitch.identity.refreshToken,
				client_id: secrets.twitch.identity.clientId,
				client_secret: secrets.twitch.identity.clientSecret,
			},
		});

		global.twitchToken = response.data.access_token;

		return response.data.access_token;
	} catch (err) {
		generateLog("twitch", err);
	}
}

export async function run() {
	const commands = fs.readFileSync(path.resolve(process.cwd(), "./src/data/commands.json"));
	global.commands = JSON.parse(commands);
	global.twitchToken = await onAuthenticationFailure();

	const { chat } = new Twitch.default({
		token: global.twitchToken,
		username: secrets.twitch.identity.username,
		clientId: secrets.twitch.identity.clientId,
		log: { enabled: false },
		onAuthenticationFailure,
	});

	chat.connect().then(() => {
		printLog("Twitch client connected.");

		try {
			chat.join(global.channel).then(() => printLog(`Joined ${global.channel}.`));

			global.hunt = {
				cooldown: true,
				running: false,
				queuing: false,
				lastHunt: DateTime.utc(),
				players: [],
			};

			global.boss = {
				cooldown: true,
				running: false,
				queuing: false,
				lastBoss: DateTime.utc(),
				players: [],
			}

			if (!global.maintenance) {
				setTimeout(() => initializeHunt(chat), MinionSettings.huntCooldown * 1000);
				setTimeout(() => initializeBoss(chat), MinionSettings.bossCooldown * 1000);
			}
		} catch (err) {
			generateLog("twitch", err);
		}
	});

	// Main channel
	chat.on(`PRIVMSG/#${config.channel}`, ({ message, tags: { displayName } }) => {
		printLog(`${displayName}: ${message}`);
	});

	// Debug channel
	chat.on(`PRIVMSG/#${config.debugChannel}`, ({ message, tags }) => {
		printLog(`${tags.displayName}: ${message}`, true);

		if (message.substring(0, 1) === "!") {
			const splitMessage = message.split(" ");
			const command = splitMessage[0].toLowerCase();

			if (config.allowedCommands.includes(command)) {
				handleRPGCommand(chat, command, message, tags);
			}

		}
	});

	return chat;
}

export default run;
