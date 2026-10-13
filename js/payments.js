/* Paste a Stripe Payment Link to charge a real card for that plan or top-up.
   Empty links use demo checkout and do not charge a card. */
(function (root) {
  root.KILN_PAYMENTS = {
    links: {
      starter: '',
      studio: '',
      works: '',
      super: '',
      'top-100': '',
      'top-300': ''
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
