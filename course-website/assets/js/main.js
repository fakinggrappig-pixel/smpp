/* Hormonal Optimization: small interactions, no libraries.
   Motion: elements rise in once, the cover tilts toward the mouse,
   the preview pages fan out. All of it is off with prefers-reduced-motion. */
(() => {
  "use strict";
  const cfg = window.SITE_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Config: price, e-mail, Stripe link */
  const price = cfg.price || "€8.99";
  $$("[data-price]").forEach((el) => (el.textContent = price));
  if (cfg.contactEmail) $$("[data-email]").forEach((a) => (a.href = "mailto:" + cfg.contactEmail));
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  const linkReady = /^https:\/\//.test(cfg.stripePaymentLink || "") && !/REPLACE/i.test(cfg.stripePaymentLink);
  const toast = $("#toast");
  let toastTimer;
  $$("[data-buy]").forEach((el) => {
    if (linkReady) { el.href = cfg.stripePaymentLink; el.rel = "noopener"; return; }
    // Not configured yet: go to the buy block, and tell the site owner what to do.
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const buy = $("#buy");
      const r = buy.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.5 || r.bottom < 0) buy.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      else {
        toast.innerHTML = "Checkout isn't live yet. Add your Stripe Payment Link to <code>assets/js/config.js</code>.";
        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("show"), 5000);
      }
    });
  });

  /* Nav background + sticky buy bar */
  const nav = $("#nav"), bar = $("#buybar"), buy = $("#buy"), final = $(".final"), hero = $(".hero");
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; };
  const onScroll = () => {
    nav.classList.toggle("scrolled", window.scrollY > 10);
    bar.classList.toggle("show", !visible(hero) && !visible(buy) && !visible(final));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Rise-in on scroll */
  const rise = $$(".rise");
  if (reduced || !("IntersectionObserver" in window)) rise.forEach((el) => el.classList.add("in"));
  else {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    rise.forEach((el) => io.observe(el));
  }

  /* Preview pages fan out when the buy block comes into view */
  const pages = $("#pages");
  if (pages) {
    if (reduced) pages.classList.add("open");
    else new IntersectionObserver(([en], obs) => { if (en.isIntersecting) { pages.classList.add("open"); obs.disconnect(); } }, { threshold: 0.35 }).observe(pages);
  }

  /* Cover tilts toward the mouse (desktop only) */
  const cover = $("#cover"), stack = $("#coverStack");
  if (cover && finePointer && !reduced) {
    hero.addEventListener("pointermove", (e) => {
      const r = cover.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      const y = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      stack.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 10}deg)`;
    });
    hero.addEventListener("pointerleave", () => (stack.style.transform = ""));
  }
})();
