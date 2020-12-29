// Colors
const WHITE = 0xFFFFFF;
const SKY_LIGHT_COLOR = 0xB1E1FF;    // light blue
const GROUND_LIGHT_COLOR = 0xB97A20; // brownish orange
const playerToColor = {
	[PLAYER_BLUE]:   0xADD8F3, // sky blue
	[PLAYER_PURPLE]: 0xCBBAD2, // lavendar
};
const BUILDING_COLOR = 0xEEEEEE; // soft white
const CLIFF_COLOR = 0x916291;
const GRASS_COLOR = 0x387342;
const DOME_COLOR = 0x2090D5;

// Materials
const buildingMaterial = new THREE.MeshLambertMaterial({color: BUILDING_COLOR});
const cliffMaterial = new THREE.MeshLambertMaterial({color: CLIFF_COLOR});
const grassMaterial = new THREE.MeshLambertMaterial({color: GRASS_COLOR});
const domeMaterial = new THREE.MeshBasicMaterial({color: DOME_COLOR});
const playerToPawnMaterial = {
	[PLAYER_BLUE]:   new THREE.MeshLambertMaterial({color: playerToColor[PLAYER_BLUE]}),
	[PLAYER_PURPLE]: new THREE.MeshLambertMaterial({color: playerToColor[PLAYER_PURPLE]}),
};

// Geometry
const coneHeight = 0.7;
const coneGeometry = new THREE.ConeGeometry(0.3, coneHeight);
const domeRadius = 0.35;
const domeHeight = 0.23;
const domeGeometry = new THREE.SphereGeometry(domeRadius, 15, 15, 0, Math.PI * 2, 0, Math.acos(1 - domeHeight / domeRadius));

function addLighting(scene) {
	const intensity = 1;
	const ambientLight = new THREE.HemisphereLight(SKY_LIGHT_COLOR, GROUND_LIGHT_COLOR, intensity);
	scene.add(ambientLight);

	const light = new THREE.DirectionalLight(WHITE, 0.3);
	light.position.set(5, 20, 10);
	light.target.position.set(0, 0, 0);
	scene.add(light);
	scene.add(light.target);

	const secondLight = new THREE.DirectionalLight(WHITE, 0.3);
	secondLight.position.set(-10, 20, -5);
	secondLight.target.position.set(0, 0, 0);
	scene.add(secondLight);
	scene.add(secondLight.target);
}

// Scene
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

addLighting(scene);

// camera
let cameraAngleY = 0;
let cameraAngleDown = 0.95;
function rotateView2d(deltaY, deltaDown) {
	cameraAngleDown = clamp(cameraAngleDown + deltaDown, 0, Math.PI/2);
	rotateViewY(deltaY);
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


// mapping from object handle -> THREE object.
const threeObjects = {};

function initThreeObject(object, x, y, z, handle) {
	object.position.set(x, y, z);
	object.userData.handle = handle;
	object.layers.enable(INTERACT_LAYER);

	threeObjects[handle] = object;
	scene.add(object);
}

// renders some object info into
function refreshGraphics(handle, objectInfo) {
	const existingObject = threeObjects[handle];
	if (existingObject != null) {
		scene.remove(existingObject);
		delete threeObjects[handle];
	}

	if (objectInfo == null) return;

	const {objectType, x, y, height} = objectInfo;
	if (objectType === OBJECT_TYPE_BUILDING) {
		const i = height - 1;
		initThreeObject(
			new THREE.Mesh(blockGeometries[i], buildingMaterial),
			x, blockYPositions[i], y,
			handle);
	} else if (objectType === OBJECT_TYPE_DOME) {
		initThreeObject(
			new THREE.Mesh(domeGeometry, domeMaterial),
			x, elevationLevels[height - 1] + domeHeight - domeRadius, y,
			handle);
	} else if (objectTypeIsPawn(objectType)) {
		const player = objectTypeToPawnPlayer(objectType);
		initThreeObject(
			new THREE.Mesh(coneGeometry, playerToPawnMaterial[player]),
			x, elevationLevels[height - 1] + coneHeight / 2, y,
			handle);
	} else assert(false);
}
