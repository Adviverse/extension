// @adviverse/extension — Adviverse ads on a browser extension's OWN pages
// (popup, options, new tab, side panel). Manifest V3 forbids remote script on
// extension pages, so the ad runs in an https iframe (serve.adviverse.com/frame)
// that loads the normal web SDK in in-app mode: the extension id is the app's
// bundle id. No permissions, no remote code in your package. Never use this to
// put ads on other websites (Chrome Web Store "ad injection" policy).

export const SERVE_ORIGIN = 'https://serve.adviverse.com';

function ext() {
  const g = globalThis;
  return (g.browser && g.browser.runtime) || (g.chrome && g.chrome.runtime) || undefined;
}

/** chrome | edge | firefox, from the runtime and user agent. */
export function detectPlatform(ua = (globalThis.navigator && navigator.userAgent) || '') {
  if (/Firefox\//.test(ua) || (globalThis.browser && !globalThis.chrome)) return 'firefox';
  if (/Edg\//.test(ua)) return 'edge';
  return 'chrome';
}

/** The /frame URL for one slot. Throws without a tag or an extension id. */
export function frameUrl(o) {
  const id = o.extensionId || (ext() && ext().id);
  if (!o.tag) throw new Error('adviverse: tag is required');
  if (!id) throw new Error('adviverse: no extension id (run on an extension page, or pass extensionId)');
  const q = new URLSearchParams({ tag: o.tag, bundle: id, platform: o.platform || detectPlatform() });
  if (o.size) q.set('size', o.size);
  if (o.personalized) q.set('p', '1');
  return (o.origin || SERVE_ORIGIN) + '/frame?' + q.toString();
}

/**
 * Renders an ad into `el`. Options: tag (required), size "300x250", personalized
 * (only with the user's consent), onFill({format,width,height}), onNoFill().
 * The slot collapses on no-fill. Returns {destroy}.
 */
export function mountAd(el, o) {
  const origin = o.origin || SERVE_ORIGIN;
  const f = el.ownerDocument.createElement('iframe');
  const m = /^(\d+)x(\d+)$/.exec(o.size || '');
  f.src = frameUrl(o);
  f.title = 'Advertisement';
  f.loading = 'lazy';
  f.referrerPolicy = 'no-referrer';
  // No allow-top-navigation: an ad can open a tab, never navigate your page.
  f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
  f.style.cssText = 'border:0;display:block;overflow:hidden;' + (m ? `width:${m[1]}px;height:${m[2]}px` : 'width:100%;height:100%');
  const onMsg = (e) => {
    if (e.origin !== origin || e.source !== f.contentWindow || !e.data || e.data.source !== 'adviverse') return;
    if (e.data.type === 'filled') {
      if (!m && e.data.width && e.data.height) { f.style.width = e.data.width + 'px'; f.style.height = e.data.height + 'px'; }
      o.onFill && o.onFill({ format: String(e.data.format || ''), width: +e.data.width || 0, height: +e.data.height || 0 });
    } else if (e.data.type === 'no_fill') {
      f.style.display = 'none';
      o.onNoFill && o.onNoFill();
    }
  };
  const win = el.ownerDocument.defaultView;
  win.addEventListener('message', onMsg);
  el.appendChild(f);
  return { destroy() { win.removeEventListener('message', onMsg); f.remove(); } };
}
