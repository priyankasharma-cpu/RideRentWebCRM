const MAX_HASH_LOOKUP_FRAMES = 120;

export function routeScrollKey(location) {
  return `${location.pathname}${location.hash || ''}`;
}

export function shouldResetForInternalLink(
  href,
  currentHref,
  { target = '', download = false } = {},
) {
  if (download || (target && target !== '_self')) return false;
  try {
    const destination = new URL(href, currentHref);
    const current = new URL(currentHref);
    return destination.origin === current.origin && !destination.hash;
  } catch {
    return false;
  }
}

export function setManualScrollRestoration(history) {
  if (!('scrollRestoration' in history)) return () => {};
  const previous = history.scrollRestoration;
  history.scrollRestoration = 'manual';
  return () => {
    history.scrollRestoration = previous;
  };
}

export function restoreRouteScroll(hash, windowObject = window, documentObject = document) {
  if (!hash) {
    scrollToPageTop(windowObject, documentObject);
    return () => {};
  }

  let targetId;
  try {
    targetId = decodeURIComponent(hash.slice(1));
  } catch {
    targetId = hash.slice(1);
  }

  let frame;
  let attempts = 0;
  const reducedMotion = windowObject.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const scrollWhenAvailable = () => {
    const target = documentObject.getElementById(targetId);
    if (target) {
      target.scrollIntoView({
        behavior: reducedMotion ? 'instant' : 'smooth',
        block: 'start',
      });
      return;
    }

    if (attempts++ < MAX_HASH_LOOKUP_FRAMES)
      frame = windowObject.requestAnimationFrame(scrollWhenAvailable);
  };

  frame = windowObject.requestAnimationFrame(scrollWhenAvailable);
  return () => windowObject.cancelAnimationFrame(frame);
}

export function scrollToPageTop(windowObject = window, documentObject = document) {
  try {
    windowObject.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  } catch {
    windowObject.scrollTo(0, 0);
  }
  if (documentObject.documentElement) documentObject.documentElement.scrollTop = 0;
  if (documentObject.body) documentObject.body.scrollTop = 0;
}
