/**
 * Embedded SVGs for critical glyphs (letters)
 * This ensures they're always available without network requests
 */

// Letter A
export const LETTER_A_SVG = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" 
    id="Layer_2_00000098917429815362816250000013689750864772693143_" 
    style="style=&quot;enable-background:new 0 0 200.0 100.0&quot;" 
    viewBox="22.48 0 75 100">
  <g id="Layer_1-2">
    <path fill="#000000" 
        d="M96.6,90.1C87.8,60.2,73.5,21.7,71.8,17C70,12.4,64,0,60,0S49.9,12.4,48.1,17c-1.7,4.7-16,43.2-24.7,73.1
           c-2.4,8.4,0.5,9.1,1.7,9.4c16.1,2.1,13.2-3,15.7-14c2.3-10,2.2-14.6,10-14.6c3.8,0,5.6,0.1,9.2,0.1c3.6,0,5.3-0.1,9.1-0.1
           c7.8,0,7.7,4.6,10,14.6c2.5,11-0.4,16.1,15.7,14C96,99.2,98.9,98.5,96.6,90.1z M67.5,56.4H52.4c-1.4,0-2.3-0.7-1.9-2.3L60,19.6
           l9.4,34.5C69.8,55.7,68.9,56.4,67.5,56.4z">
    </path>
  </g>
</svg>`;

// Letter B
export const LETTER_B_SVG = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" 
    id="Layer_2_00000098917429815362816250000013689750864772693143_" 
    style="style=&quot;enable-background:new 0 0 200.0 100.0&quot;" 
    viewBox="22.48 0 75 100">
  <g id="Layer_1-2">
    <path fill="#000000" 
        d="M60.1,100c-19.5,0-37.6-0.1-37.6-0.1V0.1c0,0,18.1-0.1,37.6-0.1c19.5,0,37.6,14.9,37.6,33.3
           c0,9.2-5.1,17.6-13.3,23.4c8.2,5.8,13.3,14.2,13.3,23.4C97.7,85.1,79.6,100,60.1,100z M41.3,42.9h18.8c7.7,0,14-5.6,14-12.5
           c0-6.9-6.3-12.5-14-12.5H41.3V42.9z M41.3,82.1h18.8c7.7,0,14-5.6,14-12.5c0-6.9-6.3-12.5-14-12.5H41.3V82.1z">
    </path>
  </g>
</svg>`;

// Letter C
export const LETTER_C_SVG = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" 
    id="Layer_2_00000098917429815362816250000013689750864772693143_" 
    style="style=&quot;enable-background:new 0 0 200.0 100.0&quot;" 
    viewBox="22.48 0 75 100">
  <g id="Layer_1-2">
    <path fill="#000000" 
        d="M97.7,83.3c-7.7,10.5-20.1,16.7-33.1,16.7C35.1,100,12,77.6,12,50S35.1,0,64.6,0c13,0,25.4,6.2,33.1,16.7
           c2.2,3,1.6,7.2-1.4,9.4c-3,2.2-7.2,1.6-9.4-1.4c-5.1-7-13.4-11.1-22.3-11.1C43.9,13.6,27,30,27,50s16.9,36.4,37.6,36.4
           c8.9,0,17.2-4.1,22.3-11.1c2.2-3,6.4-3.6,9.4-1.4C99.3,76.1,99.9,80.3,97.7,83.3z">
    </path>
  </g>
</svg>`;

// Function to get embedded glyph SVG by letter
export function getEmbeddedGlyphSvg(letter: string): string | null {
  switch (letter.toUpperCase()) {
    case 'A':
      return LETTER_A_SVG;
    case 'B':
      return LETTER_B_SVG;
    case 'C':
      return LETTER_C_SVG;
    default:
      return null;
  }
}
