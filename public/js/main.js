let boardState = new BoardState();

function refreshObject(handle) {
	const objectInfo = boardState.getObjectInfo(handle);
	refreshGraphics(handle, objectInfo);
}

function buildBuilding(x, y) {
	const handle = boardState.buildBuilding(x, y);
	refreshObject(handle);
}

function buildDome(x, y) {
	const handle = boardState.buildDome(x, y);
	refreshObject(handle);
}

function createPawn(x, y, objectType) {
	const handle = boardState.createPawn(x, y, objectType);
	refreshObject(handle);
}
createPawn(-2, -2, OBJECT_TYPE_PAWN_BLUE_F);
createPawn(-1, -2, OBJECT_TYPE_PAWN_BLUE_M);
createPawn(0, -2, OBJECT_TYPE_PAWN_PURPLE_F);
createPawn(1, -2, OBJECT_TYPE_PAWN_PURPLE_M);

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
	//movingPawnBoardPosition: {x, y},
	//pendingDomeBuild: true,
	//pendingUndo: true,
};
function doActionAtPosition(x, y) {
	const {buildingHeight, occupantHandle} = boardState.getBuildingTop(x, y);
	let occupantObjectType = null;
	if (occupantHandle != null) {
		occupantObjectType = boardState.getObjectInfo(occupantHandle).objectType;
	}
	const {movingPawnBoardPosition, pendingDomeBuild, pendingUndo} = inputState;
	if (movingPawnBoardPosition != null) {
		// pawn move in progress.

		if (occupantHandle == null) {
			// move pawn into empty space.
			const handle = boardState.movePawn(
				movingPawnBoardPosition.x, movingPawnBoardPosition.y,
				x, y);
			refreshObject(handle);
			inputState = {};
		} else if (occupantObjectType === OBJECT_TYPE_DOME) {
			// pawns can never move into domes.
		} else if (objectTypeIsPawn(occupantObjectType)) {
			// moving a pawn onto a pawn
			if (movingPawnBoardPosition.x === x && movingPawnBoardPosition.y === y) {
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
				const handle = boardState.removeBuilding(x, y);
				refreshObject(handle);
			}
		} else if (occupantObjectType === OBJECT_TYPE_DOME) {
			const handle = boardState.removeDome(x, y);
			refreshObject(handle);
		} else if (objectTypeIsPawn(occupantObjectType)) {
			// This is not how you kill a pawn.
		} else assert(false);
		inputState = {};
	} else {
		// build clicking

		if (occupantHandle == null) {
			// build building
			const height = buildingHeight + 1;
			if (height === 4 || pendingDomeBuild) {
				buildDome(x, y);
			} else {
				buildBuilding(x, y);
			}
			inputState = {};
		} else if (occupantObjectType === OBJECT_TYPE_DOME) {
			// can't interact with domes.
		} else if (objectTypeIsPawn(occupantObjectType)) {
			// start a pawn move.
			inputState = {movingPawnBoardPosition: {x, y}};
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
	setTimeout(doSomethingOrWhatever, 3000);
	function doSomethingOrWhatever() {
		if (!isConnected()) return;
		sendObj({"command": "ping"});
	}
}
function onWebSocketObj(obj) {
	console.log("got message", obj);
}


// begin
animate();
openWebSocket();
