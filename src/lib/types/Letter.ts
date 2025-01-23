// Letter.ts

export enum LetterConditions {
	PRO = 'pro',
	ANTI = 'anti',
	DASH = 'dash',
	HAS_STATIC = 'static',
	ALPHA_ENDING = 'alpha_ending',
	BETA_ENDING = 'beta_ending',
	GAMMA_ENDING = 'gamma_ending',
	ALPHA_STARTING = 'alpha_starting',
	BETA_STARTING = 'beta_starting',
	GAMMA_STARTING = 'gamma_starting',
	FOUR_VARIATIONS = 'four_variations',
	EIGHT_VARIATIONS = 'eight_variations',
	SIXTEEN_VARIATIONS = 'sixteen_variations',
	HYBRID = 'hybrid',
	NON_HYBRID = 'non_hybrid',
	TYPE1_HYBRID = 'type1_hybrids',
	TYPE1_NON_HYBRID = 'type1_non_hybrids',
	TYPE1 = 'type1',
	TYPE2 = 'type2',
	TYPE3 = 'type3',
	TYPE4 = 'type4',
	TYPE5 = 'type5',
	TYPE6 = 'type6'
}

export enum Letter {
	A = 'A',
	B = 'B',
	C = 'C',
	D = 'D',
	E = 'E',
	F = 'F',
	G = 'G',
	H = 'H',
	I = 'I',
	J = 'J',
	K = 'K',
	L = 'L',
	M = 'M',
	N = 'N',
	O = 'O',
	P = 'P',
	Q = 'Q',
	R = 'R',
	S = 'S',
	T = 'T',
	U = 'U',
	V = 'V',
	W = 'W',
	X = 'X',
	Y = 'Y',
	Z = 'Z',
	Σ = 'Σ',
	Δ = 'Δ',
	θ = 'θ',
	Ω = 'Ω',
	W_DASH = 'W-',
	X_DASH = 'X-',
	Y_DASH = 'Y-',
	Z_DASH = 'Z-',
	Σ_DASH = 'Σ-',
	Δ_DASH = 'Δ-',
	θ_DASH = 'θ-',
	Ω_DASH = 'Ω-',
	Φ = 'Φ',
	Ψ = 'Ψ',
	Λ = 'Λ',
	Φ_DASH = 'Φ-',
	Ψ_DASH = 'Ψ-',
	Λ_DASH = 'Λ-',
	α = 'α',
	β = 'β',
	Γ = 'Γ'
}

export class LetterType {
	static Type1 = new LetterType(
		[
			'A',
			'B',
			'C',
			'D',
			'E',
			'F',
			'G',
			'H',
			'I',
			'J',
			'K',
			'L',
			'M',
			'N',
			'O',
			'P',
			'Q',
			'R',
			'S',
			'T',
			'U',
			'V'
		],
		'Dual-Shift'
	);
	static Type2 = new LetterType(['W', 'X', 'Y', 'Z', 'Σ', 'Δ', 'θ', 'Ω'], 'Shift');
	static Type3 = new LetterType(['W-', 'X-', 'Y-', 'Z-', 'Σ-', 'Δ-', 'θ-', 'Ω-'], 'Cross-Shift');
	static Type4 = new LetterType(['Φ', 'Ψ', 'Λ'], 'Dash');
	static Type5 = new LetterType(['Φ-', 'Ψ-', 'Λ-'], 'Dual-Dash');
	static Type6 = new LetterType(['α', 'β', 'Γ'], 'Static');

	private constructor(
		public letters: string[],
		public description: string
	) {}

	static getLetterType(letter: Letter): LetterType | null {
		const letterStr = letter as unknown as string;
		for (const letterType of Object.values(LetterType)) {
			if (letterType instanceof LetterType && letterType.letters.includes(letterStr)) {
				return letterType;
			}
		}
		return null;
	}

	static sortKey(letterStr: string): [number, number] {
		const fromStringLetter: Letter = Letter[letterStr as keyof typeof Letter];
		if (!fromStringLetter) {
			return [999, 999];
		}

		const letterType = this.getLetterType(fromStringLetter);
		if (!letterType) {
			return [999, 999];
		}

		const typeIndex = Object.values(LetterType).indexOf(letterType);
		const letterIndex = letterType.letters.indexOf(letterStr);

		return [typeIndex, letterIndex];
	}
}

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

	static fromString(letterStr: string): Letter {
		const normalizedStr = letterStr.replace('-', '_DASH');
		if (normalizedStr in Letter) {
			return Letter[normalizedStr as keyof typeof Letter];
		}
		throw new Error(`No matching enum member for string: ${letterStr}`);
	}

	static getLetter(letterStr: string): Letter {
		return this.fromString(letterStr);
	}

	static getLetterType(letter: Letter): LetterType | null {
		return LetterType.getLetterType(letter);
	}
}
