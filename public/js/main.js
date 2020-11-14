const scene = new THREE.Scene();
const fieldOfViewDegrees = 40;
const camera = new THREE.PerspectiveCamera(fieldOfViewDegrees, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ground
const theGround = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 5), cliffMaterial);
theGround.position.set(0, -0.50, 0);
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
const blockYPositions = [
	blockHeights[0] / 2,
	blockHeights[0] + blockHeights[1] / 2,
	blockHeights[0] + blockHeights[1] + blockHeights[2] / 2,
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
	boardState.placeBuilding(block);
	scene.add(block);
}

[
	[0, 0, 3],
	[1, 2, 2],
	[-1, 0, 1],
	[1, 0, 1],
	[1, 1, 2],
].forEach(([x, y, stackHeight]) => {
	[0, 1, 2].forEach(i => {
		const height = i + 1;
		if (height > stackHeight) return;
		createBuilding(x, y, height);
	});
});

function createPawn(x, y, player) {
	const material = player ? pawnOneMaterial : pawnTwoMaterial;
	const cone = new THREE.Mesh(coneGeometry, material);
	const height = boardState.getBuildingHeight(x, y);
	cone.position.set(x, (height === 0 ? 0 : blockYPositions[height - 1]) + coneHeight, y);
	cone.userData.boardPosition = {x, y, height};
	//boardState.placePawn(cone);
	scene.add(cone);
}

[
	[0, 0, true],
	[2, 2, true],
	[1, 2, false],
	[2, 1, false],
].forEach(([x, y, player]) => {
	createPawn(x, y, player);
});

addLighting(scene);

// camera
let cameraAngleY = 0;
let cameraAngleDown = 0.95;
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
const raycaster = new THREE.Raycaster();
// each coord in the range (-1, +1).
const mousePosition = new THREE.Vector2();
let mouseBoardPosition = null; // {x, y, height};

function updateMouseOverObject() {
	raycaster.setFromCamera(mousePosition, camera);
	mouseBoardPosition = (() => {
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
		if (height === 3) return null; // TODO: domes
		// want to build one higher
		height += 1;
		return {x, y, height};
	})();
}
function onMouseMove(event) {
	mousePosition.x = event.clientX / window.innerWidth * 2 - 1;
	mousePosition.y = -(event.clientY / window.innerHeight * 2 - 1);
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
      createBuilding(x, y, height);
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

function onMouseMove(event) {
  if (isDragingView) {
    // right click drag
    const {movementX, movementY} = event;
    // update mouse over object given the new camera position
    rotateViewY(movementX);
    updateMouseOverObject();
  } else {
    // normal movement
    updateMouseOverObject();
  }
}
window.addEventListener("mousemove", onMouseMove, false);

function onContextMenu(event) {
  event.preventDefault();
  return false;
}
window.addEventListener("contextmenu", onContextMenu, false);

// main loop
function animate() {
	requestAnimationFrame(animate);

	// render
	renderer.render(scene, camera);
}

// begin
animate();
