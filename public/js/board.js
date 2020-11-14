class BoardState {
	constructor() {
		// numbers from 0 - 3 representing the non-dome building height.
		this.buildingHeights = [...Array(25)].map(() => 0);

		// TODO: something
		this.occupants = [...Array(25)].map(() => null);

		// arrays of THREE objects from base up.
		this.objectStacks = [...Array(25)].map(() => []);
	}

	// x and y should be in the range [-2, 2].
	// returns 0 - 3. does not include dome.
	getBuildingHeight(x, y) {
		return this.buildingHeights[this.coordToIndex(x, y)];
	}

	// not suitable for domes.
	// object should be a THREE object with .userData.boardPosition: {x, y, height}.
	// x and y should be in the range [-2, 2].
	// height should be in the range [1, 3].
	// asserts the height is one higher than the existing position.
	placeBuilding(object) {
		const {x, y, height} = object.userData.boardPosition;
		const index = this.coordToIndex(x, y);
		const existingHeight = this.buildingHeights[index];
		assert(existingHeight < 3 && existingHeight === height - 1);

		this.buildingHeights[index] = height;
		this.objectStacks[index].push(object);
	}

	getOccupant(x, y) {
		return this.occupants[this.coordToIndex(x, y)];
	}

	// converts x and y in the range [-2, 2] to an index from [0, 24].
	coordToIndex(x, y) {
		return (y + 2) * 5 + (x + 2);
	}
}
