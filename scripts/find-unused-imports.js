// Find unused imports in TypeScript and Svelte files
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Get all TypeScript and Svelte files
const tsFiles = execSync('find src -type f -name "*.ts" -not -path "*/node_modules/*"')
	.toString()
	.trim()
	.split('\n')
	.filter(Boolean);

const svelteFiles = execSync('find src -type f -name "*.svelte" -not -path "*/node_modules/*"')
	.toString()
	.trim()
	.split('\n')
	.filter(Boolean);

const allFiles = [...tsFiles, ...svelteFiles];

// Process each file
allFiles.forEach((filePath) => {
	try {
		const content = fs.readFileSync(filePath, 'utf8');

		// Extract imports
		const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
		let match;
		let unusedImports = [];

		while ((match = importRegex.exec(content)) !== null) {
			const imports = match[1].split(',').map((i) => i.trim().split(' as ')[0].trim());
			const importSource = match[2];

			imports.forEach((importName) => {
				// Skip if it's a type import or empty
				if (importName.startsWith('type ') || !importName) return;

				// Check if the import is used in the file
				const usageRegex = new RegExp(`\\b${importName}\\b`, 'g');
				const usageMatches = content.match(usageRegex) || [];

				// If the import only appears once (in the import statement itself), it's unused
				if (usageMatches.length <= 1) {
					unusedImports.push({ name: importName, source: importSource });
				}
			});
		}

		if (unusedImports.length > 0) {
			console.log(`\nFile: ${filePath}`);
			console.log('Unused imports:');
			unusedImports.forEach((imp) => {
				console.log(`  - ${imp.name} from ${imp.source}`);
			});
		}
	} catch (error) {
		console.error(`Error processing ${filePath}:`, error.message);
	}
});

// Find console.log statements
console.log('\n\nFiles with console.log statements:');
try {
	const result = execSync('grep -r "console.log" src --include="*.ts" --include="*.svelte"')
		.toString()
		.trim();

	console.log(result);
} catch (error) {
	console.log('No console.log statements found or error occurred.');
}
