import { twitch, database } from './secrets.js';
import { settings as config } from './config.js';
import { settings as MinionSettings } from './minions.js';

const secrets = { twitch, database };

export { secrets, config, MinionSettings };