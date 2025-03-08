window.addEventListener('DOMContentLoaded', () => {
  const page =
    Array.from(document.querySelectorAll('[role=navigation] td:not(:has(a))'))
      .map((elm) => parseInt(elm.innerText))
      .find((page) => !isNaN(page)) ?? 1;

  const refreshTrackingIndex = () => {
    document.querySelectorAll('.g:not(.g .g)').forEach((g, i) => {
      g.querySelectorAll('a').forEach((a) => {
        const url = URL.parse(a.href);
        if (url === null) return;
        url.searchParams.set('protokolibri-search', `${page}-${i + 1}`);
        a.href = url.href;
      });
    });
  };

  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const changes = Array.from(mutation.addedNodes).concat(
        Array.from(mutation.removedNodes)
      );

      let refreshIndex = false;
      for (const node of changes) {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.matches('* .g:not(.g .g)')
        ) {
          refreshIndex = true;
          break;
        }
      }
      if (refreshIndex) refreshTrackingIndex();
    });
  }).observe(document, { subtree: true, childList: true });

  refreshTrackingIndex();
});
