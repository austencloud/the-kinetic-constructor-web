/**
 * Embedded SVGs for critical props and arrows
 * This ensures they're always available without network requests
 */

// Staff prop SVG embedded directly

// Red staff SVG (with color applied)
export const RED_STAFF_SVG = `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" id="staff" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
     viewBox="0 0 252.8 77.8" style="enable-background:new 0 0 252.8 77.8;" xml:space="preserve">
<style type="text/css">
    .st0{fill:#ED1C24;stroke:#FFFFFF;stroke-width:2.75;stroke-miterlimit:10;}
    .st1{fill:#FF0000;}
</style>
<path class="st0" d="M251.4,67.7V10.1c0-4.8-4.1-8.7-9.1-8.7s-9.1,3.9-9.1,8.7v19.2H10.3c-4.9,0-8.9,3.8-8.9,8.5V41
    c0,4.6,4,8.5,8.9,8.5h222.9v18.2c0,4.8,4.1,8.7,9.1,8.7S251.4,72.5,251.4,67.7z"/>
<circle id="centerPoint" class="st1" cx="126.4" cy="38.9" r="2"/>
</svg>`;

// Blue staff SVG (with color applied)
export const BLUE_STAFF_SVG = `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" id="staff" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
     viewBox="0 0 252.8 77.8" style="enable-background:new 0 0 252.8 77.8;" xml:space="preserve">
<style type="text/css">
    .st0{fill:#2E3192;stroke:#FFFFFF;stroke-width:2.75;stroke-miterlimit:10;}
    .st1{fill:#FF0000;}
</style>
<path class="st0" d="M251.4,67.7V10.1c0-4.8-4.1-8.7-9.1-8.7s-9.1,3.9-9.1,8.7v19.2H10.3c-4.9,0-8.9,3.8-8.9,8.5V41
    c0,4.6,4,8.5,8.9,8.5h222.9v18.2c0,4.8,4.1,8.7,9.1,8.7S251.4,72.5,251.4,67.7z"/>
<circle id="centerPoint" class="st1" cx="126.4" cy="38.9" r="2"/>
</svg>`;

// Get the embedded SVG for a prop by type and color
export function getEmbeddedPropSvg(propType: string, color: string): string | null {
	if (propType === 'staff') {
		return color === 'red' ? RED_STAFF_SVG : BLUE_STAFF_SVG;
	}
	return null;
}
