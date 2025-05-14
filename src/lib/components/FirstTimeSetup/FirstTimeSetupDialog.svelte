<script lang="ts">
  import { browser } from '$app/environment';
  import { fade, scale } from 'svelte/transition';
  import { userContainer } from '$lib/state/stores/user/UserContainer';
  import { useContainer } from '$lib/state/core/svelte5-integration.svelte';
  import hapticFeedbackService from '$lib/services/HapticFeedbackService';
  
  // Use the user container with Svelte 5 runes
  const user = useContainer(userContainer);
  
  // Local state
  let username = $state(user.currentUser || 'User');
  let isVisible = $state(userContainer.isFirstVisit());
  
  // Handle continue button click
  function handleContinue() {
    // Provide haptic feedback
    if (browser && hapticFeedbackService.isAvailable()) {
      hapticFeedbackService.trigger('success');
    }
    
    // Complete setup with the entered username
    userContainer.completeSetup(username);
    
    // Hide the dialog
    isVisible = false;
  }
  
  // Handle skip button click
  function handleSkip() {
    // Provide haptic feedback
    if (browser && hapticFeedbackService.isAvailable()) {
      hapticFeedbackService.trigger('selection');
    }
    
    // Complete setup with the default username
    userContainer.completeSetup('User');
    
    // Hide the dialog
    isVisible = false;
  }
  
  // Handle input change
  function handleInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    username = input.value;
  }
  
  // Handle keydown event for Enter key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleContinue();
    }
  }
</script>

{#if isVisible}
<div class="overlay" transition:fade={{ duration: 300 }}>
  <div class="dialog" transition:scale={{ duration: 300, start: 0.95 }}>
    <div class="dialog-header">
      <h2>Welcome to The Kinetic Constructor</h2>
    </div>
    
    <div class="dialog-content">
      <p>Please enter your name to personalize your experience. This will be used when exporting sequences.</p>
      
      <div class="input-group">
        <label for="username-input">Your Name</label>
        <input 
          type="text" 
          id="username-input" 
          value={username} 
          oninput={handleInputChange}
          onkeydown={handleKeydown}
          placeholder="Enter your name"
          maxlength="50"
          autocomplete="name"
        />
      </div>
    </div>
    
    <div class="dialog-footer">
      <button class="skip-button" onclick={handleSkip}>
        Skip
      </button>
      <button class="continue-button" onclick={handleContinue}>
        Continue
      </button>
    </div>
  </div>
</div>
{/if}

<style>
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }
  
  .dialog {
    background: linear-gradient(to bottom, #2a2a35, #1f1f25);
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 500px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(108, 156, 233, 0.3);
  }
  
  .dialog-header {
    padding: 1.5rem;
    background: linear-gradient(to right, #167bf4, #329bff);
    color: white;
  }
  
  .dialog-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .dialog-content {
    padding: 1.5rem;
    color: var(--color-text-primary, white);
  }
  
  .dialog-content p {
    margin: 0 0 1.5rem 0;
    line-height: 1.5;
    font-size: 1rem;
  }
  
  .input-group {
    margin-bottom: 1rem;
  }
  
  .input-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--color-text-primary, white);
  }
  
  .input-group input {
    width: 100%;
    padding: 0.75rem;
    border-radius: 6px;
    background: linear-gradient(to bottom, #1f1f24, #2a2a30);
    border: 1px solid rgba(108, 156, 233, 0.3);
    color: var(--color-text-primary, white);
    font-size: 1rem;
    transition: all 0.2s ease;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .input-group input:focus {
    border-color: #167bf4;
    box-shadow: 0 0 0 2px rgba(22, 123, 244, 0.3);
    outline: none;
  }
  
  .dialog-footer {
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .skip-button {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    background-color: transparent;
    color: var(--color-text-primary, white);
    border: 1px solid rgba(255, 255, 255, 0.2);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .skip-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .continue-button {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    background: linear-gradient(to bottom, #167bf4, #1068d9);
    color: white;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  
  .continue-button:hover {
    background: linear-gradient(to bottom, #1d86ff, #1271ea);
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(22, 123, 244, 0.3);
  }
  
  .continue-button:active {
    transform: translateY(0);
    background: linear-gradient(to bottom, #0f65d1, #0a54b3);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
</style>
