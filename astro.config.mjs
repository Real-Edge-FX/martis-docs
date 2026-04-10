// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    starlight({
      title: 'Martis',
      description: 'A modern, open-source admin engine for Laravel. React-first. Resource-driven. Override-first.',
      logo: {
        src: './src/assets/logo.png',
        replacesTitle: true,
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/Real-Edge-FX/martis' },
      ],
      customCss: ['./src/styles/custom.css'],
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'getting-started/introduction' },
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Quick Start', slug: 'getting-started/quickstart' },
            { label: 'Troubleshooting', slug: 'getting-started/troubleshooting' },
          ],
        },
        {
          label: 'Core Concepts',
          items: [
            { label: 'Resources', slug: 'core/resources' },
            { label: 'Fields Reference', slug: 'core/fields' },
            { label: 'Relationships', slug: 'core/relationships' },
            { label: 'Actions', slug: 'core/actions' },
            { label: 'Override System', slug: 'core/overrides' },
            { label: 'Authentication', slug: 'core/authentication' },
            { label: 'Configuration', slug: 'core/configuration' },
            { label: 'Built-in Components', slug: 'core/components' },
          ],
        },
        {
          label: 'API & Architecture',
          items: [
            { label: 'REST API Overview', slug: 'reference/api' },
            { label: 'Technology Stack', slug: 'reference/stack' },
            { label: 'Architectural Decisions', slug: 'reference/decisions' },
          ],
        },
        {
          label: 'Project Status',
          items: [
            { label: 'Nova v5 Parity Map', slug: 'reference/parity-map' },
          ],
        },
      ],
      head: [
        {
          tag: 'meta',
          attrs: { name: 'og:image', content: '/og-image.png' },
        },
        {
          tag: 'script',
          content: "(function(){var t=localStorage.getItem('starlight-theme');if(!t){localStorage.setItem('starlight-theme','dark');document.documentElement.setAttribute('data-theme','dark');}})();",
        },
      ],
    }),
  ],
});
