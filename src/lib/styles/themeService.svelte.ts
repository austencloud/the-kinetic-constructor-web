// src/lib/styles/themeService.svelte.ts - MODERNIZED WITH RUNES
// NO STORES - RUNES ONLY!

// Define theme colors
interface ThemeColors {
	primary: string;
	secondary: string;
	background: string;
	surface: string;
	accent: string;
	error: string;
	text: {
		primary: string;
		secondary: string;
		disabled: string;
	};
}

// Side role colors
interface SideColors {
	main: string;
	light: string;
	medium: string;
	dark: string;
	gradient: string;
}

// Define base themes
const defaultLightTheme: ThemeColors = {
	primary: '#2196F3',
	secondary: '#4CAF50',
	background: '#f4f4f4',
	surface: '#ffffff',
	accent: '#FF4081',
	error: '#F44336',
	text: {
		primary: '#212121',
		secondary: '#757575',
		disabled: '#9E9E9E'
	}
};

const defaultDarkTheme: ThemeColors = {
	primary: '#1E88E5',
	secondary: '#43A047',
	background: '#121212',
	surface: '#1E1E1E',
	accent: '#F06292',
	error: '#E53935',
	text: {
		primary: '#FFFFFF',
		secondary: '#B0B0B0',
		disabled: '#757575'
	}
};

// Define side colors
const blueColors: SideColors = {
	main: '#2E3192',
	light: 'rgba(46, 49, 146, 0.4)',
	medium: 'rgba(46, 49, 146, 0.8)',
	dark: '#1a1c5a',
	gradient: 'linear-gradient(135deg, rgba(46, 49, 146, 0.1), rgba(46, 49, 146, 0.8)), #fff'
};

const redColors: SideColors = {
	main: '#ED1C24',
	light: 'rgba(237, 28, 36, 0.4)',
	medium: 'rgba(237, 28, 36, 0.8)',
	dark: '#b50d14',
	gradient: 'linear-gradient(135deg, rgba(237, 28, 36, 0.1), rgba(237, 28, 36, 0.8)), #fff'
};

// MODERNIZED: Use runes instead of stores - NO STORES!
let currentTheme = $state<'light' | 'dark'>('light');
let customColors = $state<Partial<ThemeColors>>({});

// MODERNIZED: Use $derived instead of derived store - NO STORES!
const activeTheme = $derived(() => {
	const baseTheme = currentTheme === 'light' ? defaultLightTheme : defaultDarkTheme;
	return { ...baseTheme, ...customColors };
});

// Export functions to access the state
export function getCurrentTheme() {
	return currentTheme;
}

export function getCustomColors() {
	return customColors;
}

export function getActiveTheme() {
	return activeTheme;
}

// Helper function to generate CSS variable string
function generateCSSVariables(theme: ThemeColors, blue: SideColors, red: SideColors): string {
	let cssVars = '';

	// Add theme colors
	Object.entries(theme).forEach(([key, value]) => {
		if (typeof value === 'object') {
			// Handle nested objects like text
			Object.entries(value).forEach(([nestedKey, nestedValue]) => {
				cssVars += `--color-${key}-${nestedKey}: ${nestedValue};\n`;
			});
		} else {
			cssVars += `--color-${key}: ${value};\n`;
		}
	});

	// Add blue side colors
	Object.entries(blue).forEach(([key, value]) => {
		cssVars += `--color-blue-${key}: ${value};\n`;
	});

	// Add red side colors
	Object.entries(red).forEach(([key, value]) => {
		cssVars += `--color-red-${key}: ${value};\n`;
	});

	return cssVars;
}

// MODERNIZED: Use $derived for CSS variables - NO STORES!
const cssVariables = $derived(() => {
	return generateCSSVariables(activeTheme, blueColors, redColors);
});

// MODERNIZED: Use $derived for dark mode check - NO STORES!
const isDarkMode = $derived(() => currentTheme === 'dark');

// Export functions to access derived values
export function getCssVariables() {
	return cssVariables;
}

export function getIsDarkMode() {
	return isDarkMode;
}

// MODERNIZED: Pure runes-based API - NO STORES!
export const themeService = {
	// Getters
	getActiveTheme: () => activeTheme,
	getBlueColors: () => blueColors,
	getRedColors: () => redColors,
	getCurrentTheme: () => currentTheme,
	getCssVariables: () => cssVariables,
	getIsDarkMode: () => isDarkMode,

	// Reactive values
	get activeTheme() {
		return activeTheme;
	},
	get cssVariables() {
		return cssVariables;
	},
	get isDarkMode() {
		return isDarkMode;
	},

	// Actions
	setTheme: (theme: 'light' | 'dark') => {
		currentTheme = theme;
	},
	toggleTheme: () => {
		currentTheme = currentTheme === 'light' ? 'dark' : 'light';
	},

	setCustomColors: (colors: Partial<ThemeColors>) => {
		customColors = colors;
	},

	// Apply theme to document
	applyTheme: () => {
		const style = document.createElement('style');
		style.textContent = `:root {\n${cssVariables}}`;

		// Remove previous theme style if it exists
		const prevStyle = document.getElementById('theme-variables');
		if (prevStyle) {
			prevStyle.remove();
		}

		// Add new style
		style.id = 'theme-variables';
		document.head.appendChild(style);

		// Also set dark mode class on body
		if (currentTheme === 'dark') {
			document.body.classList.add('dark-theme');
		} else {
			document.body.classList.remove('dark-theme');
		}
	}
};

// Theme effects are now handled by EffectsInitializer.svelte component

// Initialize theme on import (without $effect)
if (typeof window !== 'undefined') {
	// Check for user preference
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	if (prefersDark) {
		currentTheme = 'dark';
	}

	// Apply theme
	themeService.applyTheme();
}
