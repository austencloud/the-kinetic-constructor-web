import { Letter } from '$lib/types/Letter';
import { LetterConditions } from '../components/Pictograph/constants/LetterConditions';

export class LetterUtils {
	private static conditionMappings: Record<LetterConditions, Letter[]> = {
		[LetterConditions.ALPHA_ENDING]: [
			Letter.A,
			Letter.B,
			Letter.C,
			Letter.D,
			Letter.E,
			Letter.F,
			Letter.W,
			Letter.X,
			Letter.W_DASH,
			Letter.X_DASH,
			Letter.Φ,
			Letter.Φ_DASH,
			Letter.α
		],
		[LetterConditions.BETA_ENDING]: [
			Letter.G,
			Letter.H,
			Letter.I,
			Letter.J,
			Letter.K,
			Letter.L,
			Letter.Y,
			Letter.Z,
			Letter.Y_DASH,
			Letter.Z_DASH,
			Letter.Ψ,
			Letter.Ψ_DASH,
			Letter.β
		],
		[LetterConditions.GAMMA_ENDING]: [
			Letter.M,
			Letter.N,
			Letter.O,
			Letter.P,
			Letter.Q,
			Letter.R,
			Letter.S,
			Letter.T,
			Letter.U,
			Letter.V,
			Letter.Σ,
			Letter.Δ,
			Letter.θ,
			Letter.Ω,
			Letter.Σ_DASH,
			Letter.Δ_DASH,
			Letter.θ_DASH,
			Letter.Ω_DASH,
			Letter.Λ,
			Letter.Λ_DASH,
			Letter.Γ
		],
		[LetterConditions.HYBRID]: [
			Letter.C,
			Letter.F,
			Letter.I,
			Letter.L,
			Letter.O,
			Letter.R,
			Letter.U,
			Letter.V,
			Letter.W,
			Letter.X,
			Letter.Y,
			Letter.Z,
			Letter.W_DASH,
			Letter.X_DASH,
			Letter.Y_DASH,
			Letter.Z_DASH,
			Letter.Σ,
			Letter.Δ,
			Letter.θ,
			Letter.Ω,
			Letter.Σ_DASH,
			Letter.Δ_DASH,
			Letter.θ_DASH,
			Letter.Ω_DASH,
			Letter.Φ,
			Letter.Ψ,
			Letter.Λ
		],
		[LetterConditions.NON_HYBRID]: [
			Letter.A,
			Letter.B,
			Letter.D,
			Letter.E,
			Letter.G,
			Letter.H,
			Letter.J,
			Letter.K,
			Letter.M,
			Letter.N,
			Letter.P,
			Letter.Q,
			Letter.S,
			Letter.T,
			Letter.Φ_DASH,
			Letter.Ψ_DASH,
			Letter.Λ_DASH,
			Letter.α,
			Letter.β,
			Letter.Γ
		]
	};

	static getLettersByCondition(condition: LetterConditions): Letter[] {
		return this.conditionMappings[condition] || [];
	}

	private static letterMappings: Record<string, Letter> = {
		// Greek letters (both symbols and names)
		α: Letter.α,
		beta: Letter.β,
		β: Letter.β,
		alpha: Letter.α,
		gamma: Letter.Γ,
		Γ: Letter.Γ,
		γ: Letter.Γ,
		theta: Letter.θ,
		θ: Letter.θ,
		'theta-': Letter.θ_DASH,
		'θ-': Letter.θ_DASH,
		theta_dash: Letter.θ_DASH,
		omega: Letter.Ω,
		Ω: Letter.Ω,
		'omega-': Letter.Ω_DASH,
		'Ω-': Letter.Ω_DASH,
		omega_dash: Letter.Ω_DASH,
		phi: Letter.Φ,
		Φ: Letter.Φ,
		'phi-': Letter.Φ_DASH,
		'Φ-': Letter.Φ_DASH,
		phi_dash: Letter.Φ_DASH,
		psi: Letter.Ψ,
		Ψ: Letter.Ψ,
		'psi-': Letter.Ψ_DASH,
		'Ψ-': Letter.Ψ_DASH,
		psi_dash: Letter.Ψ_DASH,
		lambda: Letter.Λ,
		Λ: Letter.Λ,
		'lambda-': Letter.Λ_DASH,
		'Λ-': Letter.Λ_DASH,
		lambda_dash: Letter.Λ_DASH,
		sigma: Letter.Σ,
		Σ: Letter.Σ,
		'sigma-': Letter.Σ_DASH,
		'Σ-': Letter.Σ_DASH,
		sigma_dash: Letter.Σ_DASH,
		delta: Letter.Δ,
		Δ: Letter.Δ,
		'delta-': Letter.Δ_DASH,
		'Δ-': Letter.Δ_DASH,
		delta_dash: Letter.Δ_DASH,
		// Basic letter dash variants
		'W-': Letter.W_DASH,
		'X-': Letter.X_DASH,
		'Y-': Letter.Y_DASH,
		'Z-': Letter.Z_DASH
	};
	static fromString(letterStr: string): Letter {
		if (!letterStr) {
			throw new Error('Cannot convert empty input to Letter');
		}

		// Trim the input
		const trimmedStr = letterStr.trim();

		// First, try exact match with our letter mappings (handles all known formats)
		if (this.letterMappings[trimmedStr]) {
			return this.letterMappings[trimmedStr];
		}

		// Second, try exact match with the Letter enum values (case-sensitive)
		const exactMatch = Object.values(Letter).find((value) => value === trimmedStr);
		if (exactMatch) {
			return exactMatch as Letter;
		}

		// Third, try case-insensitive match with enum keys
		const enumKey = Object.keys(Letter).find(
			(key) => key.toLowerCase() === trimmedStr.toLowerCase()
		);
		if (enumKey) {
			return Letter[enumKey as keyof typeof Letter];
		}

		// Fourth, handle dash variants - try both formats: "X-" and "X_DASH"
		if (trimmedStr.includes('-')) {
			// Try direct match first (e.g., "X-" -> Letter.X_DASH)
			const dashEnumKey = Object.keys(Letter).find((key) => {
				const enumValue = Letter[key as keyof typeof Letter];
				return enumValue === trimmedStr;
			});
			if (dashEnumKey) {
				return Letter[dashEnumKey as keyof typeof Letter];
			}

			// Try converting "X-" to "X_DASH" format
			const baseLetter = trimmedStr.replace('-', '');
			const dashKey = `${baseLetter}_DASH`;
			const dashEnumMatch = Object.keys(Letter).find((key) => key === dashKey);
			if (dashEnumMatch) {
				return Letter[dashEnumMatch as keyof typeof Letter];
			}
		}

		// Fifth, try normalized versions for special character handling
		const normalizedStr = trimmedStr
			// Convert unicode and common alternatives
			.replace(/θ/g, 'theta')
			.replace(/Θ/g, 'Theta')
			.replace(/ω/g, 'omega')
			.replace(/Ω/g, 'Omega')
			.replace(/φ/g, 'phi')
			.replace(/Φ/g, 'Phi')
			.replace(/ψ/g, 'psi')
			.replace(/Ψ/g, 'Psi')
			.replace(/λ/g, 'lambda')
			.replace(/Λ/g, 'Lambda')
			.replace(/σ/g, 'sigma')
			.replace(/Σ/g, 'Sigma')
			.replace(/δ/g, 'delta')
			.replace(/Δ/g, 'Delta')
			.toLowerCase()
			.replace(/-/g, '_dash');

		// Try normalized mapping
		if (this.letterMappings[normalizedStr]) {
			return this.letterMappings[normalizedStr];
		}

		// Try normalized enum match
		const normalizedEnumKey = Object.keys(Letter).find(
			(key) => key.toLowerCase() === normalizedStr
		);
		if (normalizedEnumKey) {
			return Letter[normalizedEnumKey as keyof typeof Letter];
		}

		// Logging with comprehensive context for easier debugging
		console.warn(`Could not convert letter: "${letterStr}"`, {
			trimmedStr,
			normalizedStr,
			availableLetters: Object.keys(Letter),
			availableValues: Object.values(Letter),
			availableMappings: Object.keys(this.letterMappings)
		});

		throw new Error(`No matching enum member for string: ${letterStr}`);
	}

	// More forgiving version that returns null instead of throwing
	static tryFromString(letterStr: string): Letter | null {
		try {
			return this.fromString(letterStr);
		} catch {
			// Silently return null for failed parsing attempts
			// (detailed logging is handled in fromString method)
			return null;
		}
	}

	static getLetter(letterStr: string): Letter {
		return this.fromString(letterStr);
	}
}
