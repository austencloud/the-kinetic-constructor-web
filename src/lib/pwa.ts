import { browser } from '$app/environment';

// This conditional is important for SSR
if (browser) {
	if ('serviceWorker' in navigator) {
		window.addEventListener('load', () => {
			navigator.serviceWorker
				.register('/sw.js')
				.then((registration) => {
					console.log('Service worker registered successfully:', registration.scope);
				})
				.catch((error) => {
					console.error('Service worker registration failed:', error);
				});
		});
	}

	// Add event listeners for installation/updates
	window.addEventListener('beforeinstallprompt', (event) => {
		// Prevent the mini-infobar from appearing on mobile
		event.preventDefault();
		// Store the event for later use
		// You could add a UI element here to show "Install this app" button
		console.log('App can be installed, saved event');
		window.deferredPrompt = event;
	});

	// When the app is successfully installed
	window.addEventListener('appinstalled', () => {
		console.log('Application was successfully installed');
		window.deferredPrompt = null;
	});
}
