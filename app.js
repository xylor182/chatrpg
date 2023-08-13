import Twitch from './src/clients/twitch.js';
import MongoServer, { mongoose } from './src/clients/database.js';
import { config } from './src/configs/index.js';

function run() {
	global.debug = true;
	global.channel = global.debug ? config.debugChannel : config.channel;
	global.maintenance = false;

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