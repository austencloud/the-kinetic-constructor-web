import type { MotionInterface } from '$lib/components/Pictograph/Motion/MotionInterface';
import type { PictographInterface } from '$lib/types/PictographInterface';
import { writable } from 'svelte/store';

// Utility function to convert snake_case or kebab-case to camelCase
function toCamelCase(str: string): string {
	return str.replace(/([-_][a-z])/g, (group) =>
		group.toUpperCase().replace('-', '').replace('_', '')
	);
}

const pictographDataStore = writable<Record<string, any>[]>([]);

export const loadPictographData = async () => {
	try {
		const diamondData = await fetch('/DiamondPictographDataframe.csv').then((res) => res.text());
		const boxData = await fetch('/BoxPictographDataframe.csv').then((res) => res.text());

		// Parse and combine the data from both files
		const diamondPictographs = parseCsvToJson(diamondData, 'diamond');
		const boxPictographs = parseCsvToJson(boxData, 'box');
		const combinedData = [...diamondPictographs, ...boxPictographs];

		// Restructure and group the data
		const allPictographData = groupPictographsByLetter(combinedData);

		// Update the store
		pictographDataStore.set(allPictographData);
		// Return the grouped data for immediate use
		return allPictographData;
	} catch (error) {
		console.error('Error loading pictograph data:', error);
		throw error;
	}
};

// Parses CSV and converts keys to camel case
function parseCsvToJson(csv: string, gridMode: string) {
	const lines = csv.split('\n').filter(Boolean);
	const headers = lines.shift()?.split(',').map(toCamelCase) || []; // Convert headers to camel case

	return lines.map((line) => {
		const values = line.split(',');
		const record = headers.reduce(
			(acc, header, index) => {
				acc[header.trim()] = values[index]?.trim();
				return acc;
			},
			{} as Record<string, any>
		);

		// Attach grid mode
		record.gridMode = gridMode;

		return record;
	});
}

function groupPictographsByLetter(pictographs: Record<string, any>[]): PictographInterface[] {
	return pictographs.map((record) => {
		// Extract red and blue motion data
		const redMotionData = extractAttributes(record, 'red');
		const blueMotionData = extractAttributes(record, 'blue');

		return {
			letter: record.letter,
			startPos: record.startPos,
			endPos: record.endPos,
			timing: record.timing,
			direction: record.direction,
			redMotionData,
			blueMotionData,
			gridMode: record.gridMode,
			motionData: [] // Initialize as an empty array; motions can be added later
		};
	});
}

function extractAttributes(record: Record<string, any>, prefix: string): MotionInterface | null {
	if (
		!record[`${prefix}MotionType`] ||
		!record[`${prefix}StartLoc`] ||
		!record[`${prefix}EndLoc`] ||
		!record[`${prefix}PropRotDir`]
	) {
		return null; // Return null if any required attribute is missing
	}

	return {
		pictographData: null as any, // Replace with a valid reference later, if necessary
		handRotDir: 'cw_handpath', // Default hand rotation direction
		color: prefix === 'blue' ? 'blue' : 'red', // Determine based on the prefix
		leadState: 'trailing', // Default lead state
		motionType: record[`${prefix}MotionType`],
		startLoc: record[`${prefix}StartLoc`],
		endLoc: record[`${prefix}EndLoc`],
		startOri: 'in',
		endOri: null,
		propRotDir: record[`${prefix}PropRotDir`],
		turns: 0,
		prefloatMotionType: null,
		prefloatPropRotDir: null
	};
}

export default pictographDataStore;
