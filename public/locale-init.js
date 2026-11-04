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
