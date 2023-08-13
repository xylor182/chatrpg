import Discord from 'discord.js';
import { secrets } from "../configs/index.js";
import { generateLog, printLog } from '../utils/logs.js';

export function run() {
    const client = new Discord.Client();
    client.login(secrets.discord.identity.token);

    client.on('ready', () => {
		printLog("Discord client connected.");
    });

    client.on('error', (err) => {
		generateLog('discord', err)
    });

    client.on('message', (message, err) => {
        // console.log('Message', message);
    });

    return client;
}

export default run;