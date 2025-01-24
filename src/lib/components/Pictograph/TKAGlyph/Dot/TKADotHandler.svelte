<script lang="ts">
	import type { DirRelation, PropRotDir } from '../../types/Types';
	import TKADot from './TKADot.svelte';

	/**
	 * direction can be 's' for SAME, 'o' for OPP, etc.
	 * If direction === 's' => show "same" dot
	 * If direction === 'o' => show "opp" dot
	 * else hide both
	 */
	export let firstTupleItem: DirRelation;
</script>

<g class="dot-handler">
	<TKADot dirRelation="s" visible={firstTupleItem === 's'} x={0} y={-20} />
	<TKADot dirRelation="o" visible={firstTupleItem === 'o'} x={0} y={40} />
</g>
