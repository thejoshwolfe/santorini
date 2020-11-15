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
