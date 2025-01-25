// letterSafeNames.ts
import { Letter } from './Letter';

const letterFilenameMap: Partial<Record<Letter, string>> = {
    // Greek letters
    [Letter.Ω]: 'Omega',
    [Letter.θ]: 'Theta',
    [Letter.Σ]: 'Sigma',
    [Letter.Δ]: 'Delta',
    [Letter.Φ]: 'Phi',
    [Letter.Ψ]: 'Psi',
    [Letter.Λ]: 'Lambda',
    [Letter.α]: 'Alpha',
    [Letter.β]: 'Beta',
    [Letter.Γ]: 'Gamma',
    
    // Dashed letters (match the SVG filenames)
    [Letter.Ω_DASH]: 'Omega-',
    [Letter.θ_DASH]: 'Theta-',
    [Letter.Σ_DASH]: 'Sigma-',
    [Letter.Δ_DASH]: 'Delta-',
    [Letter.Φ_DASH]: 'Phi-',
    [Letter.Ψ_DASH]: 'Psi-',
    [Letter.Λ_DASH]: 'Lambda-',
    [Letter.W_DASH]: 'W-',
    [Letter.X_DASH]: 'X-',
    [Letter.Y_DASH]: 'Y-',
    [Letter.Z_DASH]: 'Z-',

    // Add other non-ASCII characters as needed
} as const;

export function safeAsciiName(letter: Letter): string {
    const mapped = letterFilenameMap[letter];
    if (mapped) return mapped;
    
    // Fallback: Use the enum string directly (handles ASCII and dashed names)
    return letter.toString();
}