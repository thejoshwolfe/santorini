class BoardState {
	constructor() {
		// numbers from 0 - 3 representing the non-dome building height.
		this.buildingHeights = [...Array(25)].map(() => 0);

		// can contain: null, ["dome"], or ["pawn", player]
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
		const {index, height} = this._assertBoardPosition(object);
		assert(height <= 3);

		this.buildingHeights[index] = height;
		this.objectStacks[index].push(object);
	}

	// object should be a THREE object with .userData.boardPosition: {x, y, height}.
	// x and y should be in the range [-2, 2].
	// height should be in the range [1, 4].
	// asserts the height is one higher than the existing position.
	placeDome(object) {
		const {index} = this._assertBoardPosition(object);

		this.occupants[index] = ["dome"];
		this.objectStacks[index].push(object);
	}

	// same assumptions as placeDome.
	placePawn(object, player) {
		const {index} = this._assertBoardPosition(object);

		this.occupants[index] = ["pawn", player];
		this.objectStacks[index].push(object);
	}
	// returns the THREE object.
	movePawn(fromX, fromY, fromHeight, toX, toY, toHeight) {
		const fromIndex = this.coordToIndex(fromX, fromY);
		const toIndex = this.coordToIndex(toX, toY);
		const occupant = this.occupants[fromIndex];

		// sanity checks.
		assert(occupant != null);
		assert(occupant[0] === "pawn");
		assert(this.occupants[toIndex] == null);
		assert(this.objectStacks[fromIndex].length === fromHeight);
		assert(this.objectStacks[toIndex].length === toHeight - 1);

		// move object
		const cone = this.objectStacks[fromIndex].pop();
		this.objectStacks[toIndex].push(cone);
		// move occupant
		delete this.occupants[fromIndex];
		this.occupants[toIndex] = occupant;

		return cone;
	}

	isOccupied(x, y) {
		return this.getOccupant(x, y) != null;
	}
	getOccupant(x, y) {
		return this.occupants[this.coordToIndex(x, y)];
	}

	// converts x and y in the range [-2, 2] to an index from [0, 24].
	coordToIndex(x, y) {
		return (y + 2) * 5 + (x + 2);
	}

	// returns {x, y, height, index}
	_assertBoardPosition(object) {
		const {x, y, height} = object.userData.boardPosition;
		const index = this.coordToIndex(x, y);
		const existingHeight = this.buildingHeights[index];
		assert(existingHeight < 4 && existingHeight === height - 1);

		return {x, y, height, index};
	}
}
