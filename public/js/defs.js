// Players
const PLAYER_BLUE   = "blue";
const PLAYER_PURPLE = "purple";

// Object types
const OBJECT_TYPE_BUILDING = "building";
const OBJECT_TYPE_DOME = "dome";
const OBJECT_TYPE_PAWN_BLUE_F = "blue_f";
const OBJECT_TYPE_PAWN_BLUE_M = "blue_m";
const OBJECT_TYPE_PAWN_PURPLE_F = "purple_f";
const OBJECT_TYPE_PAWN_PURPLE_M = "purple_m";

function objectTypeIsPawn(objectType) {
	switch (objectType) {
		case OBJECT_TYPE_PAWN_BLUE_F: return true;
		case OBJECT_TYPE_PAWN_BLUE_M: return true;
		case OBJECT_TYPE_PAWN_PURPLE_F: return true;
		case OBJECT_TYPE_PAWN_PURPLE_M: return true;
	}
	return false;
}

function objectTypeToPawnPlayer(objectType) {
	switch (objectType) {
		case OBJECT_TYPE_PAWN_BLUE_F: return PLAYER_BLUE;
		case OBJECT_TYPE_PAWN_BLUE_M: return PLAYER_BLUE;
		case OBJECT_TYPE_PAWN_PURPLE_F: return PLAYER_PURPLE;
		case OBJECT_TYPE_PAWN_PURPLE_M: return PLAYER_PURPLE;
	}
	assert(false);
}
