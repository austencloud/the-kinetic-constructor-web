<script lang="ts">
	import type { ViewOption } from './types';

	export let selectedViewOption: ViewOption;
	export let isOpen: boolean;
	export let onClick: () => void;
	export let buttonElement: HTMLButtonElement | null = null;
</script>

<button
	class="view-button"
	bind:this={buttonElement}
	on:click={onClick}
	aria-label="Change view mode"
	aria-expanded={isOpen}
	aria-haspopup="listbox"
	title={selectedViewOption.description}
>
	<span class="view-icon" aria-hidden="true">{selectedViewOption.icon}</span>
	<span class="view-label">{selectedViewOption.label}</span>
	<span class="dropdown-arrow" aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
</button>

<style>
	.view-button {
		display: flex;
		align-items: center;
		gap: 8px;
		background-color: rgba(30, 41, 59, 0.8); /* Dark blue-gray with transparency */
		border: 1px solid rgba(71, 85, 105, 0.5); /* Subtle border */
		border-radius: 10px;
		padding: 10px 14px;
		font-size: 0.95rem;
		font-weight: 500;
		color: #e2e8f0; /* Light gray text */
		cursor: pointer;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		box-shadow:
			0 4px 6px rgba(0, 0, 0, 0.1),
			0 1px 3px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.1); /* Inner highlight */
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		white-space: nowrap;
		user-select: none;
		position: relative;
		overflow: hidden;
	}

	/* Add subtle glow effect on hover */
	.view-button::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: radial-gradient(circle at center, rgba(59, 130, 246, 0.15), transparent 70%);
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
	}

	.view-button:hover::after {
		opacity: 1;
	}

	/* Label styling */
	.view-label {
		font-weight: 500;
		letter-spacing: 0.01em;
		margin-right: 4px;
	}

	.view-button:hover {
		background-color: rgba(51, 65, 85, 0.9);
		border-color: rgba(100, 116, 139, 0.6);
		box-shadow:
			0 6px 12px rgba(0, 0, 0, 0.15),
			0 2px 4px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.15);
		transform: translateY(-1px);
	}

	.view-button:active {
		transform: translateY(1px);
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.1),
			inset 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.view-button:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 3px rgba(59, 130, 246, 0.5),
			0 4px 6px rgba(0, 0, 0, 0.1);
		border-color: #3b82f6;
	}

	.view-icon {
		font-size: 1.3em;
		line-height: 1;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
		transform-origin: center;
		transition: transform 0.2s ease;
	}

	.view-button:hover .view-icon {
		transform: scale(1.1);
	}

	.dropdown-arrow {
		font-size: 0.7em;
		opacity: 0.8;
		margin-left: 4px;
		transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy transition */
	}

	.view-button:hover .dropdown-arrow {
		opacity: 1;
	}

	/* Rotate arrow when dropdown is open */
	.view-button[aria-expanded='true'] .dropdown-arrow {
		transform: rotate(180deg);
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.view-button {
			padding: 6px 8px;
			font-size: 0.85rem;
			gap: 4px;
			min-width: 70px;
			max-width: 90px;
			height: 36px; /* Fixed height to match tab buttons */
			display: flex;
			align-items: center;
		}

		.view-label {
			max-width: 60px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.dropdown-arrow {
			font-size: 0.8rem;
		}
	}

	/* For very small screens, show only the icon */
	@media (max-width: 380px) {
		.view-button {
			min-width: 36px;
			max-width: 36px;
			padding: 6px;
			justify-content: center;
		}

		.view-label,
		.dropdown-arrow {
			display: none;
		}
	}
</style>
