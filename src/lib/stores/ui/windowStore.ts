// src/lib/stores/ui/windowStore.ts
import { writable } from 'svelte/store';

function createWindowHeight() {
	const { subscribe, set } = writable(`${window.innerHeight}px`);

	function update() {
		set(`${window.innerHeight}px`);
	}

	window.addEventListener('resize', update);
	update();

	return { subscribe };
}

export const windowHeight = createWindowHeight();
