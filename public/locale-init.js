/* A duplicate Pages project in another Cloudflare account also builds this repo; send its visitors to the main address. */
if (location.hostname === 'bmgoran.pages.dev') {
  location.replace('https://bmg-oran.pages.dev' + location.pathname + location.search + location.hash);
}

/* Applies the saved language before first paint to avoid an RTL/LTR flash. */
(function () {
  try {
    if (localStorage.getItem('autoparts.locale') === 'fr') {
      document.documentElement.lang = 'fr';
      document.documentElement.dir = 'ltr';
    }
  } catch (error) {
    // Storage unavailable: keep the Arabic default from the HTML.
  }
})();
