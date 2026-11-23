import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  restoreRouteScroll,
  routeScrollKey,
  scrollToPageTop,
  shouldResetForInternalLink,
  setManualScrollRestoration,
} from '../src/components/common/scrollRestoration.js';

function createWindow() {
  const frames = new Map();
  let nextFrame = 1;
  return {
    frames,
    scrollCalls: [],
    scrollTo(options) {
      this.scrollCalls.push(options);
    },
    matchMedia() {
      return { matches: false };
    },
    requestAnimationFrame(callback) {
      const id = nextFrame++;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) {
      frames.delete(id);
    },
    runNextFrame() {
      const [id, callback] = frames.entries().next().value;
      frames.delete(id);
      callback();
    },
  };
}

test('initial direct load and normal pathname navigation start at the top', () => {
  const win = createWindow();
  const document = { documentElement: { scrollTop: 800 }, body: { scrollTop: 800 } };
  restoreRouteScroll('', win, document);
  assert.deepEqual(win.scrollCalls, [{ top: 0, left: 0, behavior: 'instant' }]);
  assert.equal(document.documentElement.scrollTop, 0);
  assert.equal(document.body.scrollTop, 0);
});

test('hash navigation targets the anchor smoothly, including anchors rendered after route load', () => {
  const win = createWindow();
  let target = null;
  const document = { getElementById: () => target };
  restoreRouteScroll('#rental-terms', win, document);

  win.runNextFrame();
  assert.equal(win.frames.size, 1);

  const calls = [];
  target = { scrollIntoView: (options) => calls.push(options) };
  win.runNextFrame();
  assert.deepEqual(calls, [{ behavior: 'smooth', block: 'start' }]);
  assert.deepEqual(win.scrollCalls, []);
});

test('reduced motion uses immediate anchor scrolling', () => {
  const win = createWindow();
  win.matchMedia = () => ({ matches: true });
  const calls = [];
  const cancel = restoreRouteScroll('#policy', win, {
    getElementById: () => ({ scrollIntoView: (options) => calls.push(options) }),
  });
  win.runNextFrame();
  cancel();
  assert.deepEqual(calls, [{ behavior: 'instant', block: 'start' }]);
});

test('query-only changes preserve scroll while path and hash changes are distinct locations', () => {
  assert.equal(
    routeScrollKey({ pathname: '/vehicles', search: '?category=Bike', hash: '' }),
    routeScrollKey({ pathname: '/vehicles', search: '?category=Car', hash: '' }),
  );
  assert.notEqual(
    routeScrollKey({ pathname: '/vehicles', hash: '' }),
    routeScrollKey({ pathname: '/checkout', hash: '' }),
  );
  assert.notEqual(
    routeScrollKey({ pathname: '/rental-policy', hash: '#fees' }),
    routeScrollKey({ pathname: '/rental-policy', hash: '#returns' }),
  );
});

test('same-site navigation links reset scroll, including a footer link that clears filters', () => {
  assert.equal(
    shouldResetForInternalLink('/vehicles', 'https://riderent.example/vehicles?category=Bike'),
    true,
  );
  assert.equal(
    shouldResetForInternalLink('/about', 'https://riderent.example/vehicles?category=Bike'),
    true,
  );
  assert.equal(
    shouldResetForInternalLink(
      '/vehicles?category=Car',
      'https://riderent.example/vehicles?category=Bike',
    ),
    true,
  );
});

test('hash anchors, external links, downloads and new tabs do not reset current scroll', () => {
  const current = 'https://riderent.example/rental-policy';
  assert.equal(shouldResetForInternalLink('#refunds', current), false);
  assert.equal(shouldResetForInternalLink('/rental-policy#refunds', current), false);
  assert.equal(shouldResetForInternalLink('https://example.com', current), false);
  assert.equal(shouldResetForInternalLink('/about', current, { target: '_blank' }), false);
  assert.equal(shouldResetForInternalLink('/file.pdf', current, { download: true }), false);
});

test('scroll reset covers the browser window and both document scroll roots', () => {
  const win = createWindow();
  const document = { documentElement: { scrollTop: 600 }, body: { scrollTop: 600 } };
  scrollToPageTop(win, document);
  assert.deepEqual(win.scrollCalls, [{ top: 0, left: 0, behavior: 'instant' }]);
  assert.equal(document.documentElement.scrollTop, 0);
  assert.equal(document.body.scrollTop, 0);
});

test('manual browser restoration is enabled and previous setting restored on cleanup', () => {
  const history = { scrollRestoration: 'auto' };
  const cleanup = setManualScrollRestoration(history);
  assert.equal(history.scrollRestoration, 'manual');
  cleanup();
  assert.equal(history.scrollRestoration, 'auto');
});
