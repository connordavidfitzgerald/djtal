import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CV52izJ0.mjs';
import { manifest } from './manifest_BdFmW8gi.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/api/availability.astro.mjs');
const _page3 = () => import('./pages/api/checkout.astro.mjs');
const _page4 = () => import('./pages/api/stripe-webhook.astro.mjs');
const _page5 = () => import('./pages/book/success.astro.mjs');
const _page6 = () => import('./pages/book.astro.mjs');
const _page7 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/about.astro", _page1],
    ["src/pages/api/availability.ts", _page2],
    ["src/pages/api/checkout.ts", _page3],
    ["src/pages/api/stripe-webhook.ts", _page4],
    ["src/pages/book/success.astro", _page5],
    ["src/pages/book.astro", _page6],
    ["src/pages/index.astro", _page7]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "c60bffb5-7dac-41d4-9b86-fabaf142e57f",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
