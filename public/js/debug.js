function assert(b, msg) {
	if (b) return;
	if (msg == null) {
		msg = "assertion failed";
	} else {
		msg = "assertion failed: " + msg;
	}
	throw new Error(msg);
}

let _debugOutput = {};
function setDebugOutput(k, v) {
	if (typeof v !== "string") v = JSON.stringify(v);
	if (_debugOutput[k] === v) return;
	_debugOutput[k] = v;
	// show the output

	const keys = Object.keys(_debugOutput);
	keys.sort();
	const htmlContent = keys.map((k) => {
		return k + ": " + _debugOutput[k];
	}).join("<br>");

	document.getElementById("debug_div").innerHTML = htmlContent;
}
