const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// cubes
const midCube = new THREE.BoxGeometry(.9, .9, .9);
const material = new THREE.MeshLambertMaterial();
const cube = new THREE.Mesh(midCube, material);
cube.position.set(0, 1, 0);

const baseCube = new THREE.BoxGeometry();
const cube2 = new THREE.Mesh(baseCube, material);
cube2.position.set(0, 0, 0);

// Group cubes into stack
const cubeStack = new THREE.Group();
cubeStack.add(cube);
cubeStack.add(cube2);

scene.add(cubeStack);

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

	//cubeStack.rotateY(0.01);

	renderer.render(scene, camera);
}
animate();

