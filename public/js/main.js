const scene = new THREE.Scene();
const fieldOfViewDegrees = 40;
const camera = new THREE.PerspectiveCamera(fieldOfViewDegrees, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// layer allocations
const RENDER_LAYER = 0; // enabled by default
const INTERACT_LAYER = 1;

// ground
const theGround = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 5), cliffMaterial);
theGround.position.set(0, -0.50, 0);
theGround.layers.enable(INTERACT_LAYER);
scene.add(theGround);

const boardPlane = new THREE.PlaneGeometry(5, 5);
boardPlane.rotateX(-Math.PI / 2);
const grassField = new THREE.Mesh(boardPlane, grassMaterial);
grassField.position.set(0, 0, 0);
scene.add(grassField);


// cubes
const blockSideLengths = [
	0.9, // base
	0.8, // mid
	0.7, // top
];
const blockHeights = [
	0.6,  // base
	0.55, // mid
	0.5,  // top
];
const elevationLevels = [
	0,
	blockHeights[0],
	blockHeights[0] + blockHeights[1],
	blockHeights[0] + blockHeights[1] + blockHeights[2],
];
const blockYPositions = [
	elevationLevels[0] + blockHeights[0] / 2,
	elevationLevels[1] + blockHeights[1] / 2,
	elevationLevels[2] + blockHeights[2] / 2,
];
const blockGeometries = [0, 1, 2].map(i => {
	return new THREE.BoxGeometry(blockSideLengths[i], blockHeights[i], blockSideLengths[i]);
});

let boardState = new BoardState();

function createBuilding(x, y, height) {
	const i = height - 1;

	const block = new THREE.Mesh(blockGeometries[i], buildingMaterial);
	block.position.set(x, blockYPositions[i], y);
	block.userData.boardPosition = {x, y, height};
	block.layers.enable(INTERACT_LAYER);
	boardState.placeBuilding(block);
	scene.add(block);
}

[
	[0, 0, 3],
	[1, 2, 2],
	[-1, 0, 1],
	[1, 0, 1],

	[-1, -1, 1],
	[0, -1, 2],
	[1, -1, 3],
	[-1, -2, 1],
	[0, -2, 2],
	[1, -2, 3],
].forEach(([x, y, stackHeight]) => {
	[0, 1, 2].forEach(i => {
		const height = i + 1;
		if (height > stackHeight) return;
		createBuilding(x, y, height);
	});
});

function createDome(x, y) {
	const height = boardState.getBuildingHeight(x, y) + 1;
	const dome = new THREE.Mesh(domeGeometry, domeMaterial);
	dome.position.set(x, elevationLevels[height - 1] + domeHeight - domeRadius, y);
	dome.userData.boardPosition = {x, y, height};
	dome.layers.enable(INTERACT_LAYER);
	boardState.placeDome(dome);
	scene.add(dome);
}

[
	[-2, -1],
	[-1, -1],
	[0, -1],
	[1, -1],
].forEach(([x, y]) => {
	createDome(x, y);
});

function createPawn(x, y, player) {
	const material = playerToPawnMaterial[player];
	const cone = new THREE.Mesh(coneGeometry, material);
	const height = boardState.getBuildingHeight(x, y) + 1;
	cone.position.set(x, elevationLevels[height - 1] + coneHeight / 2, y);
	cone.userData.boardPosition = {x, y, height};
	cone.layers.enable(INTERACT_LAYER);
	boardState.placePawn(cone, player);
	scene.add(cone);
}

[
	[-2, -2, PLAYER_BLUE],
	[-1, -2, PLAYER_BLUE],
	[0, -2, PLAYER_PURPLE],
	[1, -2, PLAYER_PURPLE],
].forEach(([x, y, player]) => {
	createPawn(x, y, player);
});

addLighting(scene);

// camera
let cameraAngleY = 0;
let cameraAngleDown = 0.95;
function rotateView2d(deltaY, deltaDown) {
	cameraAngleDown = clamp(cameraAngleDown + deltaDown, 0, Math.PI/2);
	rotateViewY(deltaY);
}
function clamp(x, lowerBound, upperBound) {
	assert(lowerBound <= upperBound);
	if (x < lowerBound) return lowerBound;
	if (x > upperBound) return upperBound;
	return x;
}
function rotateViewY(delta) {
	const viewRadius = 9 / (fieldOfViewDegrees/180 * Math.PI);
	cameraAngleY += delta;
	camera.position.set(
		viewRadius * Math.cos(cameraAngleY) * Math.cos(cameraAngleDown),
		viewRadius * Math.sin(cameraAngleDown),
		viewRadius * Math.sin(cameraAngleY) * Math.cos(cameraAngleDown));
	camera.lookAt(0, 0, 0);
}
// initialize camera position
rotateViewY(Math.PI/4);


// mouse support
// each coord in the range (-1, +1).
const mousePosition = new THREE.Vector2();
let mouseBoardPosition = null; // {x, y, height};

function updateMouseOverObject() {
	mouseBoardPosition = (() => {
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
			({x, y} = object.userData.boardPosition);
		}
		let height = boardState.getBuildingHeight(x, y);
		// we interact with the space above the floor.
		height += 1;
		return {x, y, height};
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
		updateMouseOverObject();
	} else {
		// normal movement
		updateMouseOverObject();
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
			if (mouseBoardPosition == null) return;
			const {x, y, height} = mouseBoardPosition;
			doActionAtPosition(x, y, height);
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


// input state
let movingPawnBoardPosition = null; // {x, y, height};
function doActionAtPosition(x, y, height) {
	const occupant = boardState.getOccupant(x, y);
	if (movingPawnBoardPosition != null) {
		// pawn move in progress.

		if (occupant == null) {
			// move pawn into empty space.
			const cone = boardState.movePawn(
				movingPawnBoardPosition.x, movingPawnBoardPosition.y, movingPawnBoardPosition.height,
				x, y, height);
			cone.position.set(x, elevationLevels[height - 1] + coneHeight / 2, y);
			cone.userData.boardPosition = {x, y, height};
			movingPawnBoardPosition = null;
		} else if (occupant[0] === "dome") {
			// pawns can never move into domes.
		} else if (occupant[0] === "pawn") {
			// moving a pawn onto a pawn
			if (movingPawnBoardPosition.x === x && movingPawnBoardPosition.y === y) {
				// moving a pawn to its own position means cancel movement.
				movingPawnBoardPosition = null;
			} else {
				// TODO: Minotaur/Apollo can move into opponents spaces.
			}
		} else assert(false);
	} else {
		// normal clicking

		if (occupant == null) {
			// build building
			if (height <= 3) {
				createBuilding(x, y, height);
			} else if (height == 4) {
				createDome(x, y);
			}
		} else if (occupant[0] === "dome") {
			// can't interact with domes.
		} else if (occupant[0] === "pawn") {
			// start a pawn move.
			movingPawnBoardPosition = {x, y, height};
		} else assert(false);
	}
	updateMouseOverObject();
}


// main loop
function animate() {
	requestAnimationFrame(animate);

	// render
	renderer.render(scene, camera);
}

// begin
animate();
