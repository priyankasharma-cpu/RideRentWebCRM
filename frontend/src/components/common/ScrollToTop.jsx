import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  restoreRouteScroll,
  routeScrollKey,
  scrollToPageTop,
  shouldResetForInternalLink,
  setManualScrollRestoration,
} from './scrollRestoration.js';

export function ScrollToTop() {
  const location = useLocation();
  const key = routeScrollKey(location);

  useLayoutEffect(() => setManualScrollRestoration(window.history), []);

  useLayoutEffect(() => {
    const handleInternalLink = (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;

      const clicked = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!clicked) return;

      if (
        shouldResetForInternalLink(clicked.href, window.location.href, {
          target: clicked.getAttribute('target') || '',
          download: clicked.hasAttribute('download'),
        })
      )
        scrollToPageTop();
    };

    document.addEventListener('click', handleInternalLink, true);
    return () => document.removeEventListener('click', handleInternalLink, true);
  }, []);

  // Path changes (including back/forward) start at the top; query-only control updates keep scroll.
  useLayoutEffect(() => restoreRouteScroll(location.hash), [key, location.hash]);

  return null;
}
