<script lang="ts">
  import StateExample from '$lib/components/examples/StateExample.svelte';
</script>

<div class="container">
  <h1>State Management Example</h1>
  <p>
    This page demonstrates the new state management system using XState and Svelte stores.
    Open your browser's developer console to see state changes.
  </p>
  
  <StateExample />
  
  <div class="info">
    <h2>How It Works</h2>
    <p>
      The state management system uses:
    </p>
    <ul>
      <li><strong>XState</strong> for complex state machines</li>
      <li><strong>Svelte stores</strong> for reactive state</li>
      <li><strong>State registry</strong> for centralized state management</li>
    </ul>
    <p>
      Try interacting with the example above to see how state changes are handled.
    </p>
  </div>
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  h1 {
    color: #333;
  }
  
  .info {
    margin-top: 40px;
    padding: 20px;
    background: #f9f9f9;
    border-left: 4px solid #007bff;
  }
  
  ul {
    margin-left: 20px;
  }
  
  li {
    margin-bottom: 10px;
  }
</style>
