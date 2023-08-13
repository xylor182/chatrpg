import { DateTime } from "luxon";
import { MinionSettings, secrets } from "../configs/index.js";
import User from "../models/user.js";
import { printLog } from "../utils/logs.js";

export async function handleRPGCommand(chat, command, message, tags) {
	if (global.maintenance) return;

	await handleMinimumMinions(chat, tags);

	switch (command) {
		case "!minions": {
			handleMinions(chat, tags);
		}

		case "!hunt": {
			handleHunt(chat, message, tags);
		}
	}
}

export async function initializeHunt(chat) {
	global.hunt.cooldown = false;
	global.hunt.queuing = true;
	global.hunt.players = [];

	chat.say(global.channel, "The hunt has begun! Type !hunt to join the hunt!");
	setTimeout(() => {
		chat.say(global.channel, "The hunt queue is ending in 30 seconds! Type !hunt to join the hunt!");
	}, MinionSettings.huntQueueTime * 1000 - 30000);

	setTimeout(() => startHunt(chat), MinionSettings.huntQueueTime * 1000);
}

export async function initializeBoss(chat) {
	global.boss.cooldown = false;
	global.boss.queuing = true;
	global.boss.players = [];

	chat.say(global.channel, "The boss has begun! Type !boss to fight the boss!");
	setTimeout(() => {
		chat.say(global.channel, "The boss queue is ending in 30 seconds! Type !boss to fight the boss!");
	}, MinionSettings.bossQueueTime * 1000 - 30000);

	setTimeout(() => startBoss(chat), MinionSettings.bossQueueTime * 1000);
}

const handleMinimumMinions = async (chat, tags) => {
	const { displayName } = tags;
	const user = await User.findOne({ username: displayName }).lean();

	if (user?.points > 0 || global.hunt.players.find(player => player.username === displayName) || global.boss.players.find(player => player.username === displayName)) return;

	if (!user) {
		const newUser = new User({ username: displayName });
		await newUser.save();
	} else {
		if (user.points < 1) {
			await User.updateOne({ username: displayName }, { points: 100 });
		}
	}

	chat.say(global.channel, `@${displayName} You seem to have no minions... here are 100, try not to lose them AGAIN...`);
}

const handleMinions = async (chat, tags) => {
	const { displayName } = tags;
	let user = await User.findOne({ username: displayName }).lean();

	if (!user) {
		user = new User({ username: displayName });
		await user.save();
	} else {
		if (user.points < 1) {
			await User.findOneAndUpdate({ username: displayName }, { points: 100 }, { new: true });
		}
	}

	let outputMessage = `@${displayName}, you have ${user.points} minions and hunted a total of ${user.hunts} ${user.hunts === 1 ? 'time' : 'times'}.`;

	if (user.fights?.totalFightMinions > 0) {
		outputMessage += ` In PvP, they have ${user.fights.wins} wins and ${user.fights.losses} losses. They have lost ${user.fights.minionsLost} and gained ${user.fights.minionsGained} minions.`;
	}

	chat.say(global.channel, outputMessage);
};

const handleHunt = async (chat, message, tags) => {
	const { displayName } = tags;
	const splitMessage = message.trim().split(" ");

	if (global.hunt.running) return;

	if (global.hunt.cooldown) {
		const diff = DateTime.utc().diff(DateTime.fromISO(global.hunt.lastHunt)).milliseconds / 1000;
		const cooldown = (MinionSettings.huntCooldown - diff).toFixed(0);
		chat.say(global.channel, `@${tags.displayName}, the hunt is on cooldown for ${cooldown} ${cooldown === 1 ? "second" : "seconds"}.`);

		return;
	}

	if (global.hunt.players.find(player => player.username === displayName)) {
		chat.say(global.channel, `@${tags.displayName}, you are already in the hunt.`);
		return;
	}

	if (global.hunt.queuing && !splitMessage[1]) {
		chat.say(global.channel, `@${tags.displayName}, hunt is currently queuing. You can join by typing !hunt.`);
		return;
	}

	if (global.hunt.running && !splitMessage[1]) {
		chat.say(global.channel, `@${tags.displayName}, hunt is currently running. Please wait until the hunt ends.`);
		return;
	}

	if (splitMessage[1]) {
		const amount = splitMessage[1];
		const user = await User.findOne({ username: displayName }).lean();

		if (amount === "max" || amount === "all" || amount === "half") {
			await User.updateOne({ username: displayName }, { points: user.points - (amount === "max" || amount === "all" ? user.points : user.points / 2), hunts: user.hunts + 1 });
			global.hunt.players.push({ username: displayName, points: amount === "max" || amount === "all" ? user.points : user.points / 2 });
		} else {
			const parsedValue = parseInt(amount);
			if (isNaN(parsedValue)) {
				chat.say(global.channel, `@${tags.displayName}, ${amount} is not a valid number.`);
				return;
			}

			if (user.points < amount) {
				chat.say(global.channel, `@${tags.displayName}, you do not have enough minions to hunt.`);
				return;
			} else {
				await User.updateOne({ username: displayName }, { points: user.points - amount, hunts: user.hunts + 1 });
				global.hunt.players.push({ username: displayName, points: amount });
			}
		}
	}

	if (global.debug) {
		printLog(`Hunters: ${global.hunt.players.map(player => `${player.username}: ${player.points}`).join(", ")}`);
	}
};

const startHunt = async (chat) => {
	if (global.hunt.players.length === 0) {
		chat.say(global.channel, "The hunt has no one to hunt. The hunt has fled.");
		global.hunt.cooldown = true;
		global.hunt.running = false;
		global.hunt.queuing = false;
		global.hunt.lastHunt = DateTime.utc();
		global.hunt.players = [];

		setTimeout(() => initializeHunt(chat), MinionSettings.huntCooldown * 1000);

		return;
	}

	chat.say(global.channel, "The hunt has started! Let's see who survive...");
	global.hunt.cooldown = false;
	global.hunt.running = true;
	global.hunt.queuing = false;

	// do stuff

	chat.say(global.channel, "The hunt has has ended!");

	global.hunt.cooldown = true;
	global.hunt.running = false;
	global.hunt.queuing = false;
	global.hunt.lastHunt = DateTime.utc();
	global.hunt.players = [];

	setTimeout(() => initializeHunt(chat), MinionSettings.huntCooldown * 1000);
};



// BOSS RELATED FUNCTIONS

const startBoss = async (chat) => {
	if (global.boss.players.length === 0) {
		chat.say(global.channel, "The boss has no one to fight. The boss has fled.");
		global.boss.cooldown = true;
		global.boss.running = false;
		global.boss.queuing = false;
		global.boss.lastHunt = DateTime.utc();
		global.boss.players = [];

		setTimeout(() => initializeBoss(chat), MinionSettings.bossCooldown * 1000);

		return;
	}

	chat.say(global.channel, "The hunt has started! Let's see who survive...");
	global.boss.cooldown = false;
	global.boss.running = true;
	global.boss.queuing = false;

	// do stuff

	chat.say(global.channel, "The boss has has ended!");

	global.boss.cooldown = true;
	global.boss.running = false;
	global.boss.queuing = false;
	global.boss.lastBoss = DateTime.utc();
	global.boss.players = [];

	setTimeout(() => initializeBoss(chat), MinionSettings.bossCooldown * 1000);
};