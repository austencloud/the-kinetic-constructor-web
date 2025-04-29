<script lang="ts">
  import { onMount } from 'svelte';
  import TitleLabel from './TitleLabel.svelte';
  import { actStore } from '../../stores/actStore';
  
  // Get current date in the format "Month Day, Year"
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Mock author name - in a real implementation, this would come from user settings
  const author = "John Doe";
</script>

<div class="act-header">
  <TitleLabel />
  
  <div class="metadata">
    <div class="date">{currentDate}</div>
    <div class="author">Choreography by {author}</div>
  </div>
</div>

<style>
  .act-header {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background-color: #252525;
    border-bottom: 1px solid #333;
  }
  
  .metadata {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #999;
  }
  
  @media (max-width: 640px) {
    .metadata {
      flex-direction: column;
      gap: 0.25rem;
    }
  }
</style>
