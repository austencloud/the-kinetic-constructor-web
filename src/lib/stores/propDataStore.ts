import { Motion } from '$lib/components/Pictograph/Motion/Motion';
import type { BlankMotionInterface } from '$lib/components/Pictograph/Motion/MotionInterface';
import type { PropInterface } from '$lib/components/Pictograph/Prop/PropInterface';
import PropRotAngleManager from '$lib/components/Pictograph/Prop/PropRotAngleManager';
import { writable } from 'svelte/store';

// Initial prop data
const initialPropData: PropInterface = {
	propType: 'staff',
	color: 'red',
	radialMode: 'radial',
	ori: 'in', // Example orientation
	motion: new Motion({} as BlankMotionInterface),
	coords: { x: 0, y: 0 },
	loc: 'n',
	svgCenter: { x: 0, y: 0 }
};

// Create a writable store for propData
export let propData = writable<PropInterface>(initialPropData);

// Local variables
let transform = '';

// Define computeTransform
function computeTransform(propData: PropInterface): string {
	const rotationManager = new PropRotAngleManager({
		location: propData.loc,
		orientation: propData.ori
	});
	const rotationAngle = rotationManager.getRotationAngle();
	return `translate(${propData.coords.x}px, ${propData.coords.y}px) rotate(${rotationAngle}deg)`;
}

// Subscribe to store updates
$: propData.subscribe((data) => {
	transform = computeTransform(data);
});
