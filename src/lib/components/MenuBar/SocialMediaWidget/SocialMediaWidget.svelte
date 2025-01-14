<script lang="ts">
  const socialLinks = [
    { src: '/social_icons/paypal.png', alt: 'PayPal', url: 'https://www.paypal.me/austencloud' },
    { src: '/social_icons/venmo.png', alt: 'Venmo', url: 'https://venmo.com/austencloud' },
    {
      src: '/social_icons/github.png',
      alt: 'GitHub',
      url: 'https://github.com/austencloud/the-kinetic-constructor-web'
    },
    {
      src: '/social_icons/facebook.png',
      alt: 'Facebook',
      url: 'https://www.facebook.com/thekineticalphabet'
    },
    {
      src: '/social_icons/instagram.png',
      alt: 'Instagram',
      url: 'https://www.instagram.com/thekineticalphabet'
    },
    {
      src: '/social_icons/youtube.png',
      alt: 'YouTube',
      url: 'https://www.youtube.com/channel/UCbLHNRSASZS_gwkmRATH1-A'
    }
  ];

  const openLink = (url: string) => window.open(url, '_blank');
</script>

<div class="social-container">
  {#each socialLinks as link}
    <button
      class="button"
      on:click={() => openLink(link.url)}
      on:keydown={(e) => e.key === 'Enter' && openLink(link.url)}
      aria-label={link.alt}
    >
      <img class="icon" src={link.src} alt={link.alt} />
    </button>
  {/each}
</div>

<style>
  .social-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .button {
    width: 4vh;
    height: 4vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: white;
    border-radius: 50%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s, background-color 0.3s;
    border: none;
    outline: none;
  }

  .button:hover {
    background-color: #f0f0f0;
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    transform: scale(1.1);
  }

  .button:active {
    transform: translateY(0);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .icon {
    width: 2.5vh;
    height: 2.5vh;
    transition: transform 0.2s;
  }

  .button:hover .icon {
    transform: scale(1.1);
  }
</style>
