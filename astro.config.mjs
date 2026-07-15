import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    site: 'https://djt.al',
    // Pages are static by default; only the booking API routes opt into
    // on-demand rendering via `export const prerender = false`.
    adapter: vercel(),
    vite: {
        plugins: [tailwindcss()]
    }
});
