<!-- src/lib/components/BrowseTab/SequenceViewer/SequenceViewer.svelte -->
<script lang="ts">
	import { selectedSequenceData, browseTabStore } from '$lib/stores/browseTab/browseTabStore';

	let {
		onselectVariation,
		ontoggleFavorite,
		ondeleteRequest
	}: {
		onselectVariation?: (index: number) => void;
		ontoggleFavorite?: (data: { sequenceId: string; variationId: string }) => void;
		ondeleteRequest?: (data: {
			type: 'sequence' | 'variation';
			sequenceId: string;
			variationId?: string;
		}) => void;
	} = $props();

	const sequence = $derived($selectedSequenceData.sequence);
	const variation = $derived($selectedSequenceData.variation);
	const currentIndex = $derived($browseTabStore.selectedVariationIndex);
	const totalVariations = $derived(sequence?.variations.length || 0);
	const hasPrevious = $derived(currentIndex > 0);
	const hasNext = $derived(currentIndex < totalVariations - 1);
	const isFavorite = $derived(variation?.metadata.isFavorite || false);

	function handlePrevious() {
		if (hasPrevious) {
			onselectVariation?.(currentIndex - 1);
		}
	}

	function handleNext() {
		if (hasNext) {
			onselectVariation?.(currentIndex + 1);
		}
	}

	function handleFavoriteToggle() {
		if (sequence && variation) {
			ontoggleFavorite?.({
				sequenceId: sequence.id,
				variationId: variation.id
			});
		}
	}

	function handleDeleteVariation() {
		if (sequence && variation) {
			ondeleteRequest?.({
				type: 'variation',
				sequenceId: sequence.id,
				variationId: variation.id
			});
		}
	}

	function handleDeleteSequence() {
		if (sequence) {
			ondeleteRequest?.({
				type: 'sequence',
				sequenceId: sequence.id
			});
		}
	}

	// Generate a data URL for a simple SVG thumbnail
	const generateSequenceImageSvg = (word: string) => {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
			<rect width="400" height="400" fill="#333333"/>
			<text x="200" y="200" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="24" font-weight="bold">${word}</text>
		</svg>`;
		return `data:image/svg+xml;base64,${btoa(svg)}`;
	};

	const placeholderImage = $derived(sequence ? generateSequenceImageSvg(sequence.word) : '');
</script>

<div class="sequence-viewer">
	{#if sequence && variation}
		<div class="viewer-header">
			<h2 class="sequence-title">{sequence.word}</h2>
			<div class="sequence-metadata">
				{#if sequence.metadata.author}
					<span class="metadata-item author">By {sequence.metadata.author}</span>
				{/if}
				{#if sequence.metadata.level}
					<span class="metadata-item difficulty" data-level={sequence.metadata.level}>
						Level {sequence.metadata.level}
					</span>
				{/if}
			</div>
		</div>

		<div class="viewer-content">
			<div class="image-container">
				<img
					src={placeholderImage}
					alt={`${sequence.word} (Variation ${currentIndex + 1})`}
					class="sequence-image"
				/>

				<div class="variation-navigation">
					<button
						class="nav-button prev"
						disabled={!hasPrevious}
						onclick={handlePrevious}
						aria-label="Previous variation"
					>
						←
					</button>

					<div class="variation-indicator">
						{currentIndex + 1} / {totalVariations}
					</div>

					<button
						class="nav-button next"
						disabled={!hasNext}
						onclick={handleNext}
						aria-label="Next variation"
					>
						→
					</button>
				</div>
			</div>

			<div class="sequence-details">
				<div class="details-section">
					<h3>Details</h3>
					<div class="details-grid">
						{#if sequence.metadata.gridMode}
							<div class="detail-item">
								<span class="detail-label">Grid Mode:</span>
								<span class="detail-value">{sequence.metadata.gridMode}</span>
							</div>
						{/if}

						{#if sequence.metadata.startingPosition}
							<div class="detail-item">
								<span class="detail-label">Starting Position:</span>
								<span class="detail-value">{sequence.metadata.startingPosition}</span>
							</div>
						{/if}

						{#if sequence.metadata.length}
							<div class="detail-item">
								<span class="detail-label">Length:</span>
								<span class="detail-value">{sequence.metadata.length} beats</span>
							</div>
						{/if}

						{#if sequence.metadata.dateAdded}
							<div class="detail-item">
								<span class="detail-label">Date Added:</span>
								<span class="detail-value">
									{new Date(sequence.metadata.dateAdded).toLocaleDateString()}
								</span>
							</div>
						{/if}
					</div>
				</div>

				{#if sequence.metadata.tags && sequence.metadata.tags.length > 0}
					<div class="details-section">
						<h3>Tags</h3>
						<div class="tags-container">
							{#each sequence.metadata.tags as tag}
								<span class="tag">{tag}</span>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<div class="action-buttons">
			<button
				class="action-button favorite"
				class:active={isFavorite}
				onclick={handleFavoriteToggle}
				aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
			>
				<span class="button-icon">{isFavorite ? '★' : '☆'}</span>
				<span class="button-text">{isFavorite ? 'Favorited' : 'Favorite'}</span>
			</button>

			<div class="delete-buttons">
				<button
					class="action-button delete"
					onclick={handleDeleteVariation}
					aria-label="Delete variation"
				>
					<span class="button-icon">🗑️</span>
					<span class="button-text">Delete Variation</span>
				</button>

				<button
					class="action-button delete-sequence"
					onclick={handleDeleteSequence}
					aria-label="Delete sequence"
				>
					<span class="button-icon">🗑️</span>
					<span class="button-text">Delete Sequence</span>
				</button>
			</div>
		</div>
	{:else}
		<div class="empty-viewer">
			<p>Select a sequence to view details</p>
		</div>
	{/if}
</div>

<style>
	.sequence-viewer {
		height: 100%;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		background-color: var(--background-color-secondary, #252525);
	}

	.viewer-header {
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border-color, #333333);
	}

	.sequence-title {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.sequence-metadata {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.metadata-item {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.8rem;
	}

	.metadata-item.author {
		background-color: var(--tag-background, #2a3a4a);
	}

	.metadata-item.difficulty {
		color: white;
	}

	.metadata-item.difficulty[data-level='1'] {
		background-color: #4caf50;
	}

	.metadata-item.difficulty[data-level='2'] {
		background-color: #8bc34a;
	}

	.metadata-item.difficulty[data-level='3'] {
		background-color: #ffc107;
	}

	.metadata-item.difficulty[data-level='4'] {
		background-color: #ff9800;
	}

	.metadata-item.difficulty[data-level='5'] {
		background-color: #f44336;
	}

	.viewer-content {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.image-container {
		position: relative;
		width: 100%;
	}

	.sequence-image {
		width: 100%;
		aspect-ratio: 1;
		object-fit: contain;
		border-radius: 8px;
		background-color: var(--card-background, #2a2a2a);
	}

	.variation-navigation {
		position: absolute;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background-color: rgba(0, 0, 0, 0.7);
		padding: 0.5rem;
		border-radius: 8px;
	}

	.nav-button {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--button-background, #333333);
		color: var(--text-color, #ffffff);
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	.nav-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.variation-indicator {
		padding: 0 0.5rem;
		font-size: 0.9rem;
	}

	.sequence-details {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.details-section h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--text-color-secondary, #aaaaaa);
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.75rem;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.detail-label {
		font-size: 0.8rem;
		color: var(--text-color-secondary, #aaaaaa);
	}

	.detail-value {
		font-size: 0.9rem;
		font-weight: 500;
	}

	.tags-container {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		background-color: var(--tag-background, #2a3a4a);
		border-radius: 4px;
		font-size: 0.8rem;
	}

	.action-buttons {
		margin-top: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.action-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.action-button.favorite {
		background-color: var(--favorite-button-background, #2a3a4a);
		color: var(--text-color, #ffffff);
	}

	.action-button.favorite.active {
		background-color: #ffc107;
		color: #000000;
	}

	.action-button.delete {
		background-color: var(--danger-color-muted, #553333);
		color: var(--text-color, #ffffff);
	}

	.action-button.delete-sequence {
		background-color: var(--danger-color-muted, #553333);
		color: var(--text-color, #ffffff);
		font-size: 0.9rem;
	}

	.action-button:hover {
		filter: brightness(1.1);
	}

	.button-icon {
		font-size: 1.2rem;
	}

	.delete-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.empty-viewer {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-color-secondary, #aaaaaa);
	}
</style>
