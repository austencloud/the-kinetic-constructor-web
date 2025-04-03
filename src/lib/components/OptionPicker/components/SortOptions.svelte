<script lang="ts">
	import { optionPickerStore, type SortMethodType } from '../optionPickerStore';
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { clickOutside } from '$lib/actions/clickOutside';

	export let isMobile: boolean = false;

	let isOpen = false;
	let buttonRef: HTMLElement;

	// Define sort options
	const sortOptions: { value: SortMethodType; label: string; icon: string }[] = [
		{ value: 'type', label: 'Sort by Type', icon: '📋' },
		{ value: 'endPosition', label: 'Sort by End Position', icon: '🏁' },
		{ value: 'reversals', label: 'Sort by Reversals', icon: '🔄' }
	];

	let selectedSort: SortMethodType = 'type'; // Default sort method

	onMount(() => {
		// Subscribe to store to get current sort method
		const unsubscribe = optionPickerStore.subscribe((state) => {
			selectedSort = state.sortMethod;
		});

		return () => {
			unsubscribe();
		};
	});

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}

	function handleSort(method: SortMethodType) {
		selectedSort = method;
		optionPickerStore.setSortMethod(method);
		closeDropdown();
	}

	function getSelectedOptionIcon() {
		const option = sortOptions.find((opt) => opt.value === selectedSort);
		return option ? option.icon : '📋';
	}
</script>

<div class="sort-options" class:mobile={isMobile} use:clickOutside={() => closeDropdown()}>
	<button
		class="sort-button"
		class:mobile={isMobile}
		bind:this={buttonRef}
		on:click={toggleDropdown}
		aria-label="Sort options"
		aria-expanded={isOpen}
		aria-haspopup="true"
	>
		<span class="sort-icon">{getSelectedOptionIcon()}</span>
		<span class="sort-text">{isMobile ? '' : 'Sort'}</span>
		<span class="dropdown-arrow">▼</span>
	</button>

	{#if isOpen}
		<div class="dropdown" class:mobile={isMobile} transition:fade={{ duration: 150 }}>
			{#each sortOptions as option}
				<button
					class="dropdown-item"
					class:selected={selectedSort === option.value}
					on:click={() => handleSort(option.value)}
				>
					<span class="option-icon">{option.icon}</span>
					<span class="option-text">{option.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.sort-options {
		position: absolute;
		top: 15px;
		left: 15px;
		z-index: 10;
	}

	.sort-options.mobile {
		top: 10px;
		left: 10px;
	}

	.sort-button {
		display: flex;
		align-items: center;
		background-color: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: 8px 12px;
		font-size: 0.95rem;
		cursor: pointer;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.sort-button.mobile {
		padding: 6px 10px;
		font-size: 0.85rem;
	}

	.sort-button:hover {
		background-color: #f8fafc;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.sort-icon {
		margin-right: 6px;
	}

	.dropdown-arrow {
		font-size: 0.7rem;
		margin-left: 6px;
		opacity: 0.6;
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 5px);
		left: 0;
		background-color: white;
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		min-width: 180px;
		z-index: 100;
		overflow: hidden;
	}

	.dropdown.mobile {
		min-width: 160px;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		width: 100%;
		text-align: left;
		padding: 10px 12px;
		border: none;
		background: none;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.dropdown-item:hover {
		background-color: #f1f5f9;
	}

	.dropdown-item.selected {
		background-color: #edf2f7;
		font-weight: 500;
	}

	.option-icon {
		margin-right: 8px;
		font-size: 1.1rem;
	}
</style>
