/* Applies the saved language before first paint to avoid an RTL/LTR flash. */
(function () {
  try {
    var locale = localStorage.getItem('autoparts.locale');
    if (locale !== 'ar' && locale !== 'fr') {
      locale = (navigator.language || '').toLowerCase().indexOf('ar') === 0 ? 'ar' : 'fr';
    }
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  } catch (error) {
    document.documentElement.lang = 'fr';
    document.documentElement.dir = 'ltr';
  }
})();
