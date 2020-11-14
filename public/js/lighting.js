function addLighting(scene) {
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
}