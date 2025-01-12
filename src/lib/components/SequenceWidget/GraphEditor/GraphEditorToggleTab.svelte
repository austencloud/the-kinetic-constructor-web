<script lang="ts">
  export let maxHeight: number;
</script>

<style>
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.2rem;
    font-weight: bold;
    border: 1px solid #ddd;
    background-color: #fff;
  }
</style>

<div
  class="container"
  style="width: {maxHeight}px; height: {maxHeight}px;"
>
  <p>Pictograph Placeholder</p>
</div>
