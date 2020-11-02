const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// cubes
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
cube.position.set( 0, 0, 0 );

const material2 = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
const cube2 = new THREE.Mesh( geometry, material2 );
cube2.position.set( 0, 1, 0 );


// Group cubes into stack
const cubeStack = new THREE.Group();
cubeStack.add(cube);
cubeStack.add(cube2);

scene.add(cubeStack);

camera.position.z = 5;

function animate() {
	requestAnimationFrame( animate );

	cubeStack.rotateY(0.01);

	renderer.render( scene, camera );
}
animate();

