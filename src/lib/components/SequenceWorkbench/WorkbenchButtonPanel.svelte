<!-- src/lib/components/SequenceWorkbench/ButtonPanel/WorkbenchButtonPanel.svelte -->

<script context="module" lang="ts">
	// Type declarations for MDB
	interface MdbRipple {
		new (element: HTMLElement): any;
	}

	declare global {
		interface Window {
			mdb?: {
				Ripple: MdbRipple;
			};
		}
	}
</script>

<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { isSequenceEmpty } from '$lib/stores/sequence/sequenceStateStore';
	import { selectedStartPos } from '$lib/stores/sequence/selectionStore';
	import { beatsStore } from '$lib/stores/sequence/beatsStore';
	// Define types
	type LayoutOrientation = 'vertical' | 'horizontal';

	interface ButtonDefinition {
		icon: string; // Font Awesome icon class
		title: string;
		id: string;
		color?: string;
	}

	// Component props
	export let containerWidth = 0;
	export let containerHeight = 0;
	export let isPortrait = true;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		action: { id: string };
	}>();

	// Reactive layout orientation based on isPortrait
	$: layout = isPortrait ? 'horizontal' : 'vertical';

	// Button data with Font Awesome icons
	const buttons: ButtonDefinition[] = [
		{
			icon: 'fa-book-medical',
			title: 'Add to Dictionary',
			id: 'addToDictionary',
			color: '#4361ee'
		},
		{
			icon: 'fa-save',
			title: 'Save Image',
			id: 'saveImage',
			color: '#3a86ff'
		},
		{
			icon: 'fa-expand',
			title: 'View Full Screen',
			id: 'viewFullScreen',
			color: '#4cc9f0'
		},
		{
			icon: 'fa-arrows-left-right',
			title: 'Mirror Sequence',
			id: 'mirrorSequence',
			color: '#4895ef'
		},
		{
			icon: 'fa-paintbrush',
			title: 'Swap Colors',
			id: 'swapColors',
			color: '#ff6b6b'
		},
		{
			icon: 'fa-rotate',
			title: 'Rotate Sequence',
			id: 'rotateSequence',
			color: '#f72585'
		},
		{
			icon: 'fa-trash',
			title: 'Delete Beat',
			id: 'deleteBeat',
			color: '#ff9e00'
		},
		{
			icon: 'fa-eraser',
			title: 'Clear Sequence',
			id: 'clearSequence',
			color: '#ff7b00'
		}
	];

	// Reactive button size calculation
	$: buttonSize = calculateButtonSize(containerWidth, containerHeight, isPortrait);

	// Handle button click and create ripple effect
	function handleButtonClick(id: string) {
		// Dispatch action to parent components
		dispatch('action', { id });

		// Handle specific actions here directly
		if (id === 'clearSequence') {
			// Clear the sequence
			selectedStartPos.set(null);
			isSequenceEmpty.set(true);

			// Also clear the beats store
			beatsStore.update((beats) => []);

			// Dispatch additional event if needed for other components
			const customEvent = new CustomEvent('sequence-cleared', {
				bubbles: true
			});
			document.dispatchEvent(customEvent);
		}
	}
	// Calculate button size based on container dimensions and orientation
	function calculateButtonSize(width: number, height: number, isPortrait: boolean): number {
		const isMobile = width <= 768;

		if (isMobile) {
			return Math.max(30, Math.min(60, width / 10));
		} else if (isPortrait) {
			return Math.max(30, Math.min(60, width / 10));
		} else {
			return Math.max(30, Math.min(60, height / 14));
		}
	}

	// Initialize MDB Ripple effect
	let buttonsReady = false;

	onMount(() => {
		// Load Font Awesome
		if (!document.getElementById('font-awesome-css')) {
			const link = document.createElement('link');
			link.id = 'font-awesome-css';
			link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
			link.rel = 'stylesheet';
			document.head.appendChild(link);
		}

		// Load MDB Ripple
		if (!document.getElementById('mdb-ripple-css')) {
			const linkMDB = document.createElement('link');
			linkMDB.id = 'mdb-ripple-css';
			linkMDB.href = 'https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/6.3.0/mdb.min.css';
			linkMDB.rel = 'stylesheet';
			document.head.appendChild(linkMDB);

			const scriptMDB = document.createElement('script');
			scriptMDB.id = 'mdb-ripple-js';
			scriptMDB.src = 'https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/6.3.0/mdb.min.js';
			document.body.appendChild(scriptMDB);

			scriptMDB.onload = () => {
				// Initialize ripple after MDB loads
				buttonsReady = true;
				setTimeout(initializeRipple, 100);
			};
		} else {
			// MDB already loaded
			buttonsReady = true;
			setTimeout(initializeRipple, 100);
		}
	});

	function initializeRipple() {
		// Use type assertion to tell TypeScript that window.mdb exists
		const mdb = (window as any).mdb;

		if (!buttonsReady || typeof window === 'undefined' || !mdb) return;

		const rippleButtons = document.querySelectorAll('.modern-button');
		rippleButtons.forEach((button) => {
			// Safely initialize ripple
			if (mdb.Ripple) {
				new mdb.Ripple(button as HTMLElement);
			}
		});
	}
</script>

<div
	class="button-panel"
	class:vertical={layout === 'vertical'}
	class:horizontal={layout === 'horizontal'}
>
	{#each buttons as button (button.id)}
		<div class="button-container" style="width: {buttonSize}px; height: {buttonSize}px;">
			<button
				class="modern-button ripple"
				on:click={() => handleButtonClick(button.id)}
				title={button.title}
				aria-label={button.title}
				style="--button-color: {button.color || '#555'};"
				data-mdb-ripple="true"
				data-mdb-ripple-color="light"
			>
				<i class="fa-solid {button.icon}" style="font-size: {buttonSize * 0.5}px;"></i>
			</button>
		</div>
	{/each}
</div>

<style>
	.button-panel {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
		flex: 1;
		padding: 5px;
		border-radius: 8px;
	}

	.vertical {
		flex-direction: column;
	}

	.horizontal {
		flex-direction: row;
	}

	.button-container {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.modern-button {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: white;
		border: 2px solid var(--button-color);
		color: var(--button-color);
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
		position: relative;
		overflow: hidden; /* Important for containing ripples */
	}

	.modern-button:hover {
		background-color: var(--button-color);
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
	}

	.modern-button:active {
		transform: translateY(1px);
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}
</style>
