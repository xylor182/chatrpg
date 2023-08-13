import { DateTime } from 'luxon';

export const printLog = (message, debug) => {
    const now = DateTime.utc().toFormat('dd/MM/yyyy hh:mm');
    console.log(`${debug ? '[debug]' : ''}[${now}] ${message}`);
}

export const generateLog = (platform, error) => {
    // do something with error
    const now = DateTime.utc().toFormat('dd/MM/yyyy hh:mm');
    console.log(`[${now}] There was an error on ${platform}:`);
    console.log(error);
}