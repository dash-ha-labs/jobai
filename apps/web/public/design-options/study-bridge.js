// Only the study host can receive these fixed event names. Normal previews do not track.
(() => {
  if (parent === window || new URLSearchParams(location.search).get('study') !== '1') return;
  const allowed = ['started', 'processing', 'review', 'decision', 'layout', 'layout_confirmed'];
  window.jobaiStudy = event => {
    if (allowed.includes(event)) parent.postMessage({ type: 'jobai-study-event', event }, location.origin);
  };
  // Keep testers on their assigned concept, without exposing the comparison gallery.
  document.addEventListener('DOMContentLoaded', () => {
    const hideComparisonLinks = () => document.querySelectorAll('a[href^="/app"], .concept').forEach(element => { if (!element.hidden) element.hidden = true; });
    hideComparisonLinks();
    new MutationObserver(hideComparisonLinks).observe(document.body, { childList: true, subtree: true });
    window.jobaiStudy('started');
  });
})();
