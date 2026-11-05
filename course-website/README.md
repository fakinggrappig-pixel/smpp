# Hormonal Optimization: cursus-website

Statische verkoopwebsite (HTML/CSS/JS, geen build nodig) voor de cursus **Hormonal Optimization**, prijs **€8.99**.
Betalen loopt via een **Stripe Payment Link**. Na betaling stuurt Stripe de koper naar de downloadpagina.

```
course-website/
├── index.html          ← verkooppagina
├── thank-you.html      ← pagina na betaling (video + uitleg)
├── video.html          ← video-pagina (de QR-code in de PDF wijst hiernaar)
├── terms.html          ← algemene voorwaarden (template)
├── privacy.html        ← privacybeleid (template)
├── refund.html         ← refund policy (template)
├── downloads/          ← gratis hoofdstuk + betaalde PDF (staan NIET in git)
└── assets/
    ├── js/config.js    ← ★ het enige bestand dat je moet aanpassen
    ├── js/main.js
    ├── css/style.css
    ├── img/            ← cover + voorbeeldpagina's
    └── video/          ← overzichtsvideo + poster
```

## Stripe

Je moet **18+** zijn voor een betaalaccount. Het Stripe-account moet dus op naam van een ouder/voogd staan, met hun bankrekening en ID-controle.

Hoe het werkt:
1. De koopknoppen gaan naar de Stripe Payment Link (`checkoutUrl` in `assets/js/config.js`).
2. Na betaling stuurt Stripe de koper naar `thank-you.html?k=<sleutel>`.
3. De downloadpagina biedt dan `downloads/hormonal-optimization-<sleutel>.pdf` aan.

De sleutel staat **alleen** in de instellingen van de Payment Link (Stripe → Payment Links → *After payment*), niet in de code van de site en niet in git. Wie de sleutel niet heeft, ziet geen downloadknop. Het is geen waterdichte beveiliging: een koper kan de link doorsturen. Voor een PDF van €8.99 is dat oké.

### Zelf aanpassen in Stripe
- **Settings → Business → Public details**: zet de naam die kopers zien op `Hormonal Optimization`.
- **Settings → Customer emails**: zet *Successful payments* aan, dan krijgen kopers een bonnetje.
- Btw: Stripe regelt de btw niet voor je. Vraag bij weinig verkoop na of je ouder de vrijstellingsregeling voor kleine ondernemingen kan gebruiken.

### Online zetten
Sleep de map naar [app.netlify.com/drop](https://app.netlify.com/drop) en kies als sitenaam **hormonal-optimization**. De Payment Link en de QR-code in de PDF wijzen naar `hormonal-optimization.netlify.app`.
De betaalde PDF hoort in `downloads/` met de naam `hormonal-optimization-<sleutel>.pdf`. Hij staat **niet** in git.

## Juridische pagina's
`terms.html`, `privacy.html` en `refund.html` zijn **templates**. Vul de gemarkeerde velden in met de gegevens van je ouder (naam, adres, eventueel ondernemingsnummer, land) en laat ze nakijken. Met Stripe is je ouder zelf de verkoper.

## Lokaal bekijken
```bash
cd course-website
python3 -m http.server 8000
# open http://localhost:8000
```

## Ontwerp
Lichte magazine-stijl, dezelfde als de cursus. Opbouw: kop + koopknop + echte cover → video met echte bronnen → wat je leert → gratis hoofdstuk → pagina's + prijs + koopknop → vragen → laatste koopknop, plus een koopbalk die meeloopt tijdens het scrollen. Geen externe JavaScript-bibliotheken; respecteert *reduced motion*.
