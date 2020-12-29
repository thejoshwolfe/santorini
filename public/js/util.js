function clamp(x, lowerBound, upperBound) {
	assert(lowerBound <= upperBound);
	if (x < lowerBound) return lowerBound;
	if (x > upperBound) return upperBound;
	return x;
}

function generateId() {
	let id = "";
	const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	for (let i = 0; i < 8; i++) {
		id += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return id;
}
