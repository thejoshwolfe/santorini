const scene = new THREE.Scene();
const fieldOfViewDegrees = 40;
const camera = new THREE.PerspectiveCamera(fieldOfViewDegrees, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const material = new THREE.MeshLambertMaterial();

// ground
const theGround = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 5), material);
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
	const block = new THREE.Mesh(blockGeometries[i], material);
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
	[-2, -2, 3],
	[-2, 2, 3],
	[2, 2, 3],
	[2, -2, 3],
].forEach(([x, y, stackHeight]) => {
	[0, 1, 2].forEach(i => {
		const height = i + 1;
		if (height > stackHeight) return;
		createBuilding(x, y, height);
	});
});

// Add lighting
const skyColor = 0xB1E1FF;  // light blue
const groundColor = 0xB97A20;  // brownish orange
const intensity = 1;
const ambientLight = new THREE.HemisphereLight(skyColor, groundColor, intensity);
scene.add(ambientLight);

const color = 0xFFFFFF;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(0, 20, 0);
light.target.position.set(0, 0, 0);
scene.add(light);
scene.add(light.target);

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
