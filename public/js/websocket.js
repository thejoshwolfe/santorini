let _theWebSocket = null;
const _wsUrl = (() => {
	var host = window.document.location.host;
	var pathname = window.document.location.pathname;
	var isHttps = window.document.location.protocol === "https:";
	var match = host.match(/^(.+):(\d+)$/);
	var defaultPort = isHttps ? 443 : 80;
	var port = match ? parseInt(match[2], 10) : defaultPort;
	var hostName = match ? match[1] : host;
	var wsProto = isHttps ? "wss:" : "ws:";
	var wsUrl = wsProto + "//" + hostName + ":" + port + pathname;
	return wsUrl;
})();

function openWebSocket() {
	const ws = new WebSocket(_wsUrl);

	ws.addEventListener("open", onOpen);
	ws.addEventListener("close", onClose);
	ws.addEventListener("error", onError);
	ws.addEventListener("message", onMessage);

	function cleanupWaitReconnect() {
		ws.removeEventListener("open", onOpen);
		ws.removeEventListener("close", onClose);
		ws.removeEventListener("error", onError);
		ws.removeEventListener("message", onMessage);
		_theWebSocket = null;

		// wait a bit and try again
		setTimeout(openWebSocket, 1000);
	}

	function onOpen() {
		console.log("websocket open");
		_theWebSocket = ws;
		onWebSocketOpen();
	}

	function onClose(ev) {
		console.log("websocket close:", ev);
		cleanupWaitReconnect();
	}

	function onError(ev) {
		console.log("websocket error:", ev);
		cleanupWaitReconnect();
	}

	function onMessage(ev) {
		try {
			var obj = JSON.parse(ev.data);
		} catch (e) {
			console.log("received bad message: " + ev.data);
			return;
		}
		onWebSocketObj(obj);
	}
}
function isConnected() {
	return _theWebSocket != null;
}
function sendObj(obj) {
	assert(isConnected());
	const data = JSON.stringify(obj);
	_theWebSocket.send(data);
}
