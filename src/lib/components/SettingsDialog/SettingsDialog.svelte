<script lang="ts">
	export let isOpen: boolean;
	export let onClose: () => void;
	export let background: string;
	export let onChangeBackground: (newBackground: string) => void;
  
	import TabsNavigation from './TabsNavigation.svelte';
	import TabContent from './TabContent.svelte';
	import DialogActions from './DialogActions.svelte';
  
	let activeTab = 'User';
  </script>
  
  {#if isOpen}
<div
	class="dialog-backdrop"
	role="button"
	aria-label="Close settings dialog by clicking outside"
	on:click|self={onClose}
	tabindex="0"
	on:keydown|self={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
  >
	<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
	  <h2 id="dialog-title" class="dialog-title">Settings</h2>
	  <TabsNavigation {activeTab} on:changeTab={(e) => (activeTab = e.detail)} />
	  <TabContent {activeTab} {background} {onChangeBackground} />
	  <DialogActions {onClose} />
	</div>
  </div>
  {/if}
  
  <style>
	.dialog-backdrop {
	  position: fixed;
	  inset: 0;
	  background: rgba(0, 0, 0, 0.5);
	  display: flex;
	  align-items: center;
	  justify-content: center;
	}
  
	.dialog {
	  display: flex;
	  flex-direction: column;
	  background: white;
	  width: 60%;
	  height: 70%;
	  max-width: 800px;
	  max-height: 600px;
	  padding: 10px;
	  border-radius: 8px;
	  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
	}
  
	.dialog-title {
	  margin: 0;
	  font-size: 1.5rem;
	  text-align: center;
	  padding: 10px 0;
	  border-bottom: 1px solid #ccc;
	}
  </style>
  