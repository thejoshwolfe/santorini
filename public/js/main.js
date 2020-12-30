let boardState = new BoardState();
let role = null;

// State changes
function buildBuilding(x, y, objectType) {
	if (boardState.getRemainingCount(objectType) <= 0) return;
	_sendAndRefresh(
		boardState.buildBuilding(x, y, objectType),
		{command: "buildBuilding", x, y, objectType});
}

function buildDome(x, y) {
	if (boardState.getRemainingCount(OBJECT_TYPE_DOME) <= 0) return;
	_sendAndRefresh(
		boardState.buildDome(x, y),
		{command: "buildDome", x, y});
}

function createPawn(x, y, objectType) {
	if (boardState.getRemainingCount(objectType) <= 0) return;
	_sendAndRefresh(
		boardState.createPawn(x, y, objectType),
		{command: "createPawn", x, y, objectType});
}
function movePawn(fromX, fromY, toX, toY) {
	_sendAndRefresh(
		boardState.movePawn(fromX, fromY, toX, toY),
		{command: "movePawn", fromX, fromY, toX, toY});
}

function removeTopOfStack(x, y) {
	_sendAndRefresh(
		boardState.removeTopOfStack(x, y),
		{command: "removeTopOfStack", x, y});
}

function _sendAndRefresh(handle, obj) {
	_refreshObject(handle);
	obj.diff = {[handle]: boardState.getObjectInfo(handle)};
	sendObj(obj);
}
function _refreshObject(handle) {
	const objectInfo = boardState.getObjectInfo(handle);
	refreshGraphics(handle, objectInfo);
}
function _refreshAllObjects(allHandles) {
	clearAllGraphics();
	for (let handle of allHandles) {
		_refreshObject(handle);
	}
}

function receiveObj(obj) {
	switch (obj.command) {
		case "welcome":
			boardState = new BoardState(obj.state);
			_refreshAllObjects(Object.keys(obj.state));
			role = obj.role;
			whoseTurn = obj.whoseTurn;
			return;

		case "buildBuilding":
			return _refreshObject(boardState.buildBuilding(obj.x, obj.y, obj.objectType));
		case "buildDome":
			return _refreshObject(boardState.buildDome(obj.x, obj.y));
		case "createPawn":
			return _refreshObject(boardState.createPawn(obj.x, obj.y, obj.objectType));
		case "movePawn":
			return _refreshObject(boardState.movePawn(obj.fromX, obj.fromY, obj.toX, obj.toY));
		case "removeTopOfStack":
			return _refreshObject(boardState.removeTopOfStack(obj.x, obj.y));

		case "turnEnded":
			whoseTurn = obj.whoseTurn;
			return;
	}

	console.log("unrecognized command:", obj);
}

let whoseTurn = null;
function isMyTurn() {
	return isConnected() && whoseTurn === role;
}
function endTurn() {
	if (!isMyTurn()) return;
	// expect that it isn't our turn anymore.
	whoseTurn = null;
	sendObj({command: "endTurn"});
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
		case "e":
			endTurn();
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

// Buttons
window.document.getElementById("cancel_button").addEventListener("click", function() {
	inputState = {};
});
window.document.getElementById("create_pawn_blue_f_button").addEventListener("click", function() {
	inputState = {pendingPawnCreation: OBJECT_TYPE_PAWN_BLUE_F};
});
window.document.getElementById("create_pawn_blue_m_button").addEventListener("click", function() {
	inputState = {pendingPawnCreation: OBJECT_TYPE_PAWN_BLUE_M};
});
window.document.getElementById("create_pawn_purple_f_button").addEventListener("click", function() {
	inputState = {pendingPawnCreation: OBJECT_TYPE_PAWN_PURPLE_F};
});
window.document.getElementById("create_pawn_purple_m_button").addEventListener("click", function() {
	inputState = {pendingPawnCreation: OBJECT_TYPE_PAWN_PURPLE_M};
});
window.document.getElementById("build_dome_button").addEventListener("click", function() {
	inputState = {pendingDomeBuild: true};
});
window.document.getElementById("undo_button").addEventListener("click", function() {
	inputState = {pendingUndo: true};
});
window.document.getElementById("kill_pawn_button").addEventListener("click", function() {
	inputState = {pendingKill: true};
});
window.document.getElementById("end_turn_button").addEventListener("click", function() {
	endTurn();
});

function refreshButtonStates() {
	function setElementClass(elementId, className, value) {
		window.document.getElementById(elementId).classList.toggle(className, value);
	}
	function setElementShown(elementId, value) {
		setElementClass(elementId, "hidden", !value);
	}
	function setElementActive(elementId, value) {
		setElementClass(elementId, "active_button", !!value);
	}
	function setElementEnabled(elementId, value) {
		window.document.getElementById(elementId).disabled = !value;
	}

	setElementEnabled("cancel_button", Object.keys(inputState).length > 0);

	setElementShown("create_pawn_blue_f_button", boardState.getRemainingCount(OBJECT_TYPE_PAWN_BLUE_F) > 0);
	setElementShown("create_pawn_blue_m_button", boardState.getRemainingCount(OBJECT_TYPE_PAWN_BLUE_M) > 0);
	setElementShown("create_pawn_purple_f_button", boardState.getRemainingCount(OBJECT_TYPE_PAWN_PURPLE_F) > 0);
	setElementShown("create_pawn_purple_m_button", boardState.getRemainingCount(OBJECT_TYPE_PAWN_PURPLE_M) > 0);
	setElementEnabled("create_pawn_blue_f_button", isMyTurn());
	setElementEnabled("create_pawn_blue_m_button", isMyTurn());
	setElementEnabled("create_pawn_purple_f_button", isMyTurn());
	setElementEnabled("create_pawn_purple_m_button", isMyTurn());
	setElementActive("create_pawn_blue_f_button", inputState.pendingPawnCreation === OBJECT_TYPE_PAWN_BLUE_F);
	setElementActive("create_pawn_blue_m_button", inputState.pendingPawnCreation === OBJECT_TYPE_PAWN_BLUE_M);
	setElementActive("create_pawn_purple_f_button", inputState.pendingPawnCreation === OBJECT_TYPE_PAWN_PURPLE_F);
	setElementActive("create_pawn_purple_m_button", inputState.pendingPawnCreation === OBJECT_TYPE_PAWN_PURPLE_M);

	setElementEnabled("build_dome_button", isMyTurn() && boardState.getRemainingCount(OBJECT_TYPE_DOME) > 0);
	setElementActive("build_dome_button", inputState.pendingDomeBuild);
	setElementEnabled("kill_pawn_button", isMyTurn());
	setElementActive("kill_pawn_button", inputState.pendingKill);
	setElementEnabled("undo_button", isMyTurn());
	setElementActive("undo_button", inputState.pendingUndo);

	setElementEnabled("end_turn_button", isMyTurn());
}

// input state
let inputState = {
	//movingPawnPosition: {x, y},
	//pendingDomeBuild: true,
	//pendingUndo: true,
	//pendingPawnCreation: OBJECT_TYPE_PAWN_BLUE_F,
	//pendingKill: true,
};
function doActionAtPosition(x, y) {
	if (!isMyTurn()) return; // please hold

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
				removeTopOfStack(x, y);
			}
		} else if (occupantObjectType === OBJECT_TYPE_DOME) {
			removeTopOfStack(x, y);
		} else if (objectTypeIsPawn(occupantObjectType)) {
			// This is not how you kill a pawn.
		} else assert(false);
		inputState = {};

	} else if (pendingKill) {
		// kill
		if (objectTypeIsPawn(occupantObjectType)) {
			removeTopOfStack(x, y);
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
					buildBuilding(x, y, buildingHeightToObjectType(height));
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
	refreshButtonStates();
	renderer.render(scene, camera);

	// debug stuff
	setDebugOutput("mouse", mouseOverPosition);
	setDebugOutput("input", inputState);
	setDebugOutput("connected", isConnected());
	setDebugOutput("role", role);
	setDebugOutput("whoseTurn", whoseTurn);
}

// web socket api
function onWebSocketOpen() {}
function onWebSocketObj(obj) {
	receiveObj(obj);
}


// begin
animate();
openWebSocket();
