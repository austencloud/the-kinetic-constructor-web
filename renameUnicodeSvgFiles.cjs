// renameUnicodeSvgFiles.js
// USAGE: node renameUnicodeSvgFiles.js
// before running, npm install fs-extra or just use built-in fs, path, etc.

const fs = require('fs');
const path = require('path');

// The same map you used in letterSafeNames, but reversed if you want to guess from the old file name:
const renameMap = new Map([
	['Ω-', 'OmegaDash'],
	['θ-', 'thetaDash'],
	['Σ-', 'SigmaDash'],
	['Δ-', 'DeltaDash'],
	['Φ-', 'PhiDash'],
	['Ψ-', 'PsiDash'],
	['Λ-', 'LambdaDash'],
	['Ω', 'Omega'],
	['θ', 'theta'],
	['Σ', 'Sigma'],
	['Δ', 'Delta'],
	['Φ', 'Phi'],
	['Ψ', 'Psi'],
	['Λ', 'Lambda'],
	['α', 'alpha'],
	['β', 'beta'],
	['Γ', 'Gamma']
	// etc. as needed
]);

/**
 * This function tries to match a given filename (like "Ω-.svg")
 * to one of the renameMap keys. If found, returns the new ASCII name + ".svg".
 */
function getNewAsciiName(oldFilename) {
	// 1) Strip off ".svg"
	const base = oldFilename.replace('.svg', '');

	// 2) If it’s ASCII already, do nothing
	//    or if we find a match in renameMap, rename
	if (renameMap.has(base)) {
		return renameMap.get(base) + '.svg';
	}
	// Maybe handle dash automatically:
	if (base.endsWith('-')) {
		return base.replace('-', 'Dash') + '.svg';
	}
	// else just keep it
	return oldFilename;
}

function renameAllInDir(dirPath) {
	const allFiles = fs.readdirSync(dirPath);
	for (const file of allFiles) {
		const fullOldPath = path.join(dirPath, file);

		// Only rename .svg files, skip directories
		if (!file.toLowerCase().endsWith('.svg')) continue;

		const newName = getNewAsciiName(file);
		if (newName !== file) {
			const fullNewPath = path.join(dirPath, newName);
			console.log(`Renaming: ${file} => ${newName}`);
			fs.renameSync(fullOldPath, fullNewPath);
		}
	}
}

// MAIN
function main() {
	// e.g. "letters_trimmed" relative to your script
	const baseDir = path.join(__dirname, 'static/images/letters_trimmed');
	const subDirs = fs.readdirSync(baseDir);

	// For each subDir (Type1, Type2, …)
	subDirs.forEach((sub) => {
		const subPath = path.join(baseDir, sub);
		if (fs.statSync(subPath).isDirectory()) {
			renameAllInDir(subPath);
		}
	});
}

main();
