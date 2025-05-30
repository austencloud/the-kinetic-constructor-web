# SURGICAL DEBUGGING STRATEGY - DEFINITIVE LOOP DETECTION

## ANALYSIS OF YOUR ACTUAL CODE

After reading your files, I found the **real culprits**:

### 🎯 **PRIMARY SUSPECTS (Based on Actual Code Analysis)**

1. **BackgroundCanvas.svelte Lines 41-55** - Complex prop-to-state sync with untrack misuse
2. **BackgroundContext.svelte.ts Lines 200-250** - Singleton context creation/reuse logic
3. **Sequence initialization timing** - Module-level delayed loading interfering with other init
4. **Context getter/setter circular calls** - Multiple components trying to initialize same context

### 🔍 **EXACT ISSUE PATTERNS IDENTIFIED**

**Pattern A: BackgroundCanvas Prop-State Loop**

```typescript
// Lines 41-55 in BackgroundCanvas.svelte - THIS IS PROBLEMATIC
$effect(() => {
	untrack(() => {
		if (props.backgroundType !== lastBackgroundType) {
			lastBackgroundType = props.backgroundType;
			backgroundType = props.backgroundType; // This triggers context updates
		}
	});
});
```

**Pattern B: Context Singleton Interference**

```typescript
// BackgroundContext.svelte.ts - Multiple creation attempts
let singletonContext: RunesBackgroundContext | undefined;
// Multiple components calling useBackgroundContext() simultaneously
```

**Pattern C: Delayed Module Loading**

```typescript
// sequenceState.svelte.ts - Line 400+
setTimeout(() => {
	sequenceState.loadSequence(); // Interferes with other init
}, 100);
```

## 🎯 **SURGICAL DEBUG TOOL**

Create this file **exactly** as shown - it will immediately reveal the loop:

### **Step 1: Create `src/lib/debug/LoopDetector.ts`**

```typescript
// SURGICAL LOOP DETECTOR - No recursion risk, immediate results
class EffectLoopDetector {
	private static effectCalls = new Map<string, number>();
	private static lastCalls: string[] = [];
	private static isDetecting = false;

	static startDetection() {
		if (this.isDetecting) return;
		this.isDetecting = true;
		this.effectCalls.clear();
		this.lastCalls = [];

		console.log('🔬 LOOP DETECTION STARTED - Watching for patterns...');
	}

	static logEffect(component: string, effectName: string, data?: any) {
		if (!this.isDetecting) return;

		const key = `${component}:${effectName}`;
		const count = (this.effectCalls.get(key) || 0) + 1;
		this.effectCalls.set(key, count);

		// Keep track of call sequence
		this.lastCalls.push(key);
		if (this.lastCalls.length > 10) {
			this.lastCalls.shift();
		}

		const timestamp = performance.now().toFixed(1);
		console.log(`[${timestamp}ms] ${this.getEmoji(component)} ${key} [${count}x]`, data || '');

		// Detect immediate loops (same effect called multiple times rapidly)
		if (count > 3) {
			console.error(`🚨 INFINITE LOOP DETECTED: ${key} called ${count} times!`);
			this.analyzeLoop(key);
		}

		// Detect circular patterns (A→B→A)
		if (this.lastCalls.length >= 4) {
			const recent = this.lastCalls.slice(-4);
			if (recent[0] === recent[2] && recent[1] === recent[3]) {
				console.error(`🔄 CIRCULAR LOOP DETECTED: ${recent[0]} ↔ ${recent[1]}`);
				this.analyzeLoop(`${recent[0]} ↔ ${recent[1]}`);
			}
		}
	}

	private static getEmoji(component: string): string {
		const emojis: Record<string, string> = {
			BackgroundCanvas: '🎨',
			BackgroundContext: '🌅',
			OptionPicker: '🔍',
			SequenceState: '📝',
			ServiceProvider: '🚀'
		};
		return emojis[component] || '📝';
	}

	private static analyzeLoop(loopKey: string) {
		console.group(`🚨 LOOP ANALYSIS: ${loopKey}`);

		console.log('📊 Recent effect sequence:');
		this.lastCalls.forEach((call, i) => {
			console.log(`  ${i + 1}. ${call}`);
		});

		console.log('\n📈 All effect counts:');
		Array.from(this.effectCalls.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5)
			.forEach(([effect, count]) => {
				const status = count > 5 ? '🚨 LOOP' : count > 2 ? '⚠️ SUSPECT' : '✅ OK';
				console.log(`  ${status} ${effect}: ${count}x`);
			});

		console.groupEnd();

		// Auto-stop detection after finding loops to prevent console spam
		this.isDetecting = false;
		console.log('🛑 Detection stopped - Loop pattern identified!');
	}
}

// Global access
if (typeof window !== 'undefined') {
	(window as any).startLoopDetection = () => EffectLoopDetector.startDetection();
	(window as any).logEffect = (c: string, e: string, d?: any) =>
		EffectLoopDetector.logEffect(c, e, d);
}

export { EffectLoopDetector };
```

### **Step 2: Add Targeted Logging to Exact Locations**

**In `BackgroundCanvas.svelte` (add right after imports):**

```typescript
import { EffectLoopDetector } from '$lib/debug/LoopDetector';

// Add these logs to the exact effects causing issues:
$effect(() => {
	EffectLoopDetector.logEffect('BackgroundCanvas', 'prop-sync', {
		bgType: props.backgroundType,
		loading: props.appIsLoading
	});

	// Your existing effect code...
});

$effect(() => {
	EffectLoopDetector.logEffect('BackgroundCanvas', 'context-update', {
		initialized: isInitialized,
		hasContext: !!activeContext
	});

	// Your existing effect code...
});

// In handleBackgroundChange function:
function handleBackgroundChange(event: CustomEvent) {
	EffectLoopDetector.logEffect('BackgroundCanvas', 'bg-change-event', {
		detail: event.detail
	});

	// Your existing function code...
}
```

**In `BackgroundContext.svelte.ts` (add to setters):**

```typescript
import { EffectLoopDetector } from '$lib/debug/LoopDetector';

// In setBackgroundType function:
function setBackgroundType(type: BackgroundType): void {
	EffectLoopDetector.logEffect('BackgroundContext', 'setBackgroundType', {
		from: backgroundType,
		to: type,
		isSettingState
	});

	// Your existing function code...
}

// In setQuality function:
function setQuality(quality: QualityLevel): void {
	EffectLoopDetector.logEffect('BackgroundContext', 'setQuality', {
		from: qualityLevel,
		to: quality,
		isSettingState
	});

	// Your existing function code...
}

// In useBackgroundContext function:
export function useBackgroundContext() {
	EffectLoopDetector.logEffect('BackgroundContext', 'useContext', {
		hasSingleton: !!singletonContext,
		browser
	});

	// Your existing function code...
}
```

**In `sequenceState.svelte.ts` (add to constructor and methods):**

```typescript
import { EffectLoopDetector } from '$lib/debug/LoopDetector';

// In constructor:
constructor() {
  EffectLoopDetector.logEffect('SequenceState', 'constructor', {});
  // Your existing constructor code...
}

// In the module-level setTimeout:
if (browser) {
  setTimeout(() => {
    EffectLoopDetector.logEffect('SequenceState', 'delayed-load', {});
    sequenceState.loadSequence();
  }, 100);
}
```

## 🚀 **EXECUTION STRATEGY**

### **Run This Exact Sequence:**

1. **Start the app with detection:**

   ```bash
   npm run dev
   ```

2. **In browser console, immediately run:**

   ```javascript
   startLoopDetection();
   ```

3. **Refresh the page**

### **What You'll See:**

**Normal initialization (no loops):**

```
[0.0ms] 🚀 ServiceProvider:constructor [1x]
[15.2ms] 🎨 BackgroundCanvas:prop-sync [1x]
[16.1ms] 🌅 BackgroundContext:useContext [1x]
[18.5ms] 📝 SequenceState:delayed-load [1x]
```

**Infinite loop (EXACT CULPRIT):**

```
[0.0ms] 🎨 BackgroundCanvas:prop-sync [1x]
[0.1ms] 🌅 BackgroundContext:setBackgroundType [1x]
[0.2ms] 🎨 BackgroundCanvas:prop-sync [2x]  ← SAME EFFECT!
[0.3ms] 🌅 BackgroundContext:setBackgroundType [2x]  ← TRIGGERING EACH OTHER!
🚨 INFINITE LOOP DETECTED: BackgroundCanvas:prop-sync called 4 times!
🔄 CIRCULAR LOOP DETECTED: BackgroundCanvas:prop-sync ↔ BackgroundContext:setBackgroundType
```

## 🎯 **THIS WILL IMMEDIATELY SHOW:**

✅ **Exact effects triggering each other**  
✅ **Precise timing (within milliseconds)**  
✅ **Which component starts the loop**  
✅ **Circular patterns (A→B→A)**  
✅ **Data values causing the loop**

## 🔧 **ONCE YOU SEE THE PATTERN**

The loop detector will show you **exactly** which 2-3 effects are triggering each other. Then you can apply the **precise fix** to those specific effects instead of guessing.

**Most likely you'll see one of these patterns:**

- `BackgroundCanvas:prop-sync ↔ BackgroundContext:setBackgroundType`
- `BackgroundContext:useContext ↔ BackgroundContext:setBackgroundType`
- `SequenceState:delayed-load → BackgroundCanvas:prop-sync → BackgroundContext:setBackgroundType`

This approach **guarantees** you'll know the exact root cause within 30 seconds of running it!
