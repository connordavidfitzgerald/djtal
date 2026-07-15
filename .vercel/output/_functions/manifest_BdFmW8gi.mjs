import 'piccolore';
import { q as decodeKey } from './chunks/astro/server_Cx4pE33Y.mjs';
import 'clsx';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_CdU2laVR.mjs';
import 'es-module-lexer';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/connor/WebstormProjects/DJTAL/","cacheDir":"file:///Users/connor/WebstormProjects/DJTAL/node_modules/.astro/","outDir":"file:///Users/connor/WebstormProjects/DJTAL/dist/","srcDir":"file:///Users/connor/WebstormProjects/DJTAL/src/","publicDir":"file:///Users/connor/WebstormProjects/DJTAL/public/","buildClientDir":"file:///Users/connor/WebstormProjects/DJTAL/dist/client/","buildServerDir":"file:///Users/connor/WebstormProjects/DJTAL/dist/server/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"about/index.html","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/about.MkDNP4xa.css"}],"routeData":{"route":"/about","isIndex":false,"type":"page","pattern":"^\\/about\\/?$","segments":[[{"content":"about","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/about.astro","pathname":"/about","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"book/success/index.html","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/about.MkDNP4xa.css"}],"routeData":{"route":"/book/success","isIndex":false,"type":"page","pattern":"^\\/book\\/success\\/?$","segments":[[{"content":"book","dynamic":false,"spread":false}],[{"content":"success","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/book/success.astro","pathname":"/book/success","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"book/index.html","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/about.MkDNP4xa.css"}],"routeData":{"route":"/book","isIndex":false,"type":"page","pattern":"^\\/book\\/?$","segments":[[{"content":"book","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/book.astro","pathname":"/book","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/about.MkDNP4xa.css"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/availability","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/availability\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"availability","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/availability.ts","pathname":"/api/availability","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/checkout","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/checkout\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"checkout","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/checkout.ts","pathname":"/api/checkout","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/stripe-webhook","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/stripe-webhook\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"stripe-webhook","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/stripe-webhook.ts","pathname":"/api/stripe-webhook","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"site":"https://djt.al","base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/Users/connor/WebstormProjects/DJTAL/src/pages/about.astro",{"propagation":"none","containsHead":true}],["/Users/connor/WebstormProjects/DJTAL/src/pages/book.astro",{"propagation":"none","containsHead":true}],["/Users/connor/WebstormProjects/DJTAL/src/pages/book/success.astro",{"propagation":"none","containsHead":true}],["/Users/connor/WebstormProjects/DJTAL/src/pages/index.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000@astro-page:src/pages/about@_@astro":"pages/about.astro.mjs","\u0000@astro-page:src/pages/api/availability@_@ts":"pages/api/availability.astro.mjs","\u0000@astro-page:src/pages/api/checkout@_@ts":"pages/api/checkout.astro.mjs","\u0000@astro-page:src/pages/api/stripe-webhook@_@ts":"pages/api/stripe-webhook.astro.mjs","\u0000@astro-page:src/pages/book/success@_@astro":"pages/book/success.astro.mjs","\u0000@astro-page:src/pages/book@_@astro":"pages/book.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_BdFmW8gi.mjs","/Users/connor/WebstormProjects/DJTAL/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_DkPLibC1.mjs","/Users/connor/WebstormProjects/DJTAL/src/components/BookingWidget.astro?astro&type=script&index=0&lang.ts":"_astro/BookingWidget.astro_astro_type_script_index_0_lang.DAbwNC59.js","/Users/connor/WebstormProjects/DJTAL/src/components/Meter.astro?astro&type=script&index=0&lang.ts":"_astro/Meter.astro_astro_type_script_index_0_lang.DOlw1A7O.js","/Users/connor/WebstormProjects/DJTAL/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts":"_astro/Layout.astro_astro_type_script_index_0_lang.BBdeA-8z.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["/Users/connor/WebstormProjects/DJTAL/src/components/BookingWidget.astro?astro&type=script&index=0&lang.ts","const s=document.querySelector(\"[data-booking]\");if(s){let a=function(t){H.textContent=t,H.classList.toggle(\"hidden\",!t)},d=function(t){e.length=t;for(const o of y){const r=Number(o.dataset.length)===t;o.classList.toggle(\"is-active\",r),o.classList.toggle(\"opacity-100\",r),o.classList.toggle(\"opacity-60\",!r)}},u=function(){const t=e.slots.find(o=>o.startHour===e.startHour);t?(m.textContent=`${t.price}`,p.textContent=`${e.length}h · ${t.time}–${t.endTime} · CAD`,n.disabled=!1):(m.textContent=\"—\",p.textContent=\"\",n.disabled=!0)},h=function(){g.innerHTML=\"\",b.classList.toggle(\"hidden\",e.slots.length>0);for(const t of e.slots){const o=document.createElement(\"button\");o.type=\"button\",o.dataset.start=String(t.startHour);const r=t.startHour===e.startHour;o.className=[\"hover-underline text-left text-[16px] font-medium transition-opacity\",r?\"is-active opacity-100\":\"opacity-60\"].join(\" \"),o.textContent=t.time,o.addEventListener(\"click\",()=>{e.startHour=t.startHour,h(),u()}),g.appendChild(o)}u()};const c=s.querySelector(\"[data-date]\"),y=Array.from(s.querySelectorAll(\"[data-length]\")),g=s.querySelector(\"[data-slots]\"),b=s.querySelector(\"[data-slots-empty]\"),f=s.querySelector(\"[data-slots-loading]\"),m=s.querySelector(\"[data-total]\"),p=s.querySelector(\"[data-summary]\"),n=s.querySelector(\"[data-checkout]\"),H=s.querySelector(\"[data-error]\"),e={date:c.value,length:1,startHour:null,slots:[]};let l=0;async function i(){a(\"\"),f.classList.remove(\"hidden\");const t=++l;try{const r=await(await fetch(`/api/availability?date=${encodeURIComponent(e.date)}&length=${e.length}`)).json();if(t!==l)return;e.slots=r.slots??[],e.slots.some(S=>S.startHour===e.startHour)||(e.startHour=e.slots.length?e.slots[0].startHour:null),h()}catch{t===l&&a(\"Could not load availability. Try again.\")}finally{t===l&&f.classList.add(\"hidden\")}}for(const t of y)t.addEventListener(\"click\",()=>{d(Number(t.dataset.length)),i()});c.addEventListener(\"change\",()=>{e.date=c.value,i()}),n.addEventListener(\"click\",async()=>{if(e.startHour!==null){a(\"\"),n.disabled=!0,n.textContent=\"Redirecting…\";try{const t=await fetch(\"/api/checkout\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\"},body:JSON.stringify({date:e.date,length:e.length,startHour:e.startHour})}),o=await t.json();if(t.ok&&o.url){window.location.href=o.url;return}t.status===409?(a(\"That slot was just taken — pick another time.\"),await i()):t.status===503?a(\"Payments aren’t set up yet. Please try again later.\"):a(\"Something went wrong starting checkout.\")}catch{a(\"Network error — please try again.\")}finally{n.textContent=\"Checkout\",n.disabled=e.startHour===null}}}),d(1),i()}"],["/Users/connor/WebstormProjects/DJTAL/src/components/Meter.astro?astro&type=script&index=0&lang.ts","const n=document.querySelector(\"[data-meter]\"),t=document.querySelector(\"[data-meter-cursor]\"),s=100;n&&t&&(document.addEventListener(\"mousemove\",c=>{const e=n.getBoundingClientRect();if(Math.min(Math.abs(c.clientY-e.top),Math.abs(c.clientY-e.bottom))<s){t.style.opacity=\"1\";const o=Math.max(0,Math.min(c.clientX-e.left,e.width));t.style.left=`${o}px`}else t.style.opacity=\"0\"}),document.addEventListener(\"mouseleave\",()=>{t.style.opacity=\"0\"}));"]],"assets":["/_astro/djtalbg.CaMyWYxY.png","/_astro/djtal.npAR6-5M.svg","/_astro/about.MkDNP4xa.css","/favicon.svg","/_astro/Layout.astro_astro_type_script_index_0_lang.BBdeA-8z.js","/fonts/Octave-Medium.woff2","/fonts/Octave-Regular.woff2","/about/index.html","/book/success/index.html","/book/index.html","/index.html"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"actionBodySizeLimit":1048576,"serverIslandNameMap":[],"key":"R5/Y13QWjHI+ECNDeDt0rkV50I0BqvbuMvztFnvlBg0="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
