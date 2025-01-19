import { writable } from 'svelte/store';

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
		const groupedData = groupPictographsByLetter(combinedData);

		// Update the store
		pictographDataStore.set(groupedData);

		// Return the grouped data for immediate use
		return groupedData;
	} catch (error) {
		console.error('Error loading pictograph data:', error);
		throw error;
	}
};

// Parses CSV and adds grid attributes
function parseCsvToJson(csv: string, gridMode: string) {
	const lines = csv.split('\n').filter(Boolean);
	const headers = lines.shift()?.split(',') || [];

	return lines.map((line) => {
		const values = line.split(',');
		const record = headers.reduce((acc, header, index) => {
			acc[header.trim()] = values[index]?.trim();
			return acc;
		}, {} as Record<string, any>);

		// Attach grid mode
		record.grid_mode = gridMode;

		return record;
	});
}

// Group and restructure data by letters
function groupPictographsByLetter(pictographs: Record<string, any>[]) {
	return pictographs.map((record) => {
		const letter = record.letter;

		// Restructure attributes
		const blueAttributes = extractAttributes(record, 'blue');
		const redAttributes = extractAttributes(record, 'red');

		return {
			letter,
			start_pos: record.start_pos,
			end_pos: record.end_pos,
			timing: record.timing,
			direction: record.direction,
			blue_attributes: blueAttributes,
			red_attributes: redAttributes,
			grid_mode: record.grid_mode, // Include grid mode for this pictograph
		};
	});
}

// Helper to extract attributes for blue/red
function extractAttributes(record: Record<string, any>, prefix: string) {
	return {
		motion_type: record[`${prefix}_motion_type`],
		start_ori: "in",
		prop_rot_dir: record[`${prefix}_prop_rot_dir`],
		start_loc: record[`${prefix}_start_loc`],
		end_loc: record[`${prefix}_end_loc`],
		turns: 0,
		end_ori: null,
	};
}

export default pictographDataStore;
