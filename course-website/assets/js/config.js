/* ==========================================================================
   SITE CONFIG: the only file you need to edit.
   Setup steps (in Dutch): see README.md, "Stripe".
   ========================================================================== */
window.SITE_CONFIG = {
  // 1. Stripe Payment Link of the course (€8.99).
  //    After payment, Stripe sends the buyer to thank-you.html?k=<key>, and the
  //    thank-you page offers downloads/hormonal-optimization-<key>.pdf.
  //    The key is only in the Payment Link settings, never in this website's code.
  checkoutUrl: "https://buy.stripe.com/cNicN6e2F51PaTm60S3gk00",

  // 2. Free sleep chapter. Empty = link straight to freeChapterFile (no sign-up).
  freeChapterUrl: "",
  freeChapterFile: "downloads/free-sleep-chapter.pdf",

  // 3. Price shown on every button. Keep it identical to the price in Stripe.
  price: "€8.99",

  // 4. Support / contact e-mail shown in the FAQ, footer and legal pages.
  contactEmail: "support@example.com",

  // 5. Test mode. true = buy buttons skip payment and go straight to the
  //    download page, which then offers downloadUrl. Keep false when selling.
  testMode: false,
  downloadUrl: "",
};
