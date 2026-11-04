# Hormonal Optimization: cursus-website

Statische verkoopwebsite (HTML/CSS/JS, geen build nodig) voor de cursus **Hormonal Optimization**, prijs **€8.99**.
Betalen, btw en levering van de PDF lopen via **Lemon Squeezy** (Merchant of Record).

```
course-website/
├── index.html          ← verkooppagina
├── thank-you.html      ← pagina na betaling (video + uitleg)
├── video.html          ← video-pagina (de QR-code in de PDF wijst hiernaar)
├── terms.html          ← algemene voorwaarden (template)
├── privacy.html        ← privacybeleid (template)
├── refund.html         ← refund policy (template)
├── downloads/          ← alleen voor testen / gratis hoofdstuk (PDF's staan NIET in git)
└── assets/
    ├── js/config.js    ← ★ het enige bestand dat je moet aanpassen
    ├── js/main.js
    ├── css/style.css
    ├── img/            ← cover + voorbeeldpagina's
    └── video/          ← overzichtsvideo + poster
```

## Lemon Squeezy instellen (±15 minuten, samen met een ouder)

Je moet **18+** zijn voor een betaalaccount. Laat daarom een ouder/voogd het account aanmaken: het geld komt op hun rekening.

### 1. Account en winkel
1. Ga naar [lemonsqueezy.com](https://www.lemonsqueezy.com) → **Get started**. Account op naam van je ouder.
2. Maak een **Store** aan, bijvoorbeeld `Hormonal Optimization`.
3. Vul **Settings → Payouts** in (bankrekening van je ouder) en doe de identiteitscontrole. Pas daarna kun je echt verkopen.

### 2. Product: de cursus (€8.99)
1. **Products → New product**.
2. Naam: `Hormonal Optimization: The Complete Course`. Prijs: **€8.99**, *single payment*.
3. Bij **Files**: upload `Hormonal_Optimization_Course.pdf`. Lemon Squeezy mailt kopers dan zelf een veilige downloadlink.
4. Bij de bevestiging na aankoop (*Confirmation modal* / knop-link): zet de link naar `https://JOUW-SITE/thank-you.html`, zodat kopers ook de video zien.
5. **Publish** → **Share** → kopieer de **checkout link** (`https://…lemonsqueezy.com/buy/…`).

### 3. Product: het gratis hoofdstuk (€0)
1. **New product** → naam `Free chapter: The Sleep Protocol`, prijs **€0** (of *pay what you want* met minimum 0).
2. Upload `Free_Sleep_Chapter.pdf`.
3. Zet bij de checkout de optie aan om **toestemming voor e-mails** te vragen (marketing consent). Zo bouw je een e-maillijst op.
4. **Publish** → kopieer ook deze checkout link.

### 4. `assets/js/config.js` invullen
```js
checkoutUrl: "https://jouwwinkel.lemonsqueezy.com/buy/....",     // de cursus
freeChapterUrl: "https://jouwwinkel.lemonsqueezy.com/buy/....",  // het gratis hoofdstuk
price: "€8.99",
contactEmail: "jouw@email.com",
delivery: "platform",
testMode: false,      // ← pas op false zetten als alles werkt
```

### 5. Testen
Lemon Squeezy heeft een **Test mode** (schakelaar linksonder in het dashboard). Doe daarmee een proefaankoop met kaart `4242 4242 4242 4242`, zie dat de mail met de PDF aankomt, en zet test mode daarna uit.

### 6. Online zetten
Sleep de map naar [app.netlify.com/drop](https://app.netlify.com/drop) en kies als sitenaam **hormonal-optimization** (de QR-code in de PDF wijst naar `hormonal-optimization.netlify.app/video.html`).
Zet de **betaalde** PDF niet op de site als `testMode` uit staat: Lemon Squeezy levert hem.

### Extra: partners (affiliates)
In Lemon Squeezy kun je een **affiliate-programma** aanzetten. TikTokkers en sporters die je cursus promoten, krijgen dan bijvoorbeeld 30–40% per verkoop via hun eigen link.

## Juridische pagina's
`terms.html`, `privacy.html` en `refund.html` zijn **templates**. Vul de gemarkeerde velden in met de gegevens van je ouder (naam, adres, eventueel ondernemingsnummer, land) en laat ze nakijken. Lemon Squeezy is de *Merchant of Record*: zij verkopen de cursus formeel door en regelen btw en facturen.

## Lokaal bekijken
```bash
cd course-website
python3 -m http.server 8000
# open http://localhost:8000
```

## Ontwerp
Lichte magazine-stijl, dezelfde als de cursus. Opbouw: kop + koopknop + echte cover → video met echte bronnen → wat je leert → gratis hoofdstuk → pagina's + prijs + koopknop → vragen → laatste koopknop, plus een koopbalk die meeloopt tijdens het scrollen. Geen externe JavaScript-bibliotheken; respecteert *reduced motion*.
