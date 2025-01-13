<script lang="ts">
    const socialLinks = [
      { src: '/social_icons/paypal.png', alt: 'PayPal', url: 'https://www.paypal.me/austencloud' },
      { src: '/social_icons/venmo.png', alt: 'Venmo', url: 'https://venmo.com/austencloud' },
      { src: '/social_icons/github.png', alt: 'GitHub', url: 'https://github.com/austencloud/the-kinetic-constructor-web' },
      { src: '/social_icons/facebook.png', alt: 'Facebook', url: 'https://www.facebook.com/thekineticalphabet' },
      { src: '/social_icons/instagram.png', alt: 'Instagram', url: 'https://www.instagram.com/thekineticalphabet' },
      { src: '/social_icons/youtube.png', alt: 'YouTube', url: 'https://www.youtube.com/channel/UCbLHNRSASZS_gwkmRATH1-A' },
    ];
  
    const openLink = (url: string) => window.open(url, '_blank');
  </script>
  
  <style>
    .social-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 5px;
    }
  
    .button {
      width: 40px;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: white;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: background-color 0.3s;
    }
  
    .button:hover {
      background-color: #e6e6e6;
    }
  
    .icon {
      width: 24px;
      height: 24px;
    }
  </style>
  
  <div class="social-container">
    {#each socialLinks as link}
      <button class="button" on:click={() => openLink(link.url)} on:keydown={(e) => e.key === 'Enter' && openLink(link.url)} aria-label={link.alt}>
        <img class="icon" src={link.src} alt={link.alt} />
      </button>
    {/each}
  </div>
  