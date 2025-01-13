<script>
  export let turns = 0;
  export let color = "blue";
</script>

<style>
  .turns-label {
    font-size: 1.2rem;
    color: var(--color);
    font-weight: bold;
  }
</style>

<div class="turns-label" style="--color: {color}">
  {turns}
</div>
