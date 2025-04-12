window.addEventListener('DOMContentLoaded', () => {
  const page =
    Array.from(document.querySelectorAll('[role=navigation] td:not(:has(a))'))
      .map((elm) => parseInt(elm.innerText))
      .find((page) => !isNaN(page)) ?? 1;

  const refreshTrackingIndex = () => {
    console.log('reindexing result links');
    document.querySelectorAll('a:has(h3)').forEach((a, i) => {
      const url = URL.parse(a.href);
      if (url === null) return;
      url.searchParams.set('protokolibri-search', `${page}-${i + 1}`);
      a.href = url.href;
      console.log(url.href, a);
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
          node.matches('h3, :has(h3)')
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
