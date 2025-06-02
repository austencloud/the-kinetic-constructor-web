<!--
  Modern Sequence Workbench Container
  Smart container component that handles business logic
  Uses service injection and provides clean separation of concerns
-->
<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { ISequenceService } from '$lib/services/core/ISequenceService';
	import type { IWorkbenchService } from '$lib/services/core/IWorkbenchService';
	import BeatGrid from '../BeatFrame/modern/BeatGrid.svelte';
	import { useResizeObserver } from '$lib/composables/useResizeObserver';
	import { browser } from '$app/environment';
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';

	// Service injection
	const sequenceService = getContext<ISequenceService>('sequenceService');
	const workbenchService = getContext<IWorkbenchService>('workbenchService');

	// Props for external integration
	const props = $props<{
		onBeatSelected?: (beatId: string) => void;
		onSequenceChanged?: () => void;
	}>();

	// Resize observer for responsive layout
	const { size, resizeObserver } = useResizeObserver({
		width: browser ? window.innerWidth : 1024,
		height: browser ? window.innerHeight : 768
	});

	// Reactive state from services
	const beats = $derived(sequenceService.state.beats);
	const selectedBeatIds = $derived(sequenceService.state.selectedBeatIds);
	const isEmpty = $derived(sequenceService.isEmpty);
	const hasSelection = $derived(sequenceService.hasSelection);
	const activePanel = $derived(workbenchService.state.activePanel);

	// One-time setup only
	onMount(() => {
		// Setup keyboard shortcuts (non-reactive)
		function handleKeyboardShortcuts(event: KeyboardEvent) {
			if (event.ctrlKey || event.metaKey) {
				switch (event.key) {
					case 'a':
						event.preventDefault();
						sequenceService.selectAll();
						break;
					case 'd':
						event.preventDefault();
						sequenceService.clearSelection();
						break;
					case 'n':
						event.preventDefault();
						handleAddBeat();
						break;
					case 'Delete':
					case 'Backspace':
						event.preventDefault();
						handleClearSequence();
						break;
				}
			} else {
				switch (event.key) {
					case 'Escape':
						sequenceService.clearSelection();
						break;
					case 'Delete':
					case 'Backspace':
						if (hasSelection) {
							selectedBeatIds.forEach((beatId) => {
								if (beatId !== 'start-position') {
									sequenceService.removeBeat(beatId);
								}
							});
							props.onSequenceChanged?.();
						}
						break;
				}
			}
		}

		if (typeof window !== 'undefined') {
			document.addEventListener('keydown', handleKeyboardShortcuts);

			// Handle resize events manually
			function handleResize() {
				if ($size.width > 0 && $size.height > 0) {
					workbenchService.handleResize($size.width, $size.height);
				}
			}

			window.addEventListener('resize', handleResize);

			if (import.meta.env.DEV) {
				console.log('Modern SequenceWorkbench initialized');
			}

			return () => {
				document.removeEventListener('keydown', handleKeyboardShortcuts);
				window.removeEventListener('resize', handleResize);
			};
		}
	});

	// Business logic event handlers
	function handleBeatClick(beatId: string) {
		console.log('Modern: Beat clicked:', beatId);

		// Update selection through service
		sequenceService.selectBeat(beatId);

		// Switch to construct panel if we have a selection
		if (activePanel === 'generate') {
			workbenchService.setActivePanel('construct');
		}

		// Notify parent component
		props.onBeatSelected?.(beatId);
	}

	function handleBeatDoubleClick(beatId: string) {
		console.log('Modern: Beat double-clicked:', beatId);

		// Select the beat and open editor
		sequenceService.selectBeat(beatId);
		workbenchService.setActivePanel('construct');

		// Focus on editor after a brief delay
		setTimeout(() => {
			const editorElement = document.querySelector('[data-focus-target]') as HTMLElement;
			if (editorElement) {
				editorElement.focus();
			}
		}, 100);

		props.onBeatSelected?.(beatId);
	}

	function handleStartPosClick() {
		console.log('Modern: Start position clicked');

		// Select start position
		sequenceService.selectBeat('start-position');

		// Switch to appropriate panel
		if (isEmpty) {
			workbenchService.setActivePanel('generate');
		} else {
			workbenchService.setActivePanel('construct');
		}

		props.onBeatSelected?.('start-position');
	}

	function handleAddBeat() {
		console.log('Modern: Adding new beat');

		// Create a new empty beat
		const newBeat = {
			id: crypto.randomUUID(),
			beatNumber: beats.length + 1,
			filled: false,
			pictographData: defaultPictographData,
			blueMotionData: null,
			redMotionData: null,
			metadata: {
				blueReversal: false,
				redReversal: false,
				tags: []
			}
		};

		sequenceService.addBeat(newBeat);

		// Auto-select the new beat
		sequenceService.selectBeat(newBeat.id);

		// Switch to construct panel
		workbenchService.setActivePanel('construct');

		props.onSequenceChanged?.();
	}

	function handleClearSequence() {
		console.log('Modern: Clearing sequence');

		if (confirm('Are you sure you want to clear the entire sequence?')) {
			sequenceService.clearSequence();
			workbenchService.setActivePanel('generate');
			props.onSequenceChanged?.();
		}
	}
</script>

<div
	class="sequence-workbench-container modern"
	use:resizeObserver
	style="--container-width: {$size.width}px; --container-height: {$size.height}px;"
>
	<!-- Main beat grid -->
	<div class="beat-grid-wrapper">
		<BeatGrid
			onBeatClick={handleBeatClick}
			onBeatDoubleClick={handleBeatDoubleClick}
			onStartPosClick={handleStartPosClick}
		/>
	</div>

	<!-- Action toolbar -->
	<div class="action-toolbar">
		<button
			class="action-button primary"
			onclick={handleAddBeat}
			disabled={beats.length >= 100}
			aria-label="Add new beat"
		>
			+ Add Beat
		</button>

		<button
			class="action-button secondary"
			onclick={handleClearSequence}
			disabled={isEmpty}
			aria-label="Clear sequence"
		>
			Clear All
		</button>

		<div class="sequence-info">
			<span class="beat-count">Sequence Ready</span>
			<span class="selection-count">Modern UI</span>
		</div>
	</div>

	<!-- FIXED: Status bar without reactive expressions -->
	<div class="status-bar">
		<div class="status-item">Status: Active</div>
		<div class="status-item">Modern Architecture</div>
		{#if import.meta.env.DEV}
			<div class="status-item performance">Performance: Optimized</div>
		{/if}
	</div>
</div>

<style>
	.sequence-workbench-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
		border-radius: 12px;
		overflow: hidden;
		contain: layout style paint;
	}

	.sequence-workbench-container.modern {
		/* Modern styling indicator */
		border: 2px solid rgba(59, 130, 246, 0.2);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	.beat-grid-wrapper {
		flex: 1;
		overflow: hidden;
		position: relative;
	}

	.action-toolbar {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		background: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(8px);
		border-top: 1px solid rgba(0, 0, 0, 0.1);
	}

	.action-button {
		padding: 8px 16px;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-button.primary {
		background: #3b82f6;
		color: white;
	}

	.action-button.primary:hover:not(:disabled) {
		background: #2563eb;
		transform: translateY(-1px);
	}

	.action-button.secondary {
		background: #6b7280;
		color: white;
	}

	.action-button.secondary:hover:not(:disabled) {
		background: #4b5563;
	}

	.action-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.sequence-info {
		margin-left: auto;
		display: flex;
		gap: 12px;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.beat-count {
		font-weight: 600;
	}

	.selection-count {
		color: #3b82f6;
		font-weight: 600;
	}

	.status-bar {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 8px 16px;
		background: rgba(0, 0, 0, 0.05);
		font-size: 0.75rem;
		color: #6b7280;
	}

	.status-item.performance {
		font-family: monospace;
		color: #10b981;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.action-toolbar {
			flex-wrap: wrap;
			gap: 8px;
		}

		.sequence-info {
			margin-left: 0;
			width: 100%;
			justify-content: space-between;
		}

		.status-bar {
			flex-wrap: wrap;
			gap: 8px;
		}
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.sequence-workbench-container {
			background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
		}

		.action-toolbar {
			background: rgba(0, 0, 0, 0.3);
			border-top-color: rgba(255, 255, 255, 0.1);
		}

		.status-bar {
			background: rgba(255, 255, 255, 0.05);
		}
	}
</style>
