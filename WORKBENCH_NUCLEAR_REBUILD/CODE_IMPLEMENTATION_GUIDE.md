# Code Implementation Guide - Svelte 5 Patterns

## 1. Service Layer Implementation

### Core Service Interface

```typescript
// services/core/ISequenceService.ts
export interface ISequenceService {
	readonly state: SequenceState;
	readonly selectedBeats: BeatData[];
	readonly isEmpty: boolean;
	addBeat(beat: BeatData): void;
	removeBeat(beatId: string): void;
	selectBeat(beatId: string, multiSelect?: boolean): void;
	clearSelection(): void;
}
```

### Service Implementation

```typescript
// services/SequenceService.svelte.ts
export class SequenceService implements ISequenceService {
	private _state = $state<SequenceState>({
		beats: [],
		selectedBeatIds: [],
		currentBeatIndex: 0,
		metadata: defaultMetadata,
		isModified: false
	});

	get state() {
		return this._state;
	}

	readonly selectedBeats = $derived(
		this._state.beats.filter((beat) => this._state.selectedBeatIds.includes(beat.id))
	);

	readonly isEmpty = $derived(this._state.beats.length === 0);

	addBeat(beat: BeatData): void {
		this._state.beats = [...this._state.beats, beat];
		this._state.isModified = true;
		this._state.metadata.updatedAt = new Date();
	}

	removeBeat(beatId: string): void {
		this._state.beats = this._state.beats.filter((b) => b.id !== beatId);
		this._state.selectedBeatIds = this._state.selectedBeatIds.filter((id) => id !== beatId);
		this._state.isModified = true;
	}

	selectBeat(beatId: string, multiSelect = false): void {
		if (multiSelect) {
			if (this._state.selectedBeatIds.includes(beatId)) {
				this._state.selectedBeatIds = this._state.selectedBeatIds.filter((id) => id !== beatId);
			} else {
				this._state.selectedBeatIds = [...this._state.selectedBeatIds, beatId];
			}
		} else {
			this._state.selectedBeatIds = [beatId];
		}
	}

	clearSelection(): void {
		this._state.selectedBeatIds = [];
	}
}
```

## 2. Dependency Injection Pattern

### Service Provider

```typescript
// providers/ServiceProvider.svelte
<script lang="ts">
  import { setContext } from 'svelte';
  import { SequenceService } from '../services/SequenceService.svelte';
  import { WorkbenchService } from '../services/WorkbenchService.svelte';
  import { PictographService } from '../services/PictographService.svelte';

  const sequenceService = new SequenceService();
  const workbenchService = new WorkbenchService();
  const pictographService = new PictographService();

  setContext('sequenceService', sequenceService);
  setContext('workbenchService', workbenchService);
  setContext('pictographService', pictographService);

  // Cross-service effects
  $effect(() => {
    const selectedBeat = sequenceService.selectedBeats[0];
    if (selectedBeat) {
      pictographService.updateData(selectedBeat.pictographData);
    }
  });

  // Auto-save effect
  $effect(() => {
    if (sequenceService.state.isModified) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('sequence', JSON.stringify(sequenceService.state));
        console.log('Auto-saved sequence');
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  });
</script>

<slot />
```

### Component Service Usage

```typescript
// components/BeatFrame/StartPosBeat.svelte
<script lang="ts">
  import { getContext } from 'svelte';
  import type { ISequenceService } from '../../services';

  const sequenceService = getContext<ISequenceService>('sequenceService');

  const props = $props<{
    beatData: BeatData;
    onClick: () => void;
  }>();

  // FIXED: Pure derivation, no manual subscriptions
  const isSelected = $derived(
    sequenceService.state.selectedBeatIds.includes('start-position')
  );

  function handleClick() {
    sequenceService.selectBeat('start-position');
    props.onClick();
  }
</script>

<button
  class="start-pos-beat"
  class:selected={isSelected}
  onclick={handleClick}
>
  <Beat beat={props.beatData} />
</button>
```

## 3. Performance Optimization Patterns

### Debounced State Updates

```typescript
// utils/debounce.svelte.ts
export function createDebouncedState<T>(initialValue: T, delay: number = 300) {
	let value = $state(initialValue);
	let debouncedValue = $state(initialValue);
	let timeoutId: ReturnType<typeof setTimeout>;

	$effect(() => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			debouncedValue = value;
		}, delay);

		return () => clearTimeout(timeoutId);
	});

	return {
		get value() {
			return value;
		},
		set value(newValue: T) {
			value = newValue;
		},
		get debouncedValue() {
			return debouncedValue;
		}
	};
}
```

### Virtual Scrolling Implementation

```typescript
// components/VirtualBeatGrid.svelte
<script lang="ts">
  import { createVirtualizer } from '@tanstack/svelte-virtual';

  const props = $props<{
    beats: BeatData[];
    onBeatClick: (beatId: string) => void;
  }>();

  let containerRef: HTMLElement;

  const virtualizer = $derived(
    createVirtualizer({
      count: props.beats.length,
      getScrollElement: () => containerRef,
      estimateSize: () => 120,
      overscan: 5
    })
  );

  const virtualItems = $derived(virtualizer.getVirtualItems());
</script>

<div bind:this={containerRef} class="virtual-container">
  <div style="height: {virtualizer.getTotalSize()}px; position: relative;">
    {#each virtualItems as virtualItem (virtualItem.key)}
      <div
        style="position: absolute; top: 0; left: 0;
               transform: translateY({virtualItem.start}px);
               height: {virtualItem.size}px;"
      >
        <BeatCell
          beat={props.beats[virtualItem.index]}
          onClick={props.onBeatClick}
        />
      </div>
    {/each}
  </div>
</div>
```

## 4. Component Architecture Patterns

### Pure Presentation Component

```typescript
// components/BeatGrid.svelte
<script lang="ts">
  const props = $props<{
    beats: BeatData[];
    selectedBeatIds: string[];
    onBeatClick: (beatId: string) => void;
    onBeatDoubleClick: (beatId: string) => void;
  }>();

  const gridColumns = $derived(Math.ceil(Math.sqrt(props.beats.length)));
  const gridRows = $derived(Math.ceil(props.beats.length / gridColumns));
</script>

<div
  class="beat-grid"
  style="--columns: {gridColumns}; --rows: {gridRows};"
  role="grid"
  aria-label="Beat sequence editor"
>
  {#each props.beats as beat (beat.id)}
    <BeatCell
      {beat}
      isSelected={props.selectedBeatIds.includes(beat.id)}
      onClick={() => props.onBeatClick(beat.id)}
      onDoubleClick={() => props.onBeatDoubleClick(beat.id)}
    />
  {/each}
</div>

<style>
  .beat-grid {
    display: grid;
    grid-template-columns: repeat(var(--columns), 1fr);
    grid-template-rows: repeat(var(--rows), 1fr);
    gap: 8px;
    contain: layout style paint;
  }
</style>
```

### Smart Container Component

```typescript
// containers/SequenceWorkbenchContainer.svelte
<script lang="ts">
  import { getContext } from 'svelte';
  import type { ISequenceService, IWorkbenchService } from '../services';

  const sequenceService = getContext<ISequenceService>('sequenceService');
  const workbenchService = getContext<IWorkbenchService>('workbenchService');

  function handleBeatClick(beatId: string) {
    sequenceService.selectBeat(beatId);
    workbenchService.setActivePanel('editor');
  }

  function handleBeatDoubleClick(beatId: string) {
    sequenceService.selectBeat(beatId);
    workbenchService.setActivePanel('editor');
    setTimeout(() => {
      document.querySelector('[data-focus-target]')?.focus();
    }, 100);
  }

  function handleAddBeat() {
    const newBeat = createEmptyBeat();
    sequenceService.addBeat(newBeat);
  }
</script>

<SequenceWorkbench
  beats={sequenceService.state.beats}
  selectedBeatIds={sequenceService.state.selectedBeatIds}
  layout={workbenchService.layout}
  {onBeatClick}
  {onBeatDoubleClick}
  {onAddBeat}
/>
```

## 5. Accessibility Implementation

### Keyboard Navigation

```typescript
// composables/useKeyboardNavigation.svelte.ts
export function useKeyboardNavigation(items: () => string[], onSelect: (id: string) => void) {
	let focusedIndex = $state(0);

	const focusedId = $derived(items()[focusedIndex] || null);

	function handleKeydown(e: KeyboardEvent) {
		switch (e.key) {
			case 'ArrowRight':
				e.preventDefault();
				focusedIndex = Math.min(focusedIndex + 1, items().length - 1);
				break;
			case 'ArrowLeft':
				e.preventDefault();
				focusedIndex = Math.max(focusedIndex - 1, 0);
				break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				if (focusedId) onSelect(focusedId);
				break;
		}
	}

	$effect(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});

	return { focusedId };
}
```

### Accessible Component

```typescript
// components/AccessibleBeatGrid.svelte
<script lang="ts">
  import { useKeyboardNavigation } from '../composables/useKeyboardNavigation.svelte';

  const props = $props<{
    beats: BeatData[];
    selectedBeatIds: string[];
    onBeatSelect: (beatId: string) => void;
  }>();

  const beatIds = $derived(props.beats.map(beat => beat.id));
  const { focusedId } = useKeyboardNavigation(
    () => beatIds,
    props.onBeatSelect
  );

  const gridDescription = $derived(
    `Beat sequence with ${props.beats.length} beats, ${props.selectedBeatIds.length} selected`
  );
</script>

<div
  role="grid"
  aria-label="Beat sequence editor"
  aria-description={gridDescription}
  tabindex="0"
>
  {#each props.beats as beat, index (beat.id)}
    <div
      role="gridcell"
      aria-label="Beat {index + 1}"
      aria-selected={props.selectedBeatIds.includes(beat.id)}
      tabindex={focusedId === beat.id ? 0 : -1}
      class:focused={focusedId === beat.id}
    >
      <BeatCell {beat} />
    </div>
  {/each}
</div>
```

## 6. Testing Patterns

### Component Testing

```typescript
// tests/components/BeatGrid.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import { vi } from 'vitest';
import BeatGrid from '../BeatGrid.svelte';

describe('BeatGrid', () => {
	const mockBeats = [createMockBeat('1'), createMockBeat('2')];

	it('renders beats correctly', () => {
		const { getByRole } = render(BeatGrid, {
			beats: mockBeats,
			selectedBeatIds: [],
			onBeatClick: vi.fn(),
			onBeatDoubleClick: vi.fn()
		});

		expect(getByRole('grid')).toBeInTheDocument();
	});
});
```

### Service Testing

```typescript
// tests/services/SequenceService.test.ts
import { SequenceService } from '../SequenceService.svelte';

describe('SequenceService', () => {
	let service: SequenceService;

	beforeEach(() => {
		service = new SequenceService();
	});

	it('adds beats correctly', () => {
		const beat = createMockBeat('1');
		service.addBeat(beat);

		expect(service.state.beats).toHaveLength(1);
		expect(service.state.isModified).toBe(true);
	});
});
```

## 7. Best Practices Summary

### Do's ✅

- Use $derived for computed values
- Use $effect only for side effects
- Implement proper cleanup in effects
- Use dependency injection for services
- Create pure presentation components

### Don'ts ❌

- Manual subscriptions in $effect
- Direct state mutations in components
- Nested reactive loops
- Memory leaks from uncleaned effects
- Tight coupling between components
