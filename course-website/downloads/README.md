# Put the course PDF here (on your host only)

Do **not** commit the PDF to a public Git repository, or anyone can download it for free.

1. Rename the PDF to something hard to guess, e.g. `hormonal-optimization-7f3k9q2x.pdf`.
2. Upload it to this `downloads/` folder on your hosting (Netlify / Vercel / your server).
3. Put the same path in `assets/js/config.js` → `downloadUrl`.

PDFs in this folder are ignored by Git (see `.gitignore`).
