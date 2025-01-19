export type Direction =
	| 'up'
	| 'down'
	| 'left'
	| 'right'
	| 'upright'
	| 'upleft'
	| 'downright'
	| 'downleft';
export type Color = 'red' | 'blue';
export type Location =
	| 'north'
	| 'east'
	| 'south'
	| 'west'
	| 'northeast'
	| 'southeast'
	| 'southwest'
	| 'northwest';

export interface Motion {
	pictograph: {
		letter: string;
		check: {
			endsWithRadialOri: () => boolean;
			endsWithNonradialOri: () => boolean;
		};
	};
	check: {
		isShift: () => boolean;
		isDash: () => boolean;
		isStatic: () => boolean;
	};
	end_loc: Location;
	start_loc: Location;
	prop: Prop;
}

export interface Prop {
	loc: Location;
	color: Color;
	check: {
		isRadial: () => boolean;
		isNonradial: () => boolean;
	};
}

export class BetaPropDirectionCalculator {
	private directionMapRadial = {
		north: { red: 'right', blue: 'left' },
		east: { red: 'down', blue: 'up' },
		south: { red: 'left', blue: 'right' },
		west: { red: 'down', blue: 'up' },
		northeast: { red: 'downright', blue: 'upleft' },
		southeast: { red: 'upright', blue: 'downleft' },
		southwest: { red: 'downright', blue: 'upleft' },
		northwest: { red: 'upright', blue: 'downleft' }
	};

	private directionMapNonRadial = {
		north: { red: 'up', blue: 'down' },
		east: { red: 'right', blue: 'left' },
		south: { red: 'down', blue: 'up' },
		west: { red: 'right', blue: 'left' },
		northeast: { red: 'upright', blue: 'downleft' },
		southeast: { red: 'downright', blue: 'upleft' },
		southwest: { red: 'upright', blue: 'downleft' },
		northwest: { red: 'downright', blue: 'upleft' }
	};

	private directionMapRadialShift: { [key in Location]?: { [key in Location]?: Direction } } = {
		east: { north: 'right', south: 'right' },
		west: { north: 'left', south: 'left' },
		north: { east: 'up', west: 'up' },
		south: { east: 'down', west: 'down' },
		northeast: { northwest: 'upright', southeast: 'upright' },
		southeast: { northeast: 'downright', southwest: 'downright' },
		southwest: { northwest: 'downleft', southeast: 'downleft' },
		northwest: { northeast: 'upleft', southwest: 'upleft' }
	};

	private directionMapNonRadialShift: { [key in Location]?: { [key in Location]?: Direction } } = {
		east: { north: 'up', south: 'up' },
		west: { north: 'down', south: 'down' },
		north: { east: 'right', west: 'right' },
		south: { east: 'left', west: 'left' },
		northeast: { southeast: 'upleft', northwest: 'downright' },
		southeast: { northeast: 'upright', southwest: 'upright' },
		southwest: { northwest: 'upleft', southeast: 'downright' },
		northwest: { northeast: 'downleft', southwest: 'downleft' }
	};

	public getDirection(isRadial: boolean, location: Location, color: Color): Direction | undefined {
		const map = isRadial ? this.directionMapRadial : this.directionMapNonRadial;
		return map[location]?.[color] as Direction;
	}

	public getShiftDirection(
		isRadial: boolean,
		startLocation: Location,
		endLocation: Location
	): Direction | undefined {
		const map = isRadial ? this.directionMapRadialShift : this.directionMapNonRadialShift;
		return map[startLocation]?.[endLocation] as Direction;
	}

	public getOppositeDirection(direction: Direction): Direction {
		const opposites = {
			up: 'down',
			down: 'up',
			left: 'right',
			right: 'left',
			upright: 'downleft',
			downleft: 'upright',
			upleft: 'downright',
			downright: 'upleft'
		};
		return opposites[direction] as Direction;
	}

	public getDir(motion: Motion): Direction | undefined {
		if (motion.pictograph.letter === 'I' && motion.pictograph.check.endsWithRadialOri()) {
			return this.getDirectionForRadialI(motion);
		} else if (motion.pictograph.letter === 'I' && motion.pictograph.check.endsWithNonradialOri()) {
			return this.getDirectionForNonradialI(motion);
		}
		if (motion.check.isShift()) {
			if (motion.prop.check.isRadial()) {
				return this.getDirForRadial(motion);
			} else if (motion.prop.check.isNonradial()) {
				return this.getDirForNonradial(motion);
			}
		} else if (motion.check.isDash() || motion.check.isStatic()) {
			return this.getDirForNonShift(motion.prop);
		}
	}

	private getDirectionForNonradialI(motion: Motion): Direction | undefined {
		const directionMap = {
			north: { red: 'up', blue: 'down' },
			east: { red: 'right', blue: 'left' },
			south: { red: 'down', blue: 'up' },
			west: { red: 'right', blue: 'left' },
			northeast: { red: 'upright', blue: 'downleft' },
			southeast: { red: 'downright', blue: 'upleft' },
			southwest: { red: 'upright', blue: 'downleft' },
			northwest: { red: 'downright', blue: 'upleft' }
		};
		return directionMap[motion.end_loc]?.[motion.prop.color] as Direction;
	}

	private getDirectionForRadialI(motion: Motion): Direction | undefined {
		const directionMap: { [key in Location]: { [key in Color]?: Direction } } = {
			north: { red: 'right', blue: 'left' },
			east: { red: 'down', blue: 'up' },
			south: { red: 'left', blue: 'right' },
			west: { red: 'down', blue: 'up' },
			northeast: { red: 'downright', blue: 'upleft' },
			southeast: { red: 'upright', blue: 'downleft' },
			southwest: { red: 'downright', blue: 'upleft' },
			northwest: { red: 'upright', blue: 'downleft' }
		};
		return directionMap[motion.end_loc]?.[motion.prop.color];
	}

	private getDirForRadial(motion: Motion): Direction | undefined {
		const directionMap: { [key in Location]: { [key in Location]?: Direction } } = {
			east: { north: 'right', south: 'right' },
			west: { north: 'left', south: 'left' },
			north: { east: 'up', west: 'up' },
			south: { east: 'down', west: 'down' },
			northeast: { northwest: 'upright', southeast: 'upright' },
			southeast: { northeast: 'downright', southwest: 'downright' },
			southwest: { northwest: 'downleft', southeast: 'downleft' },
			northwest: { northeast: 'upleft', southwest: 'upleft' }
		};
		return directionMap[motion.start_loc]?.[motion.end_loc];
	}

	private getDirForNonradial(motion: Motion): Direction | undefined {
		const directionMap: { [key in Location]: { [key in Location]?: Direction } } = {
			east: { north: 'up', south: 'up' },
			west: { north: 'down', south: 'down' },
			north: { east: 'right', west: 'right' },
			south: { east: 'left', west: 'left' },
			northeast: { southeast: 'upleft', northwest: 'downright' },
			southeast: { northeast: 'upright', southwest: 'upright' },
			southwest: { northwest: 'upleft', southeast: 'downright' },
			northwest: { northeast: 'downleft', southwest: 'downleft' }
		};
		return directionMap[motion.start_loc]?.[motion.end_loc];
	}

	private getDirForNonShift(prop: Prop): Direction | undefined {
		const diamondLayerRepositionMap: {
			[key in 'radial' | 'nonradial']: { [key in Location]?: { [key in Color]?: Direction } };
		} = {
			radial: {
				north: { red: 'right', blue: 'left' },
				east: { red: 'down', blue: 'up' },
				south: { red: 'left', blue: 'right' },
				west: { red: 'down', blue: 'up' }
			},
			nonradial: {
				north: { red: 'up', blue: 'down' },
				south: { red: 'up', blue: 'down' },
				east: { red: 'right', blue: 'left' },
				west: { red: 'right', blue: 'left' }
			}
		};
		const boxLayerRepositionMap: {
            [key in 'radial' | 'nonradial']: { [key in Location]?: { [key in Color]?: Direction } };
        } = {
			radial: {
				northeast: { red: 'downright', blue: 'upleft' },
				southeast: { red: 'upright', blue: 'downleft' },
				southwest: { red: 'downright', blue: 'upleft' },
				northwest: { red: 'upright', blue: 'downleft' }
			},
			nonradial: {
				northeast: { red: 'upright', blue: 'downleft' },
				southeast: { red: 'downright', blue: 'upleft' },
				southwest: { red: 'upright', blue: 'downleft' },
				northwest: { red: 'downright', blue: 'upleft' }
			}
		};
		const gridMode = ['north', 'south', 'east', 'west'].includes(prop.loc) ? 'diamond' : 'box';
		if (gridMode === 'diamond') {
			if (prop.check.isRadial()) {
				return diamondLayerRepositionMap.radial[prop.loc]?.[prop.color];
			} else if (prop.check.isNonradial()) {
				return diamondLayerRepositionMap.nonradial[prop.loc]?.[prop.color];
			}
		} else if (gridMode === 'box') {
			if (prop.check.isRadial()) {
				return boxLayerRepositionMap.radial[prop.loc]?.[prop.color];
			} else if (prop.check.isNonradial()) {
				return boxLayerRepositionMap.nonradial[prop.loc]?.[prop.color];
			}
		}
	}
}
