<script lang="ts">
  import { onMount } from 'svelte';
  import SequenceWidgetButton from './SequenceWidgetButton.svelte';

  let buttonSize = 60;
  export let isGraphEditorExpanded: boolean;
  export let animationDuration: number = 300; // Default animation duration

  let paddingTop = 15; // Initial padding in vh
  let paddingBottom = 15; // Initial padding in vh

  const iconRoot = '/button_panel_icons/';
  const buttons = [
    { icon: `${iconRoot}add_to_dictionary.png`, title: 'Add to Dictionary', id: 'addToDictionary' },
    { icon: `${iconRoot}save_image.png`, title: 'Save Image', id: 'saveImage' },
    { icon: `${iconRoot}eye.png`, title: 'View Full Screen', id: 'viewFullScreen' },
    { icon: `${iconRoot}mirror.png`, title: 'Mirror Sequence', id: 'mirrorSequence' },
    { icon: `${iconRoot}yinyang1.png`, title: 'Swap Colors', id: 'swapColors' },
    { icon: `${iconRoot}rotate.png`, title: 'Rotate Sequence', id: 'rotateSequence' },
    { icon: `${iconRoot}delete.png`, title: 'Delete Beat', id: 'deleteBeat' },
    { icon: `${iconRoot}clear.png`, title: 'Clear Sequence', id: 'clearSequence' }
  ];

  const updateButtonSize = () => {
    const containerWidth = window.innerWidth;
    buttonSize = Math.max(40, Math.min(80, containerWidth / 40));
  };

  $: {
    // Dynamically update padding values
    const targetPadding = isGraphEditorExpanded ? 5 : 15;
    paddingTop = targetPadding;
    paddingBottom = targetPadding;
  }

  onMount(() => {
    updateButtonSize();
    window.addEventListener('resize', updateButtonSize);
    return () => window.removeEventListener('resize', updateButtonSize);
  });
</script>

<div
  class="button-panel"
  style="padding: {paddingTop}vh 0 {paddingBottom}vh 0; transition: padding {animationDuration}ms ease;"
>
  {#each buttons as button}
    <SequenceWidgetButton
      icon={button.icon}
      title={button.title}
      {buttonSize}
      onClick={() => console.log(`${button.title} clicked`)}
    />
  {/each}
</div>

<style>
  .button-panel {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 1vh; /* Adjusted gap between buttons */
    z-index: auto;
    position: relative; /* Ensure it’s not affecting stacking context */
  }
</style>
