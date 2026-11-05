# PDFs for the website (on your host only)

Do **not** commit the paid PDF to a public Git repository, or anyone can download it for free.

- `free-sleep-chapter.pdf`: the free chapter, linked from the home page.
- `hormonal-optimization-<key>.pdf`: the paid course. `<key>` is the same key as in the
  Stripe Payment Link redirect (`thank-you.html?k=<key>`). It is only stored in Stripe.

PDFs in this folder are ignored by Git (see `.gitignore`).
