const fs = require("fs");
const WebSocketServer = require("ws").Server;
const express = require("express");

const {handleConnection} = require("./handler.js");

// argv
if (process.argv.filter(s => s[0] === "-").length > 0 || process.argv.length !== 4) {
	console.log("usage: node main.js PORT PUBLIC_DIR");
	process.exit(1);
}

const port = parseInt(process.argv[2], 10);
if (isNaN(port)) throw new Error("can't parse port: " + process.argv[2]);

const publicDir = process.argv[3];
if (!fs.statSync(publicDir).isDirectory()) throw new Error("not a directory: " + publicDir);


// web server
const app = express();

// middleware for static content
app.use(express.static(publicDir));
const server = app.listen(port, function onListen() {
	console.log("listening on port: " + port)
});

const wsServer = new WebSocketServer({server});
wsServer.on("connection", handleConnection);
