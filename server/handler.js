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
	connectedSockets[clientId] = {
		recvCount: 0,
		sendCount: 0,
		sendObj(obj) {
			this.sendCount++;
			ws.send(JSON.stringify(obj));
		}
	};
	console.log("handling connection:", clientId);

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

		broadcastObj(clientId, obj);
	}

	function onClose() {
		// logging
		const {recvCount, sendCount} = connectedSockets[clientId];
		console.log("closed:", clientId, "s:", recvCount, "r:", sendCount);

		// cleanup
		ws.removeListener("message", onMesssage);
		ws.removeListener("close", onClose);
		delete connectedSockets[clientId];
	}

	connectedSockets[clientId].sendObj({"command": "welcome"});
};

// mapping from clientId -> {sendObj(), ...}
const connectedSockets = {};

function broadcastObj(originatorClientId, obj) {
	for (let clientId in connectedSockets) {
		if (clientId === originatorClientId) continue;
		connectedSockets[clientId].sendObj(obj);
	}
}
