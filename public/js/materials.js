// Players
const PLAYER_BLUE   = "blue";
const PLAYER_PURPLE = "purple";

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

