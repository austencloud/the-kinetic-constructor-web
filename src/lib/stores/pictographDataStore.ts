import { LetterUtils } from '$lib/utils/LetterUtils';
import type { MotionData } from '$lib/components/objects/Motion/MotionData';
import type { PictographData } from '$lib/types/PictographData';
import { writable } from 'svelte/store';

function toCamelCase(str: string): string {
    return str.replace(/([-_][a-z])/g, (group) =>
        group.toUpperCase().replace('-', '').replace('_', '')
    );
}

const pictographDataStore = writable<PictographData[]>([]);

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

function groupPictographsByLetter(pictographs: Record<string, any>[]): PictographData[] {
    const processedPictographs: PictographData[] = [];
    let skippedCount = 0;

    pictographs.forEach((record) => {
        // Normalize letter input
        const rawLetter = record.letter ? record.letter.trim() : '';

        // Skip completely empty records
        if (!rawLetter) {
            skippedCount++;
            return;
        }

        try {
            // Attempt to convert letter with more lenient parsing
            const letter = LetterUtils.tryFromString(rawLetter);
            
            if (!letter) {
                skippedCount++;
                return;
            }

            const redMotionData = extractAttributes(record, 'red');
            const blueMotionData = extractAttributes(record, 'blue');

            processedPictographs.push({
                letter,
                startPos: record.startPos,
                endPos: record.endPos,
                timing: record.timing,
                direction: record.direction,
                redMotionData,
                blueMotionData,
                gridMode: record.gridMode,
                grid: '',
                gridData: null,
                redArrowData: null,
                blueArrowData: null,
                motions: [],
                redMotion: null,
                blueMotion: null,
                props: [],
                redPropData: null,
                bluePropData: null
            });
        } catch {
            skippedCount++;
        }
    });

    // Log summary of skipped records
    if (skippedCount > 0) {
        console.warn(`Skipped ${skippedCount} out of ${pictographs.length} records`);
    }

    return processedPictographs;
}

const defaultMotionData: MotionData = {
    id: '',
    handRotDir: 'cw_handpath',
    color: 'red',
    leadState: 'leading',
    motionType: 'static',
    startLoc: 'n',
    endLoc: 's',
    startOri: 'in',
    endOri: 'in',
    propRotDir: 'cw',
    turns: 0,
    prefloatMotionType: null,
    prefloatPropRotDir: null,
};

function extractAttributes(record: Record<string, any>, prefix: string): MotionData {
    return {
        ...defaultMotionData,
        color: prefix === 'blue' ? 'blue' : 'red',
        motionType: record[`${prefix}MotionType`] || defaultMotionData.motionType,
        startLoc: record[`${prefix}StartLoc`] || defaultMotionData.startLoc,
        endLoc: record[`${prefix}EndLoc`] || defaultMotionData.endLoc,
        propRotDir: record[`${prefix}PropRotDir`] || defaultMotionData.propRotDir
    };
}

export default pictographDataStore;