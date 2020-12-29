let boardState = new BoardState();

// State changes
function buildBuilding(x, y) {
	_refreshObject(boardState.buildBuilding(x, y));
	sendObj({command: "buildBuilding", x, y});
}
function removeBuilding(x, y) {
	_refreshObject(boardState.removeBuilding(x, y));
	sendObj({command: "removeBuilding", x, y});
}

function buildDome(x, y) {
	_refreshObject(boardState.buildDome(x, y));
	sendObj({command: "buildDome", x, y});
}
function removeDome(x, y) {
	_refreshObject(boardState.removeDome(x, y));
	sendObj({command: "removeDome", x, y});
}

function createPawn(x, y, objectType) {
	_refreshObject(boardState.createPawn(x, y, objectType));
	sendObj({command: "createPawn", x, y, objectType});
}
function killPawn(x, y) {
	_refreshObject(boardState.killPawn(x, y));
	sendObj({command: "killPawn", x, y});
}
function movePawn(fromX, fromY, toX, toY) {
	_refreshObject(boardState.movePawn(fromX, fromY, toX, toY));
	sendObj({command: "movePawn", fromX, fromY, toX, toY});
}

function _refreshObject(handle) {
	const objectInfo = boardState.getObjectInfo(handle);
	refreshGraphics(handle, objectInfo);
}

function receiveObj(obj) {
	switch (obj.command) {
		case "welcome": return;
		case "buildBuilding":
			return _refreshObject(boardState.buildBuilding(obj.x, obj.y));
		case "removeBuilding":
			return _refreshObject(boardState.removeBuilding(obj.x, obj.y));
		case "buildDome":
			return _refreshObject(boardState.buildDome(obj.x, obj.y));
		case "removeDome":
			return _refreshObject(boardState.removeDome(obj.x, obj.y));
		case "createPawn":
			return _refreshObject(boardState.createPawn(obj.x, obj.y, obj.objectType));
		case "killPawn":
			return _refreshObject(boardState.killPawn(obj.x, obj.y));
		case "movePawn":
			return _refreshObject(boardState.movePawn(obj.fromX, obj.fromY, obj.toX, obj.toY));
	}

	console.log("unrecognized command:", obj);
}

// mouse support
// each coord in the range (-1, +1).
const mousePosition = new THREE.Vector2();
let mouseOverPosition = null; // {x, y};

function updateMouseOverPosition() {
	mouseOverPosition = (() => {
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mousePosition, camera);
		raycaster.layers.set(INTERACT_LAYER);
		const intersects = raycaster.intersectObjects(scene.children);
		if (intersects.length == 0) return null;
		// select the nearest one.
		intersects.sort((a, b) => {
			return a.distance - b.distance;
		});
		const {object, point} = intersects[0];
		let x, y;
		if (object === theGround) {
			x = Math.floor(point.x + 0.5);
			y = Math.floor(point.z + 0.5);
		} else {
			({x, y} = boardState.getObjectInfo(object.userData.handle));
		}
		return {x, y};
	})();
}
function onMouseMove(event) {
	mousePosition.x = event.clientX / window.innerWidth * 2 - 1;
	mousePosition.y = -(event.clientY / window.innerHeight * 2 - 1);

	if (isDragingView) {
		// right click drag
		const {movementX, movementY} = event;
		const dragCameraScaleX = Math.PI / window.innerWidth;
		const dragCameraScaleY = Math.PI / window.innerHeight;
		// update mouse over object given the new camera position
		rotateView2d(movementX * dragCameraScaleX, movementY * dragCameraScaleY);
		updateMouseOverPosition();
	} else {
		// normal movement
		updateMouseOverPosition();
	}
}
window.addEventListener("mousemove", onMouseMove, false);

let isDragingView = false;

const SHIFT = 1 << 0;
const CTRL  = 1 << 1;
const ALT   = 1 << 2;
const META  = 1 << 3;
function getModifiers(event) {
	let modifiers = 0;
	if (event.shiftKey) modifiers |= SHIFT;
	if (event.ctrlKey)  modifiers |= CTRL;
	if (event.altKey)   modifiers |= ALT;
	if (event.metaKey)  modifiers |= META;
	return modifiers;
}

function onMouseDown(event) {
	const modifiers = getModifiers(event);
	if (modifiers !== 0) return;
	event.preventDefault();
	switch (event.button) {
		case 0: // left click
			if (mouseOverPosition == null) return;
			const {x, y} = mouseOverPosition;
			doActionAtPosition(x, y);
			return;
		case 2: // right click
			isDragingView = true;
			return;
	}
}
window.addEventListener("mousedown", onMouseDown, false);

function onMouseUp(event) {
	isDragingView = false;
}
window.addEventListener("mouseup", onMouseUp, false);

function onContextMenu(event) {
	event.preventDefault();
	return false;
}
window.addEventListener("contextmenu", onContextMenu, false);

function onKeyDown(event) {
	const modifiers = getModifiers(event);
	if (modifiers !== 0) return;
	switch (event.key) {
		case "d":
			inputState = {pendingDomeBuild: true};
			break;
		case "z":
			inputState = {pendingUndo: true};
			break;
		case "k":
			inputState = {pendingKill: true};
			break;
		case "1":
			inputState = {pendingPawnCreation: OBJECT_TYPE_PAWN_BLUE_F};
			break;
		case "2":
			inputState = {pendingPawnCreation: OBJECT_TYPE_PAWN_BLUE_M};
			break;
		case "3":
			inputState = {pendingPawnCreation: OBJECT_TYPE_PAWN_PURPLE_F};
			break;
		case "4":
			inputState = {pendingPawnCreation: OBJECT_TYPE_PAWN_PURPLE_M};
			break;
		case "Escape":
			inputState = {};
			break;
		default:
			return;
	}
	event.preventDefault();
}
window.addEventListener("keydown", onKeyDown, false);

// input state
let inputState = {
	//movingPawnPosition: {x, y},
	//pendingDomeBuild: true,
	//pendingUndo: true,
	//pendingPawnCreation: OBJECT_TYPE_PAWN_BLUE_F,
	//pendingKill: true,
};
function doActionAtPosition(x, y) {
	if (!isConnected()) return; // please hold

	const {buildingHeight, occupantHandle} = boardState.getBuildingTop(x, y);
	let occupantObjectType = null;
	if (occupantHandle != null) {
		occupantObjectType = boardState.getObjectInfo(occupantHandle).objectType;
	}
	const {
		movingPawnPosition,
		pendingDomeBuild,
		pendingUndo,
		pendingPawnCreation,
		pendingKill,
	} = inputState;

	if (movingPawnPosition != null) {
		// pawn move in progress.
		if (occupantHandle == null) {
			// move pawn into empty space.
			movePawn(
				movingPawnPosition.x, movingPawnPosition.y,
				x, y);
			inputState = {};
		} else if (occupantObjectType === OBJECT_TYPE_DOME) {
			// pawns can never move into domes.
		} else if (objectTypeIsPawn(occupantObjectType)) {
			// moving a pawn onto a pawn
			if (movingPawnPosition.x === x && movingPawnPosition.y === y) {
				// moving a pawn to its own position means cancel movement.
				inputState = {};
			} else {
				// TODO: Minotaur/Apollo can move into opponents spaces.
			}
		} else assert(false);

	} else if (pendingUndo) {
		// unbuild
		if (occupantHandle == null) {
			if (buildingHeight > 0) {
				removeBuilding(x, y);
			}
		} else if (occupantObjectType === OBJECT_TYPE_DOME) {
			removeDome(x, y);
		} else if (objectTypeIsPawn(occupantObjectType)) {
			// This is not how you kill a pawn.
		} else assert(false);
		inputState = {};

	} else if (pendingKill) {
		// kill
		if (objectTypeIsPawn(occupantObjectType)) {
			killPawn(x, y);
			inputState = {};
		}

	} else {
		// build clicking
		if (occupantHandle == null) {
			if (pendingPawnCreation != null) {
				// create pawn
				createPawn(x, y, pendingPawnCreation);
			} else {
				// build building
				const height = buildingHeight + 1;
				if (height === 4 || pendingDomeBuild) {
					buildDome(x, y);
				} else {
					buildBuilding(x, y);
				}
			}
			inputState = {};
		} else if (occupantObjectType === OBJECT_TYPE_DOME) {
			// can't interact with domes.
		} else if (objectTypeIsPawn(occupantObjectType)) {
			// start a pawn move.
			inputState = {movingPawnPosition: {x, y}};
		} else assert(false);
	}

	updateMouseOverPosition();
}

function animate() {
	requestAnimationFrame(animate);

	// render
	renderer.render(scene, camera);

	// debug stuff
	setDebugOutput("mouse", mouseOverPosition);
	setDebugOutput("input", inputState);
}

// web socket api
function onWebSocketOpen() {
	console.log("socket open");
}
function onWebSocketObj(obj) {
	receiveObj(obj);
}


// begin
animate();
openWebSocket();
