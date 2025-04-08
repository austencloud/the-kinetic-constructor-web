<script lang="ts">
	import { getContext, onDestroy } from 'svelte';
	import { writable, get } from 'svelte/store'; // Correct import
	import { fade } from 'svelte/transition';
	import { LAYOUT_CONTEXT_KEY, type LayoutContext } from '../layoutContext';
	import { activeLayoutRule } from '../utils/layoutUtils';

	// --- State ---
	let showInfo = false;
	const layoutContext = getContext<LayoutContext>(LAYOUT_CONTEXT_KEY);

	// --- Copy Button State ---
	type CopyStatus = 'idle' | 'copying' | 'copied' | 'error';
	// State for the main "Copy All Info" button
	let copyStatus = writable<CopyStatus>('idle');
	let copyError = writable<string | null>(null);
	let copyTimeoutId: ReturnType<typeof setTimeout> | null = null;
	// State for the "Copy Current State" button
	let currentStateCopyStatus = writable<CopyStatus>('idle');
	let currentStateCopyError = writable<string | null>(null);
	let currentStateCopyTimeoutId: ReturnType<typeof setTimeout> | null = null;

	// --- Event Handlers ---
	function toggleInfo() {
		showInfo = !showInfo;
		if (!showInfo) resetCopyStates(); // Reset states when closing
	}

	/** Resets the state for both copy buttons */
	function resetCopyStates() {
		if (copyTimeoutId) clearTimeout(copyTimeoutId);
		copyStatus.set('idle');
		copyError.set(null);
		copyTimeoutId = null; // Explicitly clear ID

		if (currentStateCopyTimeoutId) clearTimeout(currentStateCopyTimeoutId);
		currentStateCopyStatus.set('idle');
		currentStateCopyError.set(null);
		currentStateCopyTimeoutId = null; // Explicitly clear ID
	}

	/** Copies the full debug info */
	async function copyDebugInfo() {
		// Use the generic handler with the full text builder and main state
		await handleCopy(
			buildDebugInfoText,
			copyStatus,
			copyError,
			(tid) => (copyTimeoutId = tid) // Pass the correct setter lambda
		);
	}

	/** Copies only the current state info */
	async function copyCurrentState() {
		// Use the generic handler with the current state text builder and its state
		await handleCopy(
			buildCurrentStateText,
			currentStateCopyStatus,
			currentStateCopyError,
			(tid) => (currentStateCopyTimeoutId = tid) // Pass the correct setter lambda
		);
	}

	/** Generic clipboard copy handler */
	async function handleCopy(
		textBuilder: () => string,
		statusStore: typeof copyStatus, // Use the type directly
		errorStore: typeof copyError, // Use the type directly
		timeoutSetter: (tid: ReturnType<typeof setTimeout> | null) => void
	) {
		// Clear previous timeout for this specific button instance
		// This check might be redundant if timeoutSetter correctly clears, but safe to keep
		if (statusStore === copyStatus && copyTimeoutId) clearTimeout(copyTimeoutId);
		if (statusStore === currentStateCopyStatus && currentStateCopyTimeoutId)
			clearTimeout(currentStateCopyTimeoutId);

		// Check for Clipboard API availability
		if (!navigator.clipboard) {
			errorStore.set('Clipboard API not available.');
			statusStore.set('error');
			console.error('Clipboard API not available.');
			// Use the generic reset function
			resetCopyStatusAfterDelay(statusStore, errorStore, timeoutSetter);
			return;
		}

		// Set initial state for copying
		statusStore.set('copying');
		errorStore.set(null); // Clear previous errors for this instance

		try {
			// Build the text *just before* copying
			const textToCopy = textBuilder();
			await navigator.clipboard.writeText(textToCopy);
			statusStore.set('copied'); // Success
		} catch (err) {
			errorStore.set('Failed to copy.'); // Set specific error
			statusStore.set('error'); // Set error state
			console.error('Failed to copy text: ', err);
		} finally {
			// Always reset the status after a delay
			resetCopyStatusAfterDelay(statusStore, errorStore, timeoutSetter);
		}
	}

	/** Builds the full debug information string */
	function buildDebugInfoText(): string {
		let text = '';
		const rule = get(activeLayoutRule); // Get current value
		if (rule) {
			text += `Active Layout Rule:\n`;
			text += `Description: ${rule.description}\n`;
			text += `Columns: ${rule.columns}`;
			if (rule.maxColumns) text += ` (Max: ${rule.maxColumns})`;
			text += `\n`;
			if (rule.when) {
				text += `Conditions:\n`;
				if (rule.when.count !== undefined) text += `  - Count: ${rule.when.count}\n`;
				if (rule.when.minCount !== undefined) text += `  - Min Count: ${rule.when.minCount}\n`;
				if (rule.when.device) text += `  - Device: ${rule.when.device}\n`;
				if (rule.when.aspect) text += `  - Aspect: ${rule.when.aspect}\n`;
				if (rule.when.aspects) text += `  - Aspects: ${rule.when.aspects.join(', ')}\n`;
				if (rule.when.orientation) text += `  - Orientation: ${rule.when.orientation}\n`;
				if (rule.when.extraCheck) text += `  - Has extra check condition\n`;
			}
		} else {
			text += `Active Layout Rule: None Matched\n`;
		}
		text += `\n` + buildCurrentStateText(); // Append current state
		return text;
	}

	/** Builds only the current state information string */
	function buildCurrentStateText(): string {
		// Access reactive variables directly within the function scope when called
		return `Current State:\n  - Columns: ${$layoutContext.layoutConfig.gridColumns.match(/repeat\((\d+)\)/)?.[1] || 'unknown'}\n  - Device: ${$layoutContext.deviceType} (${$layoutContext.isMobile ? 'mobile' : 'desktop'})\n  - Aspect: ${$layoutContext.containerAspect}\n  - Orientation: ${$layoutContext.isPortrait ? 'portrait' : 'landscape'}\n  - Size: ${$layoutContext.containerWidth}x${$layoutContext.containerHeight}\n`;
	}

	/** Generic function to reset copy status after a delay */
	function resetCopyStatusAfterDelay(
		statusStore: typeof copyStatus, // Use type for generics
		errorStore: typeof copyError, // Use type for generics
		timeoutSetter: (tid: ReturnType<typeof setTimeout> | null) => void,
		delay = 2000
	) {
		// Create the timeout
		const tid = setTimeout(() => {
			statusStore.set('idle');
			errorStore.set(null);
			timeoutSetter(null); // Important: Clear the stored ID via the setter
		}, delay);
		// Store the new timeout ID via the setter
		timeoutSetter(tid);
	}

	// --- Lifecycle ---
	onDestroy(() => {
		// Clear timeouts when component is destroyed
		if (copyTimeoutId) clearTimeout(copyTimeoutId);
		if (currentStateCopyTimeoutId) clearTimeout(currentStateCopyTimeoutId);
	});
</script>

<div class="debug-button-container">
	<button
		class="debug-layout-button"
		on:click={toggleInfo}
		title="Show layout debug info"
		aria-label="Show layout debug info"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line
				x1="3"
				y1="9"
				x2="21"
				y2="9"
			></line><line x1="9" y1="21" x2="9" y2="9"></line></svg
		>
	</button>

	{#if showInfo}
		<div class="debug-info" transition:fade={{ duration: 200 }}>
			<button
				class="close-button"
				on:click={toggleInfo}
				title="Close debug info"
				aria-label="Close debug info"
			>
				&times;
			</button>
			<div class="rule-card">
				<h3>Active Layout Rule:</h3>
				{#if $activeLayoutRule}
					<div class="rule-info">
						<span class="rule-desc">{$activeLayoutRule.description}</span>
						<div class="rule-details">
							<div class="columns">Columns: <b>{$activeLayoutRule.columns}</b></div>
							{#if $activeLayoutRule.maxColumns}<div class="max-cols">
									(Max: {$activeLayoutRule.maxColumns})
								</div>{/if}
						</div>
						<div class="conditions">
							Conditions:
							<ul>
								{#if $activeLayoutRule.when.count !== undefined}<li>
										Count: {$activeLayoutRule.when.count}
									</li>{/if}
								{#if $activeLayoutRule.when.minCount !== undefined}<li>
										Min Count: {$activeLayoutRule.when.minCount}
									</li>{/if}
								{#if $activeLayoutRule.when.device}<li>
										Device: {$activeLayoutRule.when.device}
									</li>{/if}
								{#if $activeLayoutRule.when.aspect}<li>
										Aspect: {$activeLayoutRule.when.aspect}
									</li>{/if}
								{#if $activeLayoutRule.when.aspects}<li>
										Aspects: {$activeLayoutRule.when.aspects.join(', ')}
									</li>{/if}
								{#if $activeLayoutRule.when.orientation}<li>
										Orientation: {$activeLayoutRule.when.orientation}
									</li>{/if}
								{#if $activeLayoutRule.when.extraCheck}<li>Has extra check condition</li>{/if}
							</ul>
						</div>
					</div>
				{:else}
					<div class="no-rule">No layout rule currently matched.</div>
				{/if}

				<div class="current-state">
					<div class="state-header">
						<span>Current State:</span>
						<button
							class="copy-current-state-button copy-button-base"
							class:copying={$currentStateCopyStatus === 'copying'}
							class:copied={$currentStateCopyStatus === 'copied'}
							class:error={$currentStateCopyStatus === 'error'}
							on:click={copyCurrentState}
							disabled={$currentStateCopyStatus !== 'idle'}
							aria-live="polite"
							title="Copy Current State"
							aria-label="Copy Current State"
						>
							{#if $currentStateCopyStatus === 'idle'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path
										d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
									></path></svg
								>
							{:else if $currentStateCopyStatus === 'copying'}
								<span class="spinner"></span>
							{:else if $currentStateCopyStatus === 'copied'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="3"
									stroke-linecap="round"
									stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg
								>
							{:else if $currentStateCopyStatus === 'error'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"
									></line></svg
								>
							{/if}
						</button>
					</div>
					{#if $currentStateCopyError && $currentStateCopyStatus === 'error'}
						<span class="copy-error-message state-copy-error">{$currentStateCopyError}</span>
					{/if}
					<ul>
						<li>
							Columns: {$layoutContext.layoutConfig.gridColumns.match(/repeat\((\d+)\)/)?.[1] ||
								'unknown'}
						</li>
						<li>
							Device: {$layoutContext.deviceType} ({$layoutContext.isMobile ? 'mobile' : 'desktop'})
						</li>
						<li>Aspect: {$layoutContext.containerAspect}</li>
						<li>Orientation: {$layoutContext.isPortrait ? 'portrait' : 'landscape'}</li>
						<li>Size: {$layoutContext.containerWidth}×{$layoutContext.containerHeight}</li>
					</ul>
				</div>

				<div class="edit-tip">
					Edit in: <code>src/lib/components/OptionPicker/utils/layoutConfig.ts</code>
				</div>

				<div class="actions-area">
					{#if $copyError && $copyStatus === 'error'}
						<span class="copy-error-message">{$copyError}</span>
					{/if}
					<button
						class="copy-button copy-button-base"
						class:copying={$copyStatus === 'copying'}
						class:copied={$copyStatus === 'copied'}
						class:error={$copyStatus === 'error'}
						on:click={copyDebugInfo}
						disabled={$copyStatus !== 'idle'}
						aria-live="polite"
						title="Copy All Debug Info"
						aria-label="Copy All Debug Info"
					>
						{#if $copyStatus === 'idle'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path
									d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
								></path></svg
							>
							<span>Copy All Info</span>
						{:else if $copyStatus === 'copying'}
							<span>Copying...</span>
						{:else if $copyStatus === 'copied'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg
							>
							<span>Copied!</span>
						{:else if $copyStatus === 'error'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"
								></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg
							>
							<span>Error</span>
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* --- Base Container and Toggle Button --- */
	.debug-button-container {
		position: absolute;
		bottom: 10px;
		right: 10px;
		z-index: 1000;
	}
	.debug-layout-button {
		background: #1e293b;
		color: white;
		border: 1px solid #334155;
		border-radius: 50%;
		width: 36px;
		height: 36px;
		cursor: pointer;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.7;
		transition: all 0.2s ease;
	}
	.debug-layout-button:hover {
		opacity: 1;
		background: #334155;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
		transform: scale(1.05);
	}
	.debug-layout-button svg {
		width: 16px;
		height: 16px;
	} /* Ensure icon size */

	/* --- Debug Info Panel --- */
	.debug-info {
		position: absolute;
		bottom: 50px;
		right: 0;
		background: #0f172a;
		color: #e2e8f0;
		border: 1px solid #334155;
		border-radius: 8px;
		width: 320px;
		max-height: 450px;
		overflow-y: auto;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		padding: 0; /* Remove padding here */
		font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas,
			'DejaVu Sans Mono', monospace;
		font-size: 12px;
		line-height: 1.5;
	}
	.close-button {
		/* Panel close button */
		position: absolute;
		top: 8px;
		right: 8px;
		background: transparent;
		border: none;
		color: #94a3b8; /* slate-400 */
		font-size: 20px; /* Larger X */
		line-height: 1;
		padding: 2px 5px;
		cursor: pointer;
		z-index: 10;
		transition: color 0.2s ease;
		border-radius: 4px;
	}
	.close-button:hover {
		color: #f87171;
		background-color: rgba(255, 255, 255, 0.1);
	} /* rose-400 */

	.rule-card {
		padding: 16px;
		padding-top: 36px; /* Space for close button */
	}
	h3 {
		margin: 0 0 10px 0;
		font-size: 14px;
		font-weight: 600;
		color: #7dd3fc;
		border-bottom: 1px solid #334155;
		padding-bottom: 6px;
	}

	/* --- Rule Info & Conditions --- */
	.rule-info {
		margin-bottom: 14px;
	}
	.rule-desc {
		display: block;
		font-weight: 600;
		color: #94a3b8;
		margin-bottom: 8px;
		font-style: italic;
	}
	.rule-details {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
		font-weight: 500;
	}
	.columns b {
		color: #e2e8f0;
	}
	.columns {
		color: #7dd3fc;
	}
	.max-cols {
		color: #94a3b8;
		font-size: 11px;
	}
	.conditions {
		font-size: 11px;
		margin-top: 8px;
		color: #cbd5e1;
	}
	.conditions ul {
		margin: 4px 0 0 0;
		padding-left: 16px;
	}
	.conditions li {
		margin: 3px 0;
	}
	.no-rule {
		padding: 10px 0;
		color: #fb7185;
		font-style: italic;
	}

	/* --- Current State --- */
	.current-state {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 4px;
		padding: 10px;
		margin-bottom: 12px;
		font-size: 11px;
		color: #cbd5e1;
	}
	.state-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-weight: 600;
		color: #7dd3fc;
		margin-bottom: 6px;
	}
	.state-header span {
		flex-grow: 1;
	}
	.current-state ul {
		margin: 4px 0 0 0;
		padding-left: 16px;
	}
	.current-state li {
		margin: 3px 0;
	}

	/* --- Edit Tip --- */
	.edit-tip {
		font-size: 10px;
		color: #94a3b8;
		border-top: 1px solid #334155;
		padding-top: 8px;
		margin-top: 12px;
	}
	.edit-tip code {
		background: #334155;
		padding: 2px 5px;
		border-radius: 3px;
		color: #7dd3fc;
	}

	/* --- Actions Area (for main copy button) --- */
	.actions-area {
		margin-top: 12px;
		padding-top: 8px;
		border-top: 1px solid #334155;
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 8px;
	}

	/* --- Base Copy Button Styles --- */
	.copy-button-base {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		border: 1px solid #475569;
		padding: 6px 10px;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease-out;
		overflow: hidden;
		position: relative;
	}
	.copy-button-base svg {
		flex-shrink: 0;
	}
	.copy-button-base:not(:disabled):hover {
		border-color: #64748b;
		color: #e2e8f0;
		transform: translateY(-1px);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}
	.copy-button-base:disabled {
		cursor: default;
		opacity: 0.7;
	}

	/* --- Specific Copy Button Styles --- */
	.copy-button {
		/* Main copy button */
		background-color: #334155;
		color: #cbd5e1;
		font-size: 11px;
	}
	.copy-button svg {
		width: 14px;
		height: 14px;
	}
	.copy-button:not(:disabled):hover {
		background-color: #475569;
	}

	.copy-current-state-button {
		/* Smaller, icon-only style button */
		background-color: transparent;
		color: #94a3b8;
		border: none;
		padding: 4px;
		border-radius: 4px;
		line-height: 1;
	}
	.copy-current-state-button svg {
		width: 12px;
		height: 12px;
	}
	.copy-current-state-button:not(:disabled):hover {
		background-color: #334155;
		color: #e2e8f0;
		transform: none;
		box-shadow: none;
	}

	/* --- Copy Button States (shared by base class) --- */
	.copy-button-base.copying {
		background-color: #475569;
	}
	.copy-button-base.copied {
		background-color: #16a34a;
		border-color: #16a34a;
		color: white;
		animation: pulse-success 0.5s ease-out;
	}
	.copy-button-base.error {
		background-color: #dc2626;
		border-color: #dc2626;
		color: white;
		animation: shake-error 0.5s ease-out;
	}

	/* --- Copy Error Message --- */
	.copy-error-message {
		color: #fb7185;
		font-size: 10px;
		flex-grow: 1;
		text-align: right;
		margin-right: 5px;
	}
	.state-copy-error {
		font-size: 9px;
		text-align: left;
		width: 100%;
		margin-bottom: 4px;
	}

	/* --- Animations --- */
	@keyframes pulse-success {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
		100% {
			transform: scale(1);
		}
	}
	@keyframes shake-error {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-3px);
		}
		50% {
			transform: translateX(3px);
		}
		75% {
			transform: translateX(-3px);
		}
	}
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
	.spinner {
		display: inline-block;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-left-color: currentColor;
		border-radius: 50%;
		width: 12px;
		height: 12px;
		animation: spin 1s linear infinite;
	}

	/* --- Scrollbar --- */
	.debug-info::-webkit-scrollbar {
		width: 6px;
	}
	.debug-info::-webkit-scrollbar-track {
		background: #1e293b;
		border-radius: 3px;
	}
	.debug-info::-webkit-scrollbar-thumb {
		background-color: #475569;
		border-radius: 3px;
	}
	.debug-info::-webkit-scrollbar-thumb:hover {
		background-color: #64748b;
	}
</style>
