import Twitch from './src/clients/twitch.js';
import MongoServer, { mongoose } from './src/clients/database.js';
import { config } from './src/configs/index.js';
import fs from 'fs';
import path from 'path';

async function run() {
	global.debug = true;
	global.channel = global.debug ? config.debugChannel : config.channel;
	global.maintenance = false;

	try {
		fs.readFileSync(path.resolve(process.cwd(), "./src/config/secrets.js"));
	} catch {
		console.log("ATTENTION: You need to create a secrets.js file in the src/config folder. You have a secrets.js.example file to help you.")
		process.exit(1);
	}

	// initialize mongoDB connection
	MongoServer().then(() => {
		if (global.debug) console.log("MongoDB connection established.");
	}).catch(err => {
		console.log('Atlas connection error: ', err);
		process.exit(1);
	});

	global.twitchClient = Twitch();

	// deal with shutdown gracefully
	process.on('SIGINT', () => {
		try {
			mongoose.disconnect();
			console.log('Mongoose disconnected on app termination');
		} catch (error) {
			console.error('error on close', error);
		}
	});
}

run();