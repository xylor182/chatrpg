import WebSocket from "ws";
import axios from "axios";
import { PubsubSettings, secrets } from "../configs/index.js";
import { printLog } from "../utils/logs.js";
import { getTicks, nonce } from "../utils/utils.js";
import { MessageEmbed } from "discord.js";

async function getAccessToken() {
    try {
        const response = await axios({
            method: "post",
            url: "https://id.twitch.tv/oauth2/token",
            params: {
                grant_type: "refresh_token",
                refresh_token: secrets.pubsub.identity.refreshToken,
                client_id: secrets.pubsub.identity.clientId,
                client_secret: secrets.pubsub.identity.clientSecret,
            },
        });

        return response.data.access_token;
    } catch (err) {
        generateLog("twitch", err);
    }
}

export async function run() {
    const client = new WebSocket("wss://pubsub-edge.twitch.tv");
    let token = null;
    let heartbeatHandler = null;
    let ping = 0;
    let ticks = null;

    function heartbeat() {
        ticks = getTicks();
        const message = {
            type: "PING",
        };

        client.send(JSON.stringify(message));
    }

    function listen() {
        const message = {
            type: "LISTEN",
            data: {
                topics: PubsubSettings.topics,
                nonce: nonce(15),
                auth_token: token,
            },
        };

        client.send(JSON.stringify(message));
        printLog("Now listening to mod commands.");
    }

    client.on("open", async () => {
        printLog("Pubsub client connected.");

        token = await getAccessToken();
        listen();

        heartbeat();
        heartbeatHandler = setInterval(() => heartbeat(), PubsubSettings.heartbeat);
    });

    client.on("message", async (rawData) => {
        const event = JSON.parse(rawData);
        const actions = PubsubSettings.events;

        if (event.type === "PONG") {
            printLog(`Pubsub heartbeat (Ping: ${getTicks() - ticks}ms).`);
        } else if (event.type === "MESSAGE") {
            const { data } = JSON.parse(event.data.message);
            if (actions.includes(data.moderation_action)) {
                if (data.moderation_action === "timeout") {
                    const embed = new MessageEmbed().setTitle(`${data.target_user_login} timed out from timmac`);
                    embed.setColor("#ffba08");
                    embed.setDescription(
                        `\`${data.target_user_login}\` has been timed out by \`${data.created_by}\` for \`${data.args[1]} secs\` with the reason being: \`${data.args[2]}\``
                    );
					embed.setTimestamp();

					global.discordClient.channels.cache.get('305315929955237899').send(embed);
                }
                console.log("action", data);
            } else {
                console.log("unknown action", data);
            }
        }
    });

    return client;
}

export default run;
