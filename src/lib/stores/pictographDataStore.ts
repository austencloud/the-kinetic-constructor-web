import type { MotionInterface } from '$lib/components/Pictograph/Motion/MotionInterface';
import type { PictographInterface } from '$lib/types/PictographInterface';
import { writable } from 'svelte/store';

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

		const diamondPictographs = parseCsvToJson(diamondData, 'diamond');
		const boxPictographs = parseCsvToJson(boxData, 'box');
		const combinedData = [...diamondPictographs, ...boxPictographs];

		const allPictographData = groupPictographsByLetter(combinedData);

		pictographDataStore.set(allPictographData);
		return allPictographData;
	} catch (error) {
		console.error('Error loading pictograph data:', error);
		throw error;
	}
};

function parseCsvToJson(csv: string, gridMode: string) {
	const lines = csv.split('\n').filter(Boolean);
	const headers = lines.shift()?.split(',').map(toCamelCase) || [];

	return lines.map((line) => {
		const values = line.split(',');
		const record = headers.reduce(
			(acc, header, index) => {
				acc[header.trim()] = values[index]?.trim();
				return acc;
			},
			{} as Record<string, any>
		);

		record.gridMode = gridMode;

		return record;
	});
}

function groupPictographsByLetter(pictographs: Record<string, any>[]): PictographInterface[] {
	return pictographs.map((record) => {
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
			motionData: [],
			motions: [],
			redMotion: null,
			blueMotion: null,
			props: [],
			redPropData: null,
			bluePropData: null
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
		return null;
	}

	return {
		pictographData: null as unknown as PictographInterface,
		handRotDir: 'cw_handpath',
		color: prefix === 'blue' ? 'blue' : 'red',
		leadState: null,
		motionType: record[`${prefix}MotionType`],
		startLoc: record[`${prefix}StartLoc`],
		endLoc: record[`${prefix}EndLoc`],
		startOri: 'in',
		endOri: null,
		propRotDir: record[`${prefix}PropRotDir`],
		prop: null,
		turns: 0,
		prefloatMotionType: null,
		prefloatPropRotDir: null
	};
}

export default pictographDataStore;
