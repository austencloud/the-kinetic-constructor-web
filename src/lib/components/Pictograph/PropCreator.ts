import { writable } from 'svelte/store';
import type { Motion } from './Motion/Motion';
import type { PropInterface, RadialMode } from './Prop/PropInterface';
import type { Orientation, Location } from './Prop/PropTypes';
import type { DefaultPropPositioner } from './Prop/PropPlacementManager/DefaultPropPositioner';



export function createProp(
	propType: string,
	color: 'red' | 'blue',
	motion: Motion,
	positioner: DefaultPropPositioner
): PropInterface {
	// Initialize base prop data
	const prop: PropInterface = {
		propType,
		color,
		motion,
		coords: { x: 0, y: 0 },
		loc: motion.endLoc,
		ori: motion.endOri,
		radialMode: 'radial',
		svgCenter: { x: 0, y: 0 },
	};

	// Set coordinates using the positioner
	positioner.setToDefaultPosition(prop);

	return prop;
}
