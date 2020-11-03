const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// cubes
const blockApothems = [
	0.9, // base
	0.8, // mid
	0.7, // top
];
const blockHeights = [
	0.7,  // base
	0.65, // mid
	0.6,  // top
];
const blockYPositions = [
	blockHeights[0] / 2,
	blockHeights[0] + blockHeights[1] / 2,
	blockHeights[0] + blockHeights[1] + blockHeights[2] / 2,
];
const blockGeometries = [0, 1, 2].map(i => {
	return new THREE.BoxGeometry(blockApothems[i], blockHeights[i], blockApothems[i]);
});

const material = new THREE.MeshLambertMaterial();

[
	[0, 0],
	[1, 2],
	[-1, 0],
	[-2, -2],
	[-2, 2],
	[2, 2],
	[2, -2],
].forEach(([x, y]) => {
	[0, 1, 2].forEach(i => {
		const block = new THREE.Mesh(blockGeometries[i], material);
		block.position.set(x, blockYPositions[i], y);
		scene.add(block);
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

let cameraAngle = 0;
function rotateViewY(delta) {
	const viewRadius = 5;
	const viewHeight = 5;
	cameraAngle += delta;
	camera.position.set(
		viewRadius * Math.cos(cameraAngle),
		viewHeight,
		viewRadius * Math.sin(cameraAngle));
	camera.lookAt(0, 0, 0);
}
rotateViewY(Math.PI/4);

function animate() {
	requestAnimationFrame(animate);

	rotateViewY(0.01);

	renderer.render(scene, camera);
}
animate();

