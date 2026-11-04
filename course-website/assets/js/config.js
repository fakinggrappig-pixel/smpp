/* ==========================================================================
   SITE CONFIG: the only file you need to edit to go live.
   ========================================================================== */
window.SITE_CONFIG = {
  // 1. Your Stripe Payment Link (Stripe Dashboard → Payment Links → Create).
  //    Looks like: "https://buy.stripe.com/abc123XYZ"
  stripePaymentLink: "https://buy.stripe.com/REPLACE_WITH_YOUR_LINK",

  // 2. Price shown on every button and on the pricing card.
  //    Keep it identical to the price in your Stripe Payment Link.
  price: "€8.99",

  // 3. Support / contact e-mail shown in the FAQ, footer and legal pages.
  contactEmail: "support@example.com",

  // 4. Where the PDF lives (used on thank-you.html).
  //    Upload the PDF to your host and use a hard-to-guess file name, e.g.
  //    "downloads/hormonal-optimization-7f3k9q2x.pdf"
  downloadUrl: "downloads/REPLACE-with-secret-name.pdf",
};
