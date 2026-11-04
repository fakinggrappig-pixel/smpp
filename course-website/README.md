# Hormonal Optimization: cursus-website

Statische verkoopwebsite (HTML/CSS/JS, geen build nodig) voor de cursus **Hormonal Optimization**, prijs **€8.99**, betaling via **Stripe Payment Link**.

```
course-website/
├── index.html          ← verkooppagina
├── thank-you.html      ← pagina na betaling (download)
├── terms.html          ← algemene voorwaarden (template)
├── privacy.html        ← privacybeleid (template)
├── refund.html         ← refund policy (template)
├── downloads/          ← hier komt de PDF op je hosting (NIET in git)
└── assets/
    ├── js/config.js    ← ★ het enige bestand dat je moet aanpassen
    ├── js/main.js      ← animaties & interacties
    ├── css/style.css
    ├── img/            ← previews van de PDF-pagina's
    └── vendor/         ← GSAP + ScrollTrigger (lokaal, geen CDN nodig)
```

## Live zetten in 4 stappen

### 1. Stripe Payment Link maken
1. Maak een account op [stripe.com](https://stripe.com) en activeer je account.
2. **Product catalog → Add product**: naam `Hormonal Optimization: The Complete Course`, prijs **€8.99**, eenmalig (one-off).
3. **Payment Links → New**: kies dat product.
4. Tabblad **After payment** → *Don't show confirmation page* → **Redirect customers to your website** →
   `https://JOUW-DOMEIN/thank-you.html`
5. Tabblad **Options**: zet **Require customers to accept your terms of service** aan (link naar `terms.html`). Dit is nodig om het EU-herroepingsrecht bij digitale downloads te laten vervallen.
6. **Settings → Payment methods**: zet iDEAL, Bancontact, Apple Pay en Google Pay aan.
7. Kopieer de link (`https://buy.stripe.com/...`).

### 2. `assets/js/config.js` invullen
```js
stripePaymentLink: "https://buy.stripe.com/jouw-link",
price: "€8.99",
contactEmail: "jouw@email.com",
downloadUrl: "downloads/hormonal-optimization-7f3k9q2x.pdf",
```
Alle koopknoppen, prijzen en e-mailadressen op de hele site worden hieruit gevuld.

### 3. PDF uploaden
Geef de PDF een moeilijk te raden naam, zet hem in `downloads/` **op je hosting** en zet hetzelfde pad in `downloadUrl`.
Commit de PDF **niet** in een publieke repo; `.gitignore` blokkeert `downloads/*.pdf` al.

> Let op: een download-link op een bedank-pagina kan gedeeld worden. Wil je dat later waterdicht maken, gebruik dan Stripe + een kleine serverless functie die een tijdelijke link maakt, of een platform zoals Lemon Squeezy.

### 4. Hosten (gratis)
- **Netlify**: sleep de map `course-website` naar [app.netlify.com/drop](https://app.netlify.com/drop). Klaar.
- **Vercel / Cloudflare Pages**: importeer de repo en zet de root op `course-website`.
- **GitHub Pages**: kan ook, maar dan is de repo publiek; zet de PDF dan ergens anders.

## Juridische pagina's
`terms.html`, `privacy.html` en `refund.html` zijn **templates**. Vul de gemarkeerde velden in (naam, adres, KvK/btw, land) en laat ze nakijken. Ook met een anoniem merk moet je in de EU als verkoper identificeerbaar zijn.

## Lokaal bekijken
```bash
cd course-website
python3 -m http.server 8000
# open http://localhost:8000
```

## Wat zit erin
- Laadscherm, geanimeerde hero met testosteron-molecuul dat zichzelf tekent, deeltjesnetwerk dat op de muis reageert
- Marquee die versnelt met je scrollsnelheid, manifest-tekst die woord voor woord oplicht
- 4 hormoon-kaarten met 3D-tilt + spotlight, geanimeerde "system chain"
- **24-uurs klok** die meedraait terwijl je scrollt (vastgepind op desktop, automatische animatie op mobiel)
- Hormoon-quiz (4 vragen → resultaat → koopknop)
- Curriculum-accordeon + PDF-pagina's die uitwaaieren
- Prijskaart met draaiende gouden rand, sticky koopbalk, FAQ, 22 bronnen
- Respecteert *reduced motion* en werkt ook zonder JavaScript-animaties
