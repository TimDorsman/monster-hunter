import type { BattleAction } from "~/types/abilities";
import type { BattleGameSettings } from "~/types/game-settings";
import type { BattleStateMessage, ConnectionStatus } from "~/types/battle";

type UseBattleSocketOptions = {
	playerId: string;
	playerName: string;
	getPlayerLevel: () => number;
	getPlayerExperience: () => number;
	getGameSettings: () => BattleGameSettings;
	onStateMessage: (message: BattleStateMessage) => void;
};

type IncomingMessage = BattleStateMessage | { type: "pong" };

function getSocketUrl() {
	if (!import.meta.client) {
		return "";
	}

	const { protocol, host } = window.location;
	const wsProtocol = protocol === "https:" ? "wss" : "ws";
	return `${wsProtocol}://${host}/api/battle.ws`;
}

async function readSocketMessageData(data: unknown) {
	if (typeof data === "string") {
		return data;
	}
	if (data instanceof Blob) {
		return await data.text();
	}
	if (data instanceof ArrayBuffer) {
		return new TextDecoder().decode(new Uint8Array(data));
	}
	if (data instanceof Uint8Array) {
		return new TextDecoder().decode(data);
	}
	return "";
}

export function useBattleSocket(options: UseBattleSocketOptions) {
	const connectionStatus = ref<ConnectionStatus>("disconnected");

	let ws: WebSocket | null = null;
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	let pingTimer: ReturnType<typeof setInterval> | null = null;
	let pongWatchdogTimer: ReturnType<typeof setInterval> | null = null;
	let lastPongAt = 0;
	let manuallyClosed = false;

	function sendMessage(payload: unknown) {
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			return;
		}
		ws.send(JSON.stringify(payload));
	}

	function sendAction(action: BattleAction) {
		sendMessage({
			type: "action",
			action,
		});
	}

	function sendNewMonster() {
		sendMessage({
			type: "new_monster",
		});
	}

	function sendSettings(settings: BattleGameSettings) {
		sendMessage({
			type: "update_settings",
			settings,
		});
	}

	function startConnectionMonitors() {
		lastPongAt = Date.now();
		if (pingTimer) {
			clearInterval(pingTimer);
		}
		if (pongWatchdogTimer) {
			clearInterval(pongWatchdogTimer);
		}

		pingTimer = setInterval(() => {
			sendMessage({
				type: "ping",
			});
		}, 3000);

		pongWatchdogTimer = setInterval(() => {
			if (connectionStatus.value !== "connected") {
				return;
			}
			const now = Date.now();
			if (now - lastPongAt <= 9000) {
				return;
			}
			connectionStatus.value = "disconnected";
			if (ws) {
				ws.close();
			}
		}, 1000);
	}

	function stopConnectionMonitors() {
		if (pingTimer) {
			clearInterval(pingTimer);
			pingTimer = null;
		}
		if (pongWatchdogTimer) {
			clearInterval(pongWatchdogTimer);
			pongWatchdogTimer = null;
		}
	}

	function applyIncomingMessage(message: IncomingMessage) {
		if (message.type === "state") {
			options.onStateMessage(message);
			return;
		}
		lastPongAt = Date.now();
	}

	function connect() {
		if (!import.meta.client) {
			return;
		}
		if (ws && ws.readyState === WebSocket.OPEN) {
			return;
		}

		connectionStatus.value = "connecting";
		ws = new WebSocket(getSocketUrl());
		ws.binaryType = "arraybuffer";

		ws.addEventListener("open", () => {
			connectionStatus.value = "connected";
			startConnectionMonitors();
			sendMessage({
				type: "join",
				playerId: options.playerId,
				name: options.playerName,
				level: options.getPlayerLevel(),
				experience: options.getPlayerExperience(),
			});
			sendSettings(options.getGameSettings());
		});

		ws.addEventListener("message", async (event) => {
			const textPayload = await readSocketMessageData(event.data);
			if (!textPayload) {
				return;
			}

			let parsedMessage: unknown;
			try {
				parsedMessage = JSON.parse(textPayload);
			} catch {
				return;
			}

			if (!parsedMessage || typeof parsedMessage !== "object" || !("type" in parsedMessage)) {
				return;
			}

			const messageType = (parsedMessage as { type: string }).type;
			if (messageType !== "state" && messageType !== "pong") {
				return;
			}

			applyIncomingMessage(parsedMessage as IncomingMessage);
		});

		ws.addEventListener("close", () => {
			connectionStatus.value = "disconnected";
			stopConnectionMonitors();
			ws = null;
			if (manuallyClosed) {
				return;
			}
			if (reconnectTimer) {
				clearTimeout(reconnectTimer);
			}
			reconnectTimer = setTimeout(() => {
				connect();
			}, 1500);
		});

		ws.addEventListener("error", () => {
			connectionStatus.value = "disconnected";
		});
	}

	function disconnect() {
		manuallyClosed = true;
		stopConnectionMonitors();
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
			reconnectTimer = null;
		}
		if (ws) {
			ws.close();
		}
	}

	function handleOffline() {
		connectionStatus.value = "disconnected";
		if (ws) {
			ws.close();
		}
	}

	function handleOnline() {
		if (connectionStatus.value === "connected") {
			return;
		}
		connect();
	}

	if (import.meta.client) {
		window.addEventListener("offline", handleOffline);
		window.addEventListener("online", handleOnline);
	}

	onBeforeUnmount(() => {
		disconnect();
		if (import.meta.client) {
			window.removeEventListener("offline", handleOffline);
			window.removeEventListener("online", handleOnline);
		}
	});

	return {
		connectionStatus,
		connect,
		disconnect,
		sendAction,
		sendNewMonster,
		sendSettings,
	};
}
