const scene = new THREE.Scene();
const fieldOfViewDegrees = 40;
const camera = new THREE.PerspectiveCamera(fieldOfViewDegrees, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const buildingMaterial = new THREE.MeshLambertMaterial({color: 0xD6F8D6});
const groundMaterial = new THREE.MeshLambertMaterial({color: 0x7FC6A4});

// ground
const theGround = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 5), groundMaterial);
theGround.position.set(0, -0.5, 0);
scene.add(theGround);

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

const coneGeometry = new THREE.ConeGeometry(0.3, 0.7);
function createPawn(x, y) {
	const cone = new THREE.Mesh(coneGeometry, groundMaterial);
	const height = boardState.getBuildingHeight(x, y);
	cone.position.set(x, (height === 0 ? 0 : blockYPositions[height - 1]) + 3, y);
	cone.userData.boardPosition = {x, y, height};
	//boardState.placePawn(cone);
	scene.add(cone);
}

[
	[0, 0],
	[2, 2],
].forEach(([x, y]) => {
	createPawn(x, y);
});

// Add lighting
const skyColor = 0xB1E1FF;  // light blue
const groundColor = 0xB97A20;  // brownish orange
const intensity = 1;
const ambientLight = new THREE.HemisphereLight(skyColor, groundColor, intensity);
scene.add(ambientLight);

const light = new THREE.DirectionalLight(0xFFFFFF, 0.3);
light.position.set(5, 20, 10);
light.target.position.set(0, 0, 0);
scene.add(light);
scene.add(light.target);

const secondLight = new THREE.DirectionalLight(0xFFFFFF, 0.3);
secondLight.position.set(-10, 20, -5);
secondLight.target.position.set(0, 0, 0);
scene.add(secondLight);
scene.add(secondLight.target);

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

function onMouseDown(event) {
	if (mouseBoardPosition == null) return;
	const {x, y, height} = mouseBoardPosition;
	createBuilding(x, y, height);
}
window.addEventListener("mousedown", onMouseDown, false);


// main loop
function animate() {
	requestAnimationFrame(animate);

	// spin the camera gently
	rotateViewY(0.002);

	// update mouse over object given the new camera position
	updateMouseOverObject();

	// render
	renderer.render(scene, camera);
}

// begin
animate();
