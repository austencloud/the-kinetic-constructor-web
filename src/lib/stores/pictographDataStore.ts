import { writable } from 'svelte/store';

const pictographDataStore = writable<Record<string, any>[]>([]);

export const loadPictographData = async () => {
	const diamondData = await fetch('/DiamondPictographDataframe.csv').then((res) => res.text());
	const boxData = await fetch('/BoxPictographDataframe.csv').then((res) => res.text());

	// Combine data from both files
	const combinedData = [
		...parseCsvToJson(diamondData, 'DIAMOND'),
		...parseCsvToJson(boxData, 'BOX'),
	];

	pictographDataStore.set(combinedData);
};

function parseCsvToJson(csv: string, gridMode: string) {
	const lines = csv.split('\n');
	const headers = lines.shift()?.split(',') || [];

	return lines.map((line) => {
		const values = line.split(',');
		const record = headers.reduce((acc, header, index) => {
			acc[header] = values[index];
			return acc;
		}, {} as Record<string, any>);

		record.grid_mode = gridMode; // Attach grid mode for filtering
		return record;
	});
}

export default pictographDataStore;
