<script>
    import SocialMediaWidget from './SocialMediaWidget.svelte';
    import NavigationWidget from './NavigationWidget.svelte';
    import SettingsButton from './SettingsButton.svelte';
  </script>
  
  <style>
    .menuBar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      color: white;
      padding: 10px 20px;
    }
  </style>
  
  <header class="menuBar">
    <SocialMediaWidget />
    <NavigationWidget />
    <SettingsButton />
  </header>
  