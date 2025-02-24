import { Motion } from '$lib/components/objects/Motion/Motion';
import type { BlankMotionData } from '$lib/components/Pictograph/Motion/MotionInterface';
import type { PropData } from '$lib/components/Pictograph/Prop/PropInterface';
import PropRotAngleManager from '$lib/components/objects/Prop/PropRotAngleManager';
import { writable } from 'svelte/store';

// Initial prop data
const initialPropData: PropData = {
	propType: 'staff',
	color: 'red',
	radialMode: 'radial',
	ori: 'in', // Example orientation
	motion: new Motion({} as BlankMotionData),
	coords: { x: 0, y: 0 },
	loc: 'n',
	svgCenter: { x: 0, y: 0 }
};

// Create a writable store for propData
export let propData = writable<PropData>(initialPropData);

// Local variables
let transform = '';

// Define computeTransform
function computeTransform(propData: PropData): string {
	const rotationManager = new PropRotAngleManager({
		loc: propData.loc,
		ori: propData.ori
	});
	const rotationAngle = rotationManager.getRotationAngle();
	return `translate(${propData.coords.x}px, ${propData.coords.y}px) rotate(${rotationAngle}deg)`;
}

// Subscribe to store updates
$: propData.subscribe((data) => {
	transform = computeTransform(data);
});
