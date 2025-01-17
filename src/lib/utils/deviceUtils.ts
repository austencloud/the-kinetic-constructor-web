export function isMobile(): boolean {
    if (typeof navigator !== 'undefined') {
        return /Mobi|Android/i.test(navigator.userAgent);
    }
    return false;
}

export function isPortrait(): boolean {
    if (typeof window !== 'undefined' && typeof window.matchMedia !== 'undefined') {
        return window.matchMedia('(orientation: portrait)').matches;
    }
    return false;
}
