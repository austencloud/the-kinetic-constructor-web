import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory
const baseDir = 'F:/CODE/the-kinetic-constructor-web/src/lib/components';

// Directory structure
const structure = {
	// Structure remains the same
	GenerateTab: {
		'GenerateTab.svelte': '',
		'GenerateSequenceButton.svelte': '',
		'CustomizeYourSequenceLabel.svelte': '',
		CircularSequencer: {
			CAPTypePicker: {
				'CAPPicker.svelte': '',
				'CAPTypeButton.svelte': ''
			},
			'EndPositionSelector.svelte': ''
		},
		Freeform: {
			'FreeformSequencer.svelte': '',
			LetterTypePicker: {
				'LetterTypeButton.svelte': '',
				'LetterTypePicker.svelte': ''
			}
		},
		Widgets: {
			'GenerateTabLengthAdjuster.svelte': '',
			'GeneratorTypeToggle.svelte': '',
			'PropContinuityToggle.svelte': '',
			'SliceSizeToggle.svelte': '',
			'TurnIntensityAdjuster.svelte': '',
			LevelSelector: {
				'LevelButton.svelte': '',
				'LevelSelector.svelte': ''
			}
		}
	}
};

// Other structures remain unchanged
const storesBaseDir = 'F:/CODE/the-kinetic-constructor-web/src/lib/stores';
const storesStructure = {
	/* Structure unchanged */
};

const servicesBaseDir = 'F:/CODE/the-kinetic-constructor-web/src/lib/services';
const servicesStructure = {
	/* Structure unchanged */
};

const typesBaseDir = 'F:/CODE/the-kinetic-constructor-web/src/lib/types';
const typesStructure = {
	/* Structure unchanged */
};

const utilsBaseDir = 'F:/CODE/the-kinetic-constructor-web/src/lib/utils';
const utilsStructure = {
	/* Structure unchanged */
};

function createDirectoryStructure(baseDir, structure) {
	if (!fs.existsSync(baseDir)) {
		fs.mkdirSync(baseDir, { recursive: true });
		console.log(`Created directory: ${baseDir}`);
	}

	if (structure) {
		Object.entries(structure).forEach(([name, content]) => {
			const fullPath = path.join(baseDir, name);

			if (typeof content === 'object') {
				if (!fs.existsSync(fullPath)) {
					fs.mkdirSync(fullPath, { recursive: true });
					console.log(`Created directory: ${fullPath}`);
				}
				createDirectoryStructure(fullPath, content);
			} else {
				if (!fs.existsSync(fullPath)) {
					fs.writeFileSync(fullPath, content);
					console.log(`Created file: ${fullPath}`);
				} else {
					console.log(`File already exists: ${fullPath}`);
				}
			}
		});
	}
}

createDirectoryStructure(baseDir, structure);
createDirectoryStructure(storesBaseDir, storesStructure);
createDirectoryStructure(servicesBaseDir, servicesStructure);
createDirectoryStructure(typesBaseDir, typesStructure);
createDirectoryStructure(utilsBaseDir, utilsStructure);

console.log('Done creating directory structure!');
