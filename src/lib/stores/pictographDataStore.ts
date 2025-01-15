import { writable } from 'svelte/store';

const pictographDataStore = writable<Record<string, any>[]>([]);

export const loadPictographData = async () => {
	const diamondData = await fetch('/DiamondPictographDataframe.csv').then((res) => res.text());
	const boxData = await fetch('/BoxPictographDataframe.csv').then((res) => res.text());

	const combinedData = [...parseCsvToJson(diamondData), ...parseCsvToJson(boxData)];
	pictographDataStore.set(combinedData);
};

function parseCsvToJson(csv: string) {
	const lines = csv.split('\n');
	const headers = lines.shift()?.split(',') || [];
	return lines.map((line) => {
		const values = line.split(',');
		return headers.reduce(
			(acc, header, index) => {
				acc[header] = values[index];
				return acc;
			},
			{} as Record<string, any>
		);
	});
}

export default pictographDataStore;
