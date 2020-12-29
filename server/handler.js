// TODO: share code
const PLAYER_BLUE   = "blue";
const PLAYER_PURPLE = "purple";
const PLAYER_SPECTATOR = "spectator";

function generateId() {
	let id = "";
	const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	for (let i = 0; i < 8; i++) {
		id += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return id;
}

exports.handleConnection = function handleConnection(ws) {
	const clientId = generateId();
	const role = getAvailableRole();
	connectedSockets[clientId] = {
		recvCount: 0,
		sendCount: 0,
		role: role,
		sendObj(obj) {
			this.sendCount++;
			ws.send(JSON.stringify(obj));
		}
	};

	console.log("new connection:", clientId, "role:", role);

	ws.on("message", onMesssage);
	ws.on("close", onClose);

	function onMesssage(message) {
		connectedSockets[clientId].recvCount++;
		try {
			var obj = JSON.parse(message);
		} catch (e) {
			console.log("received bad message:", message);
			// gtfo
			return void ws.close();
		}

		handleRequest(clientId, obj);
	}

	function onClose() {
		// logging
		const {role, recvCount, sendCount} = connectedSockets[clientId];
		console.log("closed:", clientId, "role:", role, "s:", recvCount, "r:", sendCount);

		// cleanup
		ws.removeListener("message", onMesssage);
		ws.removeListener("close", onClose);
		delete connectedSockets[clientId];
	}

	connectedSockets[clientId].sendObj({
		command: "welcome",
		role,
		state: boardState,
	});
};

// mapping from clientId -> {sendObj(), ...}
const connectedSockets = {};

// TODO: persist this database
const boardState = {};

function handleRequest(clientId, obj) {
	// update database
	if (obj.diff != null) {
		for (let handle in obj.diff) {
			const v = obj.diff[handle];
			if (v != null) {
				boardState[handle] = v;
			} else {
				delete boardState[handle];
			}
		}
		delete obj.diff;
	}

	broadcastObj(clientId, obj);
}

function broadcastObj(originatorClientId, obj) {
	for (let clientId in connectedSockets) {
		if (clientId === originatorClientId) continue;
		connectedSockets[clientId].sendObj(obj);
	}
}

function getAvailableRole() {
	const roleOrder = [
		PLAYER_BLUE,
		PLAYER_PURPLE,
	];
	const availableRoles = {}
	for (let role of roleOrder) {
		availableRoles[role] = true;
	}

	// eliminate taken roles
	for (let clientId in connectedSockets) {
		const {role} = connectedSockets[clientId];
		if (role in availableRoles) {
			delete availableRoles[role];
		}
	}

	// pick an available role
	for (let role of roleOrder) {
		if (availableRoles[role]) return role;
	}

	// no available roles
	return PLAYER_SPECTATOR;
}
