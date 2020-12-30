class BoardState {
	constructor(existingState = {}) {
		// Mapping of object handle -> object info.
		this.objects = {
			// "abc123": {objectType: OBJECT_TYPE_BUILDING_1, x: 0, y: 0, height: 1},
		};

		// stacks of object handles cached by location.
		this.objectStacks = [...Array(25)].map(() => []);

		// counts of each type that can be placed.
		this.objectTypeToRemainingCount = {
			[OBJECT_TYPE_BUILDING_1]: 22,
			[OBJECT_TYPE_BUILDING_2]: 18,
			[OBJECT_TYPE_BUILDING_3]: 14,
			[OBJECT_TYPE_DOME]: 18,
			[OBJECT_TYPE_PAWN_BLUE_F]: 1,
			[OBJECT_TYPE_PAWN_BLUE_M]: 1,
			[OBJECT_TYPE_PAWN_PURPLE_F]: 1,
			[OBJECT_TYPE_PAWN_PURPLE_M]: 1,
		};

		// Load existing objects
		for (let handle in existingState) {
			this.objects[handle] = existingState[handle];
			const {objectType, x, y, height} = this.objects[handle];
			assert(isValidObjectType(objectType));
			assert(isValidCoordinates(x, y, height));

			// stack
			const stack = this.objectStacks[this._coordToIndex(x, y)];
			const i = height - 1;
			assert(stack[i] == null);
			stack[i] = handle;

			// count
			assert(this.objectTypeToRemainingCount[objectType] > 0);
			this.objectTypeToRemainingCount[objectType]--;
		}

		// check the state is coherent
		for (let stack of this.objectStacks) {
			let foundOccupant = false;
			for (let i = 0; i < stack.length; i++) {
				assert(!foundOccupant);
				assert(stack[i] != null);
				const {objectType, x, y, height} = this.objects[stack[i]];
				if (objectTypeIsBuilding(objectType)) {
					// building
					assert(i + 1 === objectTypeToBuildingHeight(objectType));
				} else {
					// occupant
					foundOccupant = true;
				}
			}
		}
	}

	// returns {objectType, x, y, height} or null.
	getObjectInfo(handle) {
		if (handle in this.objects) return this.objects[handle];
		// gotta be actual null so that JSON.stringify picks it up.
		return null;
	}

	// returns the object handle
	buildBuilding(x, y, objectType) {
		const index = this._coordToIndex(x, y);
		const {buildingHeight, occupantHandle} = this._getBuildingTop(index);
		assert(buildingHeight + 1 === objectTypeToBuildingHeight(objectType));
		assert(occupantHandle == null, "can't build on an occupant");

		return this._createObject({
			objectType,
			x, y,
			height: buildingHeight + 1,
		});
	}

	// returns the object handle
	buildDome(x, y) {
		const index = this._coordToIndex(x, y);
		const {buildingHeight, occupantHandle} = this._getBuildingTop(index);
		assert(occupantHandle == null, "can't build dome on an occupant");

		return this._createObject({
			objectType: OBJECT_TYPE_DOME,
			x, y,
			height: buildingHeight + 1,
		});
	}

	// returns the object handle
	createPawn(x, y, objectType) {
		const index = this._coordToIndex(x, y);
		const {buildingHeight, occupantHandle} = this._getBuildingTop(index);
		assert(occupantHandle == null, "can't create pawn on an occupant");
		assert(objectTypeIsPawn(objectType));

		return this._createObject({
			objectType: objectType,
			x, y,
			height: buildingHeight + 1,
		});
	}
	// returns the object handle
	movePawn(fromX, fromY, toX, toY) {
		const fromIndex = this._coordToIndex(fromX, fromY);
		const toIndex = this._coordToIndex(toX, toY);
		const {occupantHandle: pawnHandle} = this._getBuildingTop(fromIndex);
		const {occupantHandle: destHandle, buildingHeight} = this._getBuildingTop(toIndex);

		// sanity checks.
		assert(pawnHandle != null);
		const {objectType} = this.objects[pawnHandle];
		assert(objectTypeIsPawn(objectType));
		assert(destHandle == null);

		// update source of truth
		this.objects[pawnHandle] = {
			...this.objects[pawnHandle],
			x: toX,
			y: toY,
			height: buildingHeight + 1,
		};
		// update caches
		this.objectStacks[fromIndex].pop();
		this.objectStacks[toIndex].push(pawnHandle);

		return pawnHandle;
	}

	// returns the object handle
	removeTopOfStack(x, y) {
		const stack = this.objectStacks[this._coordToIndex(x, y)];
		assert(stack.length > 0, "removing from empty stack");
		const handle = stack.pop();
		const {objectType} = this.objects[handle];
		delete this.objects[handle];
		this.objectTypeToRemainingCount[objectType]++;
		return handle;
	}

	// returns {buildingHeight, occupantHandle}
	getBuildingTop(x, y) {
		return this._getBuildingTop(this._coordToIndex(x, y));
	}
	_getBuildingTop(index) {
		let buildingHeight = 0;
		let occupantHandle = null;

		const stack = this.objectStacks[index];
		for (let i = stack.length - 1; i >= 0; i--) {
			const handle = stack[i];
			const {objectType, height} = this.objects[handle];
			if (objectTypeIsBuilding(objectType)) {
				buildingHeight = height;
				break;
			} else {
				// pawn or dome
				assert(occupantHandle == null);
				occupantHandle = handle;
			}
		}

		return {buildingHeight, occupantHandle};
	}

	getRemainingCount(objectType) {
		return this.objectTypeToRemainingCount[objectType];
	}

	_createObject(objectInfo) {
		const handle = generateId();
		assert(!(handle in this.objects), "random id collision");
		const {objectType, x, y} = objectInfo;
		assert(this.objectTypeToRemainingCount[objectType] > 0);
		this.objectTypeToRemainingCount[objectType]--;
		this.objects[handle] = objectInfo;
		this.objectStacks[this._coordToIndex(x, y)].push(handle);
		return handle;
	}

	// converts x and y in the range [-2, 2] to an index from [0, 24].
	_coordToIndex(x, y) {
		return (y + 2) * 5 + (x + 2);
	}
}
