/* ==========================================================================
   Hormonal Optimization: interactions & motion
   Motion language: expo-out entrances (0.6–1.1s), 0.07–0.1s staggers,
   scroll-scrubbed only where the scroll position carries meaning (dial, rail).
   Everything works without JS / with prefers-reduced-motion.
   ========================================================================== */
(() => {
  "use strict";

  const cfg = window.SITE_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  const motion = !!(G && ST) && !reduced;

  if (!motion) root.classList.add("reduced");
  if (G && ST) G.registerPlugin(ST);

  /* ------------------------------------------------------------------ */
  /* Config: price, e-mail, Stripe link                                  */
  /* ------------------------------------------------------------------ */
  const price = cfg.price || "€8.99";
  const linkReady = typeof cfg.stripePaymentLink === "string" && /^https:\/\//.test(cfg.stripePaymentLink) && !/REPLACE/i.test(cfg.stripePaymentLink);

  $$("[data-price]").forEach((el) => (el.textContent = price));
  const pm = price.match(/^([^\d]*)(\d+)([.,]\d+)?/);
  const amount = $(".price-amount");
  if (pm && amount) {
    $(".cur", amount).textContent = pm[1].trim() || "€";
    $(".int", amount).textContent = pm[2];
    $(".dec", amount).textContent = pm[3] || "";
    amount.setAttribute("aria-label", "Price: " + price);
  }

  if (cfg.contactEmail) {
    $$("[data-email]").forEach((a) => {
      a.href = "mailto:" + cfg.contactEmail;
      if (a.textContent.includes("@")) a.textContent = cfg.contactEmail;
    });
  }

  const toast = $("#toast");
  let toastTimer;
  function showToast(html) {
    toast.innerHTML = html;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 5200);
  }

  function bindBuy(el) {
    if (linkReady) { el.href = cfg.stripePaymentLink; el.rel = "noopener"; return; }
    el.addEventListener("click", (e) => {
      e.preventDefault();
      closeMenu();
      const pricing = $("#pricing");
      const r = pricing.getBoundingClientRect();
      const visible = r.top < window.innerHeight * 0.6 && r.bottom > window.innerHeight * 0.3;
      if (!visible) pricing.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      else showToast("Checkout isn't live yet. Add your Stripe Payment Link to <code>assets/js/config.js</code>.");
    });
  }
  $$("[data-buy]").forEach(bindBuy);

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------ */
  /* Mobile menu (focus moves in, Escape closes, page behind is inert)   */
  /* ------------------------------------------------------------------ */
  const menuBtn = $("#menuBtn");
  const menu = $("#mobileMenu");
  const behind = [$("#main"), $(".footer"), $("#buybar")];
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    behind.forEach((el) => el && (el.inert = open));
    if (open) requestAnimationFrame(() => $("a", menu).focus());
  }
  function closeMenu() {
    if (!document.body.classList.contains("menu-open")) return;
    setMenu(false);
    menuBtn.focus();
  }
  menuBtn.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => { if (!a.hasAttribute("data-buy") || linkReady) setMenu(false); }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  window.matchMedia("(min-width: 921px)").addEventListener("change", (e) => e.matches && setMenu(false));

  /* ------------------------------------------------------------------ */
  /* Nav state, active section, buy bar                                  */
  /* ------------------------------------------------------------------ */
  const nav = $("#nav");
  const buybar = $("#buybar");
  const pricingEl = $("#pricing");
  const finalEl = $("#final");
  let lastY = window.scrollY;
  const inView = (el) => { const r = el.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; };
  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 20);
    const down = y > lastY + 2, up = y < lastY - 2;
    if (down && y > 700 && !nav.contains(document.activeElement)) nav.classList.add("hidden");
    else if (up || y < 700) nav.classList.remove("hidden");
    lastY = y;
    buybar.classList.toggle("show", y > window.innerHeight * 0.9 && !inView(pricingEl) && !inView(finalEl));
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  nav.addEventListener("focusin", () => nav.classList.remove("hidden"));
  onScroll();

  const navLinks = $$(".nav-links a");
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => (a.getAttribute("href") === "#" + en.target.id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  navLinks.forEach((a) => { const s = $(a.getAttribute("href")); if (s) sectionIO.observe(s); });

  /* ------------------------------------------------------------------ */
  /* Hero: hexagonal lattice with a travelling "growth pulse"            */
  /* (hexagons = the ring structure of steroid hormones;                 */
  /*  the pulse echoes HGH being released in pulses)                     */
  /* ------------------------------------------------------------------ */
  function lattice(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const R = 26, SQ3 = Math.sqrt(3);
    let w = 0, h = 0, dpr = 1, cells = [], origin = { x: 0, y: 0 }, maxD = 1;
    let running = false, raf = 0, t0 = performance.now();
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

    function hexPath(cx, cy, r) {
      const p = new Path2D();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
        i ? p.lineTo(x, y) : p.moveTo(x, y);
      }
      p.closePath();
      return p;
    }
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cells = [];
      const dx = SQ3 * R, dy = 1.5 * R;
      for (let row = -1, y = -R; y < h + R; row++, y += dy) {
        for (let x = (row & 1 ? dx / 2 : 0) - dx; x < w + dx; x += dx) cells.push({ x, y, p: hexPath(x, y, R - 1) });
      }
      const vis = $("#molecule");
      const cr = canvas.getBoundingClientRect();
      if (vis) { const r = vis.getBoundingClientRect(); origin = { x: r.left + r.width / 2 - cr.left, y: r.top + r.height / 2 - cr.top }; }
      else origin = { x: w * 0.7, y: h * 0.5 };
      maxD = Math.hypot(Math.max(origin.x, w - origin.x), Math.max(origin.y, h - origin.y));
      if (!running) draw(performance.now());
    }
    function draw(now) {
      ctx.clearRect(0, 0, w, h);
      mouse.x += (mouse.tx - mouse.x) * 0.15; mouse.y += (mouse.ty - mouse.y) * 0.15;
      const period = 3600;
      const k = reduced ? -1 : ((now - t0) % period) / period;
      const pr = k * maxD * 1.1;
      ctx.lineWidth = 1;
      for (const c of cells) {
        const d0 = Math.hypot(c.x - origin.x, c.y - origin.y);
        let a = 0.035 * Math.max(0.25, 1 - d0 / maxD) + 0.012;
        if (k >= 0) { const band = (d0 - pr) / 70; a += 0.16 * Math.exp(-band * band) * (1 - k); }
        const md = Math.hypot(c.x - mouse.x, c.y - mouse.y);
        if (md < 200) a += 0.22 * Math.pow(1 - md / 200, 2);
        ctx.strokeStyle = `rgba(212,174,92,${a.toFixed(3)})`;
        ctx.stroke(c.p);
      }
      if (running) raf = requestAnimationFrame(draw);
    }
    resize();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    if (reduced) return;
    const host = canvas.parentElement;
    if (finePointer) {
      host.addEventListener("pointermove", (e) => { const r = canvas.getBoundingClientRect(); mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top; }, { passive: true });
      host.addEventListener("pointerleave", () => { mouse.tx = mouse.ty = -9999; });
    }
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !running) { running = true; raf = requestAnimationFrame(draw); }
      else if (!en.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
    }).observe(canvas);
    document.addEventListener("visibilitychange", () => { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else if (!running && inView(canvas)) { running = true; raf = requestAnimationFrame(draw); } });
    window.addEventListener("load", resize);
  }
  lattice($("#lattice"));

  /* ------------------------------------------------------------------ */
  /* Hormone system: accessible tabs                                     */
  /* ------------------------------------------------------------------ */
  const tabs = $$('.rail [role="tab"]');
  function selectTab(tab, focus) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      if (on && panel.hidden) {
        panel.hidden = false;
        if (motion) G.fromTo(panel.children, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07, ease: "expo.out", clearProps: "transform,opacity,visibility" });
      } else if (!on) panel.hidden = true;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (e) => {
      let j = null;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); selectTab(tabs[j], true); }
    });
  });

  /* ------------------------------------------------------------------ */
  /* Manifesto: split into words (scroll highlight below)                */
  /* ------------------------------------------------------------------ */
  const manifesto = $("#manifestoText");
  if (manifesto) {
    manifesto.setAttribute("aria-label", manifesto.textContent.replace(/\s+/g, " ").trim());
    const frag = document.createDocumentFragment();
    manifesto.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
          else { const s = document.createElement("span"); s.className = "w"; s.setAttribute("aria-hidden", "true"); s.textContent = part; frag.appendChild(s); }
        });
      } else { const c = n.cloneNode(true); c.classList.add("w"); c.setAttribute("aria-hidden", "true"); frag.appendChild(c); }
    });
    manifesto.textContent = "";
    manifesto.appendChild(frag);
  }

  /* ------------------------------------------------------------------ */
  /* 24h protocol dial                                                   */
  /* ------------------------------------------------------------------ */
  const protocol = $("#protocol");
  const steps = $$(".step");
  const stepTimes = steps.map((s) => parseFloat(s.dataset.time));
  const dial = { hand: $("#dialHand"), tip: $("#dialTip"), progress: $("#dialProgress"), time: $("#dialTime"), phase: $("#dialPhase"), sky: $("#protocolSky") };
  const C = 200;
  const ang = (t) => ((t / 24) * 360 - 90) * (Math.PI / 180);
  const pt = (r, t) => [C + r * Math.cos(ang(t)), C + r * Math.sin(ang(t))];
  function arc(r, t1, t2) {
    let span = (t2 - t1 + 24) % 24;
    if (span === 0) span = 0.0001;
    const [x1, y1] = pt(r, t1), [x2, y2] = pt(r, t1 + span);
    return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 ${span > 12 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }
  function buildDial() {
    let html = "";
    for (let i = 0; i < 96; i++) {
      const t = i / 4, major = i % 24 === 0, hour = i % 4 === 0;
      const [x1, y1] = pt(major ? 166 : hour ? 172 : 178, t), [x2, y2] = pt(184, t);
      html += `<line class="tick${major ? " major" : ""}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"${hour ? "" : ' stroke-opacity=".35"'}/>`;
      if (major) { const [lx, ly] = pt(150, t); html += `<text class="hour-label" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}">${String(t).padStart(2, "0")}:00</text>`; }
    }
    $("#dialTicks").innerHTML = html;
    $("#fastArc").setAttribute("d", arc(118, 20, 12));
    $("#nightArc").setAttribute("d", arc(104, 23, 1));
    $("#dialEvents").innerHTML = stepTimes.map((t, i) => { const [x, y] = pt(184, t); return `<circle class="event-dot" data-i="${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"/>`; }).join("");
    $("#stepsProgress").innerHTML = steps.map(() => "<i></i>").join("");
  }
  const skyStops = [[6, [240, 138, 60, 0.15]], [9, [212, 174, 92, 0.12]], [12, [239, 215, 154, 0.11]], [18, [240, 110, 70, 0.11]], [21, [168, 115, 240, 0.13]], [23.5, [60, 80, 200, 0.13]]];
  function skyAt(t) {
    for (let i = 0; i < skyStops.length - 1; i++) {
      const [a, ca] = skyStops[i], [b, cb] = skyStops[i + 1];
      if (t <= b) { const k = Math.max(0, Math.min(1, (t - a) / (b - a))); const c = ca.map((v, j) => v + (cb[j] - v) * k); return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${c[3].toFixed(3)})`; }
    }
    return `rgba(${skyStops[skyStops.length - 1][1].join(",")})`;
  }
  const phaseAt = (t) => (t < 8 ? "Morning" : t < 10.5 ? "Fasting window" : t < 11.6 ? "Training" : t < 19 ? "Eating window" : t < 22.5 ? "Wind-down" : "Deep sleep");
  let activeStep = -1;
  function setDial(t, idx) {
    const [hx1, hy1] = pt(140, t), [hx2, hy2] = pt(196, t), [tx, ty] = pt(184, t);
    dial.hand.setAttribute("x1", hx1); dial.hand.setAttribute("y1", hy1); dial.hand.setAttribute("x2", hx2); dial.hand.setAttribute("y2", hy2);
    dial.tip.setAttribute("cx", tx); dial.tip.setAttribute("cy", ty);
    dial.progress.setAttribute("d", arc(184, stepTimes[0], Math.max(stepTimes[0] + 0.001, t)));
    const mins = Math.round(((t % 1) * 60) / 5) * 5;
    const hh = (Math.floor(t) + (mins === 60 ? 1 : 0)) % 24;
    dial.time.textContent = `${String(hh).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
    dial.phase.textContent = phaseAt(t);
    dial.sky.style.setProperty("--sky", skyAt(t));
    $$(".event-dot").forEach((d) => d.classList.toggle("active", +d.dataset.i <= idx));
    if (idx === activeStep) return;
    const prev = steps[activeStep], next = steps[idx];
    activeStep = idx;
    $$("#stepsProgress i").forEach((el, i) => el.classList.toggle("on", i === idx));
    if (protocol.classList.contains("stacked")) return;
    steps.forEach((s) => s.classList.toggle("active", s === next));
    if (motion && next) {
      if (prev) G.to(prev, { opacity: 0, y: -24, duration: 0.3, ease: "power2.in", overwrite: true });
      G.fromTo(next, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.55, delay: prev ? 0.18 : 0, ease: "expo.out", overwrite: true });
    }
  }
  buildDial();
  protocol.classList.add("stacked");
  setDial(stepTimes[stepTimes.length - 1], steps.length - 1);

  /* ------------------------------------------------------------------ */
  /* Quiz (Chapter 5.5)                                                  */
  /* ------------------------------------------------------------------ */
  const QUIZ = [
    { q: "How's your energy on most days?", a: [
      ["thyroid", "Tired all day, even after a full night's sleep"],
      ["hgh", "Wired at night, but I can't fall asleep"],
      ["igf", "Fine, but my body stays sore long after training"],
      ["testo", "Okay, but I lack drive and motivation"]] },
    { q: "What do your evenings look like?", a: [
      ["hgh", "Screens and snacks until late, bed after midnight"],
      ["thyroid", "I'm often cold, slow and sluggish"],
      ["testo", "Stressed. My head won't switch off"],
      ["igf", "Pretty calm, but I sleep less than 8 hours"]] },
    { q: "How is your training going?", a: [
      ["igf", "I train, but I barely see muscle progress"],
      ["hgh", "Mostly long, steady cardio sessions"],
      ["testo", "My strength has stalled for weeks"],
      ["thyroid", "I don't have the energy to train hard"]] },
    { q: "Which sounds most like your diet?", a: [
      ["thyroid", "I eat very little or I'm always dieting"],
      ["hgh", "Lots of sugar, especially in the evening"],
      ["igf", "Honestly? Not much protein"],
      ["testo", "Low-fat. I skip eggs, meat and fish"]] },
  ];
  const RESULTS = {
    thyroid: { name: "Thyroid", mark: "T3", c: "var(--thyroid)", cause: "Your metabolic engine may be in “conservation mode”. When T3 is low, your body responds poorly to every other hormone.", ch: "Start with Chapter 1: iodine, selenium & T3 conversion" },
    hgh: { name: "Growth hormone", mark: "GH", c: "var(--hgh)", cause: "Your nightly growth-hormone pulse is probably being blunted by late insulin, light or too little deep sleep.", ch: "Start with Chapter 2: sleep protocol, fasting & lactate training" },
    igf: { name: "IGF-1", mark: "IGF", c: "var(--igf)", cause: "The builder isn't getting enough raw material or stimulus: protein, heavy compound training and sleep.", ch: "Start with Chapter 3: protein intake, liver & heavy training" },
    testo: { name: "Testosterone", mark: "T", c: "var(--testo)", cause: "Your power supply looks held back by stress, a low-fat diet or high SHBG.", ch: "Start with Chapter 4: fats, zinc, SHBG & cortisol" },
  };
  const quizBody = $("#quizBody"), quizStep = $("#quizStep"), quizBar = $("#quizBar");
  let qi = 0, scores = {}, busy = false;
  function swap(render, focusAfter) {
    const after = () => { if (focusAfter) { const h = $("h3", quizBody); h && h.focus({ preventScroll: true }); } };
    if (!motion) { render(); after(); return; }
    G.to(quizBody, { opacity: 0, y: -12, duration: 0.2, ease: "power2.in", onComplete: () => {
      render(); after();
      G.fromTo(quizBody, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: "expo.out" });
    } });
  }
  function renderQ() {
    const item = QUIZ[qi];
    quizStep.textContent = `Question ${qi + 1} / ${QUIZ.length}`;
    quizBar.style.width = `${(qi / QUIZ.length) * 100}%`;
    quizBody.innerHTML = `<div class="quiz-q"><h3 tabindex="-1">${item.q}</h3><div class="quiz-options">${item.a.map(([k, t], i) =>
      `<button type="button" class="quiz-opt" data-k="${k}" aria-pressed="false"><kbd aria-hidden="true">${"ABCD"[i]}</kbd><span>${t}</span></button>`).join("")}</div></div>`;
    $$(".quiz-opt", quizBody).forEach((b) => b.addEventListener("click", (e) => {
      if (busy) return;
      busy = true;
      const viaKeyboard = e.detail === 0;
      b.setAttribute("aria-pressed", "true");
      scores[b.dataset.k] = (scores[b.dataset.k] || 0) + 1;
      setTimeout(() => { busy = false; qi++; swap(qi < QUIZ.length ? renderQ : renderResult, viaKeyboard); }, 280);
    }));
  }
  function renderResult() {
    const order = ["hgh", "igf", "thyroid", "testo"];
    const key = order.reduce((best, k) => ((scores[k] || 0) > (scores[best] || 0) ? k : best), order[0]);
    const r = RESULTS[key];
    quizStep.textContent = "Your result";
    quizBar.style.width = "100%";
    quizBody.innerHTML = `<div class="quiz-result" style="--c:${r.c}">
      <div class="res-head"><div class="res-mark" aria-hidden="true">${r.mark}</div><div><span class="label">Your focus hormone</span><h3 tabindex="-1">${r.name}</h3></div></div>
      <p>${r.cause}</p>
      <span class="tag" style="--c:${r.c}">${r.ch}</span>
      <div class="res-actions">
        <a href="#pricing" class="btn btn-primary" data-buy>Get the course <span class="btn-price">${price}</span></a>
        <button type="button" class="btn btn-outline" id="quizRetry">Retake the quiz</button>
      </div></div>`;
    bindBuy($("[data-buy]", quizBody));
    $("#quizRetry").addEventListener("click", (e) => { qi = 0; scores = {}; swap(renderQ, e.detail === 0); });
  }
  renderQ();

  /* ------------------------------------------------------------------ */
  /* Accordions (chapters + FAQ), height animation on top of <details>   */
  /* ------------------------------------------------------------------ */
  $$("details").forEach((d) => {
    const summary = $("summary", d), body = $(".ch-body", d);
    if (!summary || !body) return;
    summary.addEventListener("click", (e) => {
      if (!motion) return;
      e.preventDefault();
      if (d.open) G.to(body, { height: 0, duration: 0.4, ease: "power3.inOut", onComplete: () => { d.open = false; body.style.height = ""; ST.refresh(); } });
      else { d.open = true; G.fromTo(body, { height: 0 }, { height: "auto", duration: 0.55, ease: "expo.out", onComplete: () => { body.style.height = ""; ST.refresh(); } }); }
    });
  });

  /* ------------------------------------------------------------------ */
  /* Everything below: GSAP + motion allowed                             */
  /* ------------------------------------------------------------------ */
  if (!motion) return;

  /* Hero entrance: no loader, content is never blocked */
  const words = $$(".hero-title .word");
  const bonds = $$(".molecule .bond");
  bonds.forEach((b) => { const L = b.getTotalLength(); b.style.strokeDasharray = L; b.style.strokeDashoffset = L; });
  G.timeline({ defaults: { ease: "expo.out" } })
    .from(words, { yPercent: 110, duration: 1.1, stagger: 0.06 }, 0)
    .from("[data-hero-fade]", { autoAlpha: 0, y: 22, duration: 0.9, stagger: 0.07 }, 0.25)
    .from(".hero-visual .ring, .hero-visual .halo", { autoAlpha: 0, scale: 0.9, duration: 1.4, stagger: 0.08 }, 0)
    .to(bonds, { strokeDashoffset: 0, duration: 0.8, stagger: 0.03, ease: "power2.inOut" }, 0.15)
    .from(".molecule .atom, .molecule .mol-label", { autoAlpha: 0, scale: 0, transformOrigin: "50% 50%", duration: 0.45, stagger: 0.015, ease: "back.out(3)" }, 0.75)
    .from(".chip, .mol-caption", { autoAlpha: 0, y: 12, duration: 0.7, stagger: 0.08 }, 0.9)
    .add(startPulse, 1.4);

  /* A single energy pulse running along the bonds, in sync with the lattice pulse */
  function startPulse() {
    const dot = $("#pulseDot");
    const run = () => {
      if (document.hidden) { G.delayedCall(1, run); return; }
      const b = bonds[(Math.random() * bonds.length) | 0], L = b.getTotalLength(), s = { t: 0 };
      G.set(dot, { opacity: 1 });
      G.to(s, { t: 1, duration: 0.7, ease: "power1.inOut", onUpdate: () => { const p = b.getPointAtLength(s.t * L); dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); },
        onComplete: () => { G.to(dot, { opacity: 0, duration: 0.2 }); G.delayedCall(0.6 + Math.random() * 0.8, run); } });
    };
    run();
  }

  /* Hero leaves gently on scroll */
  G.to(".hero-copy", { yPercent: -10, autoAlpha: 0.25, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  G.to("#heroVisual", { yPercent: 14, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* Ticker: slow drift, nudged by scroll velocity */
  const track = $("#tickerTrack");
  track.appendChild(track.firstElementChild.cloneNode(true));
  const loop = G.to(track, { xPercent: -50, duration: 60, ease: "none", repeat: -1 });
  ST.create({ trigger: ".ticker", start: "top bottom", end: "bottom top",
    onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
    onUpdate: (self) => {
      const v = self.getVelocity();
      G.to(loop, { timeScale: (v < 0 ? -1 : 1) * Math.min(4, 1 + Math.abs(v) / 500), duration: 0.2, overwrite: true });
      G.to(loop, { timeScale: v < 0 ? -1 : 1, duration: 1, delay: 0.2, ease: "power2.out" });
    } });

  /* Manifesto word highlight */
  G.to($$(".w", manifesto), { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: manifesto, start: "top 80%", end: "bottom 45%", scrub: true } });

  /* Reveals */
  G.set("[data-reveal]", { y: 32 });
  ST.batch("[data-reveal]", { start: "top 90%", once: true,
    onEnter: (batch) => G.to(batch, { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: "expo.out", overwrite: "auto", clearProps: "transform" }) });

  /* Rail line fills as the system scrolls in */
  G.fromTo("#chainFill", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".rail", start: "top 85%", end: "top 45%", scrub: true } });

  /* Counters (final values are in the HTML; animate from 0) */
  $$(".count").forEach((el) => {
    const to = parseFloat(el.dataset.to), o = { v: 0 };
    el.textContent = "0";
    ST.create({ trigger: el, start: "top 92%", once: true, onEnter: () => G.to(o, { v: to, duration: 1.6, ease: "expo.out", onUpdate: () => (el.textContent = Math.round(o.v)) }) });
  });

  /* Protocol: pinned, scrubbed dial on wide screens; auto sweep on small ones */
  const mm = G.matchMedia();
  mm.add("(min-width: 900px)", () => {
    protocol.classList.remove("stacked");
    activeStep = -1;
    G.set(steps, { opacity: 0 });
    setDial(stepTimes[0], 0);
    const n = steps.length;
    const st = ST.create({
      trigger: "#protocolStage", start: "top top", end: () => "+=" + window.innerHeight * n * 0.42,
      pin: true, scrub: 0.5, anticipatePin: 1,
      onUpdate: (self) => {
        const f = self.progress * (n - 1), i = Math.min(n - 2, Math.floor(f)), k = Math.min(1, f - i);
        setDial(stepTimes[i] + (stepTimes[i + 1] - stepTimes[i]) * k, Math.round(f));
      },
    });
    return () => {
      st.kill();
      protocol.classList.add("stacked");
      G.set(steps, { clearProps: "all" });
      steps.forEach((s) => s.classList.remove("active"));
      activeStep = -1;
      setDial(stepTimes[n - 1], n - 1);
    };
  });
  mm.add("(max-width: 899px)", () => {
    const o = { t: stepTimes[0] };
    const tw = G.to(o, { t: stepTimes[stepTimes.length - 1], duration: 3, ease: "power2.inOut", paused: true,
      onUpdate: () => { let idx = 0; stepTimes.forEach((s, i) => { if (o.t >= s - 0.01) idx = i; }); setDial(o.t, idx); } });
    const st = ST.create({ trigger: ".dial-wrap", start: "top 75%", once: true, onEnter: () => tw.play(0) });
    return () => { st.kill(); tw.kill(); };
  });

  /* Course page preview: pages fan out as the section scrolls in */
  const pages = $$("#preview .page");
  const spread = () => (window.innerWidth < 600 ? 0.5 : window.innerWidth < 960 ? 0.8 : 1);
  const fan = [{ x: -86, r: -10, y: 22 }, { x: -30, r: -3.5, y: 4 }, { x: 30, r: 3.5, y: -2 }, { x: 88, r: 8.5, y: 16 }];
  G.set(pages, { rotation: (i) => [-4, 3, -2, 0][i] });
  G.to(pages, { x: (i) => fan[i].x * spread(), rotation: (i) => fan[i].r, y: (i) => fan[i].y, ease: "none",
    scrollTrigger: { trigger: "#preview", start: "top 80%", end: "center 45%", scrub: 0.8, invalidateOnRefresh: true } });

  /* Price digits */
  G.from(".price-amount span", { yPercent: 50, autoAlpha: 0, duration: 1, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: ".price-card", start: "top 75%", once: true } });

  /* Final moon grows with scroll */
  G.fromTo(".final-moon", { scale: 0.75, autoAlpha: 0.4 }, { scale: 1.08, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: "#final", start: "top bottom", end: "bottom top", scrub: true } });

  window.addEventListener("load", () => ST.refresh());
})();
