import { Letter } from '$lib/types/Letter';
import { LetterType } from '$lib/types/LetterType';
import { LetterConditions } from '../components/Pictograph/constants/LetterConditions';

export class LetterUtils {
	private static conditionMappings: Record<LetterConditions, Letter[]> = {
		[LetterConditions.PRO]: [
			Letter.A,
			Letter.C,
			Letter.D,
			Letter.F,
			Letter.G,
			Letter.I,
			Letter.J,
			Letter.L,
			Letter.M,
			Letter.O,
			Letter.P,
			Letter.R,
			Letter.S,
			Letter.U,
			Letter.V,
			Letter.W,
			Letter.Y,
			Letter.Σ,
			Letter.θ,
			Letter.W_DASH,
			Letter.Y_DASH,
			Letter.Σ_DASH,
			Letter.θ_DASH
		],
		[LetterConditions.ANTI]: [
			Letter.B,
			Letter.C,
			Letter.E,
			Letter.F,
			Letter.H,
			Letter.I,
			Letter.K,
			Letter.L,
			Letter.N,
			Letter.O,
			Letter.Q,
			Letter.R,
			Letter.T,
			Letter.U,
			Letter.V,
			Letter.X,
			Letter.Z,
			Letter.Δ,
			Letter.Ω,
			Letter.X_DASH,
			Letter.Z_DASH,
			Letter.Δ_DASH,
			Letter.Ω_DASH
		],
		[LetterConditions.DASH]: [
			Letter.W_DASH,
			Letter.X_DASH,
			Letter.Y_DASH,
			Letter.Z_DASH,
			Letter.Σ_DASH,
			Letter.Δ_DASH,
			Letter.θ_DASH,
			Letter.Ω_DASH,
			Letter.Φ,
			Letter.Ψ,
			Letter.Λ,
			Letter.Φ_DASH,
			Letter.Ψ_DASH,
			Letter.Λ_DASH
		],
		[LetterConditions.HAS_STATIC]: [
			Letter.W,
			Letter.X,
			Letter.Y,
			Letter.Z,
			Letter.Σ,
			Letter.Δ,
			Letter.θ,
			Letter.Ω,
			Letter.Φ,
			Letter.Ψ,
			Letter.Λ,
			Letter.α,
			Letter.β,
			Letter.Γ
		],
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
		[LetterConditions.ALPHA_STARTING]: [
			Letter.A,
			Letter.B,
			Letter.C,
			Letter.J,
			Letter.K,
			Letter.L,
			Letter.Σ,
			Letter.Δ,
			Letter.θ_DASH,
			Letter.Ω_DASH,
			Letter.Ψ,
			Letter.Φ_DASH,
			Letter.α
		],
		[LetterConditions.BETA_STARTING]: [
			Letter.G,
			Letter.H,
			Letter.I,
			Letter.D,
			Letter.E,
			Letter.F,
			Letter.Σ_DASH,
			Letter.Δ_DASH,
			Letter.θ,
			Letter.Ω,
			Letter.Φ,
			Letter.Ψ_DASH,
			Letter.β
		],
		[LetterConditions.GAMMA_STARTING]: [
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
			Letter.W,
			Letter.X,
			Letter.Y,
			Letter.Z,
			Letter.W_DASH,
			Letter.X_DASH,
			Letter.Y_DASH,
			Letter.Z_DASH,
			Letter.Λ,
			Letter.Λ_DASH,
			Letter.Γ
		],
		[LetterConditions.FOUR_VARIATIONS]: [
			Letter.Φ,
			Letter.Ψ,
			Letter.Λ,
			Letter.Φ_DASH,
			Letter.Ψ_DASH,
			Letter.Λ_DASH,
			Letter.α,
			Letter.β,
			Letter.Γ
		],
		[LetterConditions.EIGHT_VARIATIONS]: [
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
			Letter.Q
		],
		[LetterConditions.SIXTEEN_VARIATIONS]: [
			Letter.C,
			Letter.F,
			Letter.I,
			Letter.L,
			Letter.O,
			Letter.R,
			Letter.U,
			Letter.V,
			Letter.S,
			Letter.T,
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
			Letter.Ω_DASH
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
		],
		[LetterConditions.TYPE1_HYBRID]: [
			Letter.C,
			Letter.F,
			Letter.I,
			Letter.L,
			Letter.O,
			Letter.R,
			Letter.U,
			Letter.V
		],
		[LetterConditions.TYPE1_NON_HYBRID]: [
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
			Letter.T
		],
		[LetterConditions.TYPE1]: [
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
			Letter.C,
			Letter.F,
			Letter.I,
			Letter.L,
			Letter.O,
			Letter.R,
			Letter.U,
			Letter.V
		],
		[LetterConditions.TYPE2]: [
			Letter.W,
			Letter.X,
			Letter.Y,
			Letter.Z,
			Letter.Σ,
			Letter.Δ,
			Letter.θ,
			Letter.Ω
		],
		[LetterConditions.TYPE3]: [
			Letter.W_DASH,
			Letter.X_DASH,
			Letter.Y_DASH,
			Letter.Z_DASH,
			Letter.Σ_DASH,
			Letter.Δ_DASH,
			Letter.θ_DASH,
			Letter.Ω_DASH
		],
		[LetterConditions.TYPE4]: [Letter.Φ, Letter.Ψ, Letter.Λ],
		[LetterConditions.TYPE5]: [Letter.Φ_DASH, Letter.Ψ_DASH, Letter.Λ_DASH],
		[LetterConditions.TYPE6]: [Letter.α, Letter.β, Letter.Γ]
	};

	static getLettersByCondition(condition: LetterConditions): Letter[] {
		return this.conditionMappings[condition] || [];
	}

	private static letterMappings: Record<string, Letter> = {
		α: Letter.α,
		beta: Letter.β,
		β: Letter.β,
		alpha: Letter.α,
		gamma: Letter.Γ,
		Γ: Letter.Γ,
		γ: Letter.Γ,
		theta: Letter.θ,
		theta_dash: Letter.θ_DASH,
		omega: Letter.Ω,
		omega_dash: Letter.Ω_DASH,
		phi: Letter.Φ,
		phi_dash: Letter.Φ_DASH,
		psi: Letter.Ψ,
		psi_dash: Letter.Ψ_DASH,
		lambda: Letter.Λ,
		lambda_dash: Letter.Λ_DASH,
		sigma: Letter.Σ,
		sigma_dash: Letter.Σ_DASH,
		delta: Letter.Δ,
		delta_dash: Letter.Δ_DASH
	};
	static fromString(letterStr: string): Letter {
		if (!letterStr) {
			throw new Error('Cannot convert empty input to Letter');
		}

		// Trim and preprocess the input
		let normalizedStr = letterStr
			.trim()
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
			// Normalize dashes and case
			.toLowerCase()
			.replace(/-/g, '_dash');

		// Direct mapping for known variations
		if (this.letterMappings[normalizedStr]) {
			return this.letterMappings[normalizedStr];
		}

		// Try direct enum match (with dash variants)
		const enumKey = Object.keys(Letter).find((key) => key.toLowerCase() === normalizedStr);

		if (enumKey) {
			return Letter[enumKey as keyof typeof Letter];
		}

		// Logging with comprehensive context for easier debugging
		console.warn(`Could not convert letter: "${letterStr}"`, {
			normalizedStr,
			availableLetters: Object.keys(Letter)
		});

		throw new Error(`No matching enum member for string: ${letterStr}`);
	}

	// More forgiving version that returns null instead of throwing
	static tryFromString(letterStr: string): Letter | null {
		try {
			return this.fromString(letterStr);
		} catch {
			return null;
		}
	}

	// Optional: Add methods to help with debugging
	static listAllLetters(): string[] {
		return Object.keys(Letter);
	}

	static getLetter(letterStr: string): Letter {
		return this.fromString(letterStr);
	}


}
