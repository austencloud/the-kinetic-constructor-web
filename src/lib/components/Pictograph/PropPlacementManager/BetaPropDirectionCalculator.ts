import type { Color, Direction, MotionInterface, Location } from "../Motion/MotionInterface";
import type { PropInterface } from "../Prop/PropInterface";




export class BetaPropDirectionCalculator {
	private directionMapRadial = {
		north: { red: "right", blue: "left" },
		east: { red: "down", blue: "up" },
		south: { red: "left", blue: "right" },
		west: { red: "down", blue: "up" },
		northeast: { red: "downright", blue: "upleft" },
		southeast: { red: "upright", blue: "downleft" },
		southwest: { red: "downright", blue: "upleft" },
		northwest: { red: "upright", blue: "downleft" }
	};

	private directionMapNonRadial = {
		north: { red: "up", blue: "down" },
		east: { red: "right", blue: "left" },
		south: { red: "down", blue: "up" },
		west: { red: "right", blue: "left" },
		northeast: { red: "upright", blue: "downleft" },
		southeast: { red: "downright", blue: "upleft" },
		southwest: { red: "upright", blue: "downleft" },
		northwest: { red: "downright", blue: "upleft" }
	};

	private directionMapRadialShift = {
		east: { north: "right", south: "right" },
		west: { north: "left", south: "left" },
		north: { east: "up", west: "up" },
		south: { east: "down", west: "down" },
		northeast: { northwest: "upright", southeast: "upright" },
		southeast: { northeast: "downright", southwest: "downright" },
		southwest: { northwest: "downleft", southeast: "downleft" },
		northwest: { northeast: "upleft", southwest: "upleft" }
	};

	private directionMapNonRadialShift = {
		east: { north: "up", south: "up" },
		west: { north: "down", south: "down" },
		north: { east: "right", west: "right" },
		south: { east: "left", west: "left" },
		northeast: { southeast: "upleft", northwest: "downright" },
		southeast: { northeast: "upright", southwest: "upright" },
		southwest: { northwest: "upleft", southeast: "downright" },
		northwest: { northeast: "downleft", southwest: "downleft" }
	};

	public getDirection(
		isRadial: boolean,
		location: Location,
		color: Color
	): Direction | undefined {
		const map = isRadial
			? this.directionMapRadial
			: this.directionMapNonRadial;
		return map[location]?.[color];
	}

	public getShiftDirection(
		isRadial: boolean,
		startLocation: Location,
		endLocation: Location
	): Direction | undefined {
		const map = isRadial
			? this.directionMapRadialShift
			: this.directionMapNonRadialShift;
		return map[startLocation]?.[endLocation];
	}

	public getOppositeDirection(direction: Direction): Direction {
		const opposites: Record<Direction, Direction> = {
			up: "down",
			down: "up",
			left: "right",
			right: "left",
			upright: "downleft",
			downleft: "upright",
			upleft: "downright",
			downright: "upleft"
		};
		return opposites[direction];
	}

	public getDir(motion: MotionInterface): Direction | undefined {
		if (motion.pictographData.letter === "I") {
			if (motion.pictographData.direction === "radial") {
				return this.getDirectionForRadialI(motion);
			} else if (motion.pictographData.direction === "nonradial") {
				return this.getDirectionForNonRadialI(motion);
			}
		}

		if (motion.motionType === "shift") {
			return motion.prop?.propType === "radial"
				? this.getDirForRadial(motion)
				: this.getDirForNonRadial(motion);
		} else if (motion.motionType === "static" || motion.motionType === "dash") {
			return this.getDirForNonShift(motion.prop);
		}
	}

	private getDirectionForNonRadialI(motion: MotionInterface): Direction | undefined {
		return this.getDirection(false, motion.endLoc, motion.prop?.color || "red");
	}

	private getDirectionForRadialI(motion: MotionInterface): Direction | undefined {
		return this.getDirection(true, motion.endLoc, motion.prop?.color || "red");
	}

	private getDirForRadial(motion: MotionInterface): Direction | undefined {
		return this.getShiftDirection(
			true,
			motion.startLoc,
			motion.endLoc
		);
	}

	private getDirForNonRadial(motion: MotionInterface): Direction | undefined {
		return this.getShiftDirection(
			false,
			motion.startLoc,
			motion.endLoc
		);
	}

	private getDirForNonShift(prop: PropInterface): Direction | undefined {
		const gridMode = ["north", "south", "east", "west"].includes(prop.loc)
			? "diamond"
			: "box";
		const map =
			gridMode === "diamond"
				? prop.propType === "radial"
					? this.directionMapRadial
					: this.directionMapNonRadial
				: prop.propType === "radial"
				? this.directionMapRadialShift
				: this.directionMapNonRadialShift;

		return map[prop.loc]?.[prop.color];
	}
}
