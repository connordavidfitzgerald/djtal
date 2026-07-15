import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    site: 'https://djt.al',
    // Pages are static by default; only the booking API routes opt into
    // on-demand rendering via `export const prerender = false`.
    // Swap this adapter for @astrojs/vercel (or another) to deploy elsewhere.
    adapter: node({ mode: 'standalone' }),
    vite: {
        plugins: [tailwindcss()]
    }
});
