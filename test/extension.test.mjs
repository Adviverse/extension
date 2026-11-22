import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frameUrl, detectPlatform, mountAd, SERVE_ORIGIN } from '../index.js';

const ID = 'abcdefghijklmnopabcdefghijklmnop';

test('frameUrl carries tag, extension id, platform, size; contextual by default', () => {
  const u = new URL(frameUrl({ tag: 'tk_1', extensionId: ID, platform: 'chrome', size: '300x250' }));
  assert.equal(u.origin + u.pathname, SERVE_ORIGIN + '/frame');
  assert.deepEqual(Object.fromEntries(u.searchParams), { tag: 'tk_1', bundle: ID, platform: 'chrome', size: '300x250' });
  assert.equal(new URL(frameUrl({ tag: 't', extensionId: ID, personalized: true })).searchParams.get('p'), '1');
});

test('frameUrl reads chrome.runtime.id and refuses without tag or id', () => {
  globalThis.chrome = { runtime: { id: ID } };
  try {
    assert.equal(new URL(frameUrl({ tag: 't' })).searchParams.get('bundle'), ID);
  } finally {
    delete globalThis.chrome;
  }
  assert.throws(() => frameUrl({ tag: 't' }), /extension id/);
  assert.throws(() => frameUrl({ extensionId: ID }), /tag/);
});

test('detectPlatform', () => {
  assert.equal(detectPlatform('Mozilla/5.0 Firefox/130.0'), 'firefox');
  assert.equal(detectPlatform('Mozilla/5.0 Chrome/130 Safari/537 Edg/130'), 'edge');
  assert.equal(detectPlatform('Mozilla/5.0 Chrome/130 Safari/537'), 'chrome');
});

test('mountAd: sandboxed iframe, sizes on fill, hides on no-fill, ignores other origins', () => {
  const listeners = {};
  const win = { addEventListener: (t, f) => (listeners[t] = f), removeEventListener: (t) => delete listeners[t] };
  const iframe = { style: {}, contentWindow: {}, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, remove() { this.removed = true; } };
  const doc = { defaultView: win, createElement: () => iframe };
  const el = { ownerDocument: doc, appendChild(c) { this.child = c; } };
  let filled, noFill = 0;
  const h = mountAd(el, { tag: 't', extensionId: ID, platform: 'chrome', onFill: (a) => (filled = a), onNoFill: () => noFill++ });
  assert.equal(el.child, iframe);
  assert.ok(!iframe.attrs.sandbox.includes('allow-top-navigation'));
  const send = (data, origin = SERVE_ORIGIN, source = iframe.contentWindow) => listeners.message({ data, origin, source });
  send({ source: 'adviverse', type: 'filled', width: 300, height: 250 }, 'https://evil.example');
  assert.equal(filled, undefined);
  send({ source: 'adviverse', type: 'filled', format: 'banner', width: 300, height: 250 });
  assert.deepEqual(filled, { format: 'banner', width: 300, height: 250 });
  assert.equal(iframe.style.width, '300px');
  send({ source: 'adviverse', type: 'no_fill' });
  assert.equal(noFill, 1);
  assert.equal(iframe.style.display, 'none');
  h.destroy();
  assert.ok(iframe.removed && !listeners.message);
});
