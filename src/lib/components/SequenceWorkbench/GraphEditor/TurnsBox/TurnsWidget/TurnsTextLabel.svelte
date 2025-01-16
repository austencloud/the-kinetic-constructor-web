<script>
  export let width = 100; // Default width value
  const rootFontSize = 20; // Default root font size in most browsers
  $: fontSize = Math.min(25, Math.max(width * 0.1, rootFontSize)); // Calculate font size based on width with a minimum of 1.5rem
</script>

<div class="turns-text-label" style="font-size: {fontSize}px;">Turns</div>

<style>
  .turns-text-label {
    font-weight: bold;
    text-decoration: underline;
    text-align: center;
  }
</style>
