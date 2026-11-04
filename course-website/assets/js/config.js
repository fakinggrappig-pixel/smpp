/* ==========================================================================
   SITE CONFIG: the only file you need to edit to go live.
   Step-by-step setup (in Dutch): see README.md, "Lemon Squeezy instellen".
   ========================================================================== */
window.SITE_CONFIG = {
  // 1. Checkout link of the course (Lemon Squeezy → Products → the course → Share).
  //    Looks like: "https://yourstore.lemonsqueezy.com/buy/1a2b3c4d-..."
  //    A Stripe Payment Link or Gumroad link works here too.
  checkoutUrl: "https://REPLACE.lemonsqueezy.com/buy/REPLACE-COURSE",

  // 2. Checkout link of the FREE sleep chapter (a €0 product in Lemon Squeezy).
  //    People leave their e-mail address and get the PDF. Leave "REPLACE" in it
  //    to link straight to the PDF on your own site instead (no e-mail collected).
  freeChapterUrl: "https://REPLACE.lemonsqueezy.com/buy/REPLACE-FREE-CHAPTER",

  // 3. Price shown on every button. Keep it identical to the price in Lemon Squeezy.
  price: "€8.99",

  // 4. Support / contact e-mail shown in the FAQ, footer and legal pages.
  contactEmail: "support@example.com",

  // 5. How buyers receive the course PDF:
  //    "platform" = Lemon Squeezy e-mails the download link (safe, recommended)
  //    "site"     = the thank-you page links to downloadUrl on this website
  delivery: "platform",
  downloadUrl: "downloads/hormonal-optimization-course.pdf",
  freeChapterFile: "downloads/free-sleep-chapter.pdf",

  // 6. Test mode. true = the site shows the normal price, but every buy button
  //    skips payment and goes straight to the download page (with a download
  //    button). Set to false before you start selling for real.
  testMode: true,
};
