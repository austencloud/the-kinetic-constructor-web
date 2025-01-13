import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      fallback: 'index.html', // SPA fallback
      strict: false,          // Ignore strict mode for dynamic routes
    }),
  },
};
