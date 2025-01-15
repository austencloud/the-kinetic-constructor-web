<script lang="ts">
  export let maxHeight: number;
</script>

<div class="container" style="width: {maxHeight}px; height: {maxHeight}px;">
  <p>Pictograph</p>
</div>

<style>
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.2rem;
    font-weight: bold;
    border: 4px solid gold;
    background-color: #fff;
  }
</style>
