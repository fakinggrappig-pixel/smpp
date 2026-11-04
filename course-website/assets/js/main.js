/* ==========================================================================
   Hormonal Optimization: interactions & motion
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
  /* Config wiring: price, e-mail, Stripe link                           */
  /* ------------------------------------------------------------------ */
  const price = cfg.price || "€8.99";
  const linkReady = typeof cfg.stripePaymentLink === "string" && /^https:\/\//.test(cfg.stripePaymentLink) && !/REPLACE/i.test(cfg.stripePaymentLink);

  $$("[data-price]").forEach((el) => (el.textContent = price));
  const m = price.match(/^([^\d]*)(\d+)([.,]\d+)?/);
  if (m) {
    const amount = $(".price-amount");
    if (amount) {
      $(".cur", amount).textContent = m[1].trim() || "€";
      $(".int", amount).textContent = m[2];
      $(".dec", amount).textContent = m[3] || "";
      amount.setAttribute("aria-label", "Price: " + price);
    }
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
    if (!toast) return;
    toast.innerHTML = html;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 5200);
  }

  function bindBuy(el) {
    if (linkReady) {
      el.href = cfg.stripePaymentLink;
      el.rel = "noopener";
      return;
    }
    el.addEventListener("click", (e) => {
      e.preventDefault();
      closeMenu();
      const pricing = $("#pricing");
      const r = pricing.getBoundingClientRect();
      const inView = r.top < window.innerHeight * 0.6 && r.bottom > window.innerHeight * 0.3;
      if (!inView) pricing.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      else showToast("Checkout isn't live yet. Paste your Stripe Payment Link into <code>assets/js/config.js</code>.");
    });
  }
  $$("[data-buy]").forEach(bindBuy);

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------ */
  /* Mobile menu & nav                                                   */
  /* ------------------------------------------------------------------ */
  const menuBtn = $("#menuBtn");
  function closeMenu() {
    document.body.classList.remove("menu-open");
    if (menuBtn) { menuBtn.setAttribute("aria-expanded", "false"); menuBtn.setAttribute("aria-label", "Open menu"); }
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    $$("#mobileMenu a").forEach((a) => a.addEventListener("click", () => { if (!a.hasAttribute("data-buy") || linkReady) closeMenu(); }));
    document.addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());
  }

  const nav = $("#nav");
  const buybar = $("#buybar");
  const pricingEl = $("#pricing");
  const finalEl = $("#final");
  let lastY = window.scrollY;
  function inView(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  }
  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 20);
    const goingDown = y > lastY;
    nav.classList.toggle("hidden", goingDown && y > 700 && !document.body.classList.contains("menu-open"));
    lastY = y;
    const show = y > window.innerHeight * 0.9 && !inView(pricingEl) && !inView(finalEl);
    buybar.classList.toggle("show", show);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------ */
  /* Cursor glow & magnetic buttons                                      */
  /* ------------------------------------------------------------------ */
  if (finePointer && !reduced) {
    const glow = $("#cursorGlow");
    let gx = 0, gy = 0, tx = 0, ty = 0, raf = 0;
    const loop = () => {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      raf = Math.abs(tx - gx) + Math.abs(ty - gy) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    window.addEventListener("mousemove", (e) => {
      tx = e.clientX; ty = e.clientY;
      glow.classList.add("on");
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });

    if (G) {
      $$(".magnetic").forEach((btn) => {
        const xTo = G.quickTo(btn, "x", { duration: 0.6, ease: "power3.out" });
        const yTo = G.quickTo(btn, "y", { duration: 0.6, ease: "power3.out" });
        btn.addEventListener("mousemove", (e) => {
          const r = btn.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
        });
        btn.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Hero particle network (canvas)                                      */
  /* ------------------------------------------------------------------ */
  function particles(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const palette = ["214,178,94", "214,178,94", "214,178,94", "243,220,155", "74,163,232", "55,196,124", "240,138,60", "168,115,240"];
    let w = 0, h = 0, dpr = 1, pts = [], running = false, raf = 0;
    const mouse = { x: -9999, y: -9999 };
    const LINK = 130;

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(28, Math.min(110, Math.round((w * h) / 15000)));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.5 + 0.5, c: palette[(Math.random() * palette.length) | 0],
      }));
      if (!running) draw();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        if (running) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 22000) { const f = (1 - d2 / 22000) * 0.6; p.x += (dx / Math.sqrt(d2 + 1)) * f; p.y += (dy / Math.sqrt(d2 + 1)) * f; }
          p.x += p.vx; p.y += p.vy;
          if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
        }
      }
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(214,178,94,${(1 - d / LINK) * 0.16})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.fillStyle = `rgba(${p.c},0.85)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      if (running) raf = requestAnimationFrame(draw);
    }

    resize();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    if (reduced) return;
    canvas.parentElement.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    canvas.parentElement.addEventListener("mouseleave", () => { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !running) { running = true; raf = requestAnimationFrame(draw); }
      else if (!en.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
    }).observe(canvas);
  }
  particles($("#heroCanvas"));

  /* ------------------------------------------------------------------ */
  /* Manifesto: split into words                                         */
  /* ------------------------------------------------------------------ */
  const manifesto = $("#manifestoText");
  if (manifesto) {
    const frag = document.createDocumentFragment();
    manifesto.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
          else { const s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.appendChild(s); }
        });
      } else { n.classList.add("w"); frag.appendChild(n.cloneNode(true)); }
    });
    manifesto.textContent = "";
    manifesto.appendChild(frag);
    if (!motion) $$(".w", manifesto).forEach((w) => (w.style.opacity = 1));
  }

  /* ------------------------------------------------------------------ */
  /* 24h protocol dial                                                   */
  /* ------------------------------------------------------------------ */
  const protocol = $("#protocol");
  const steps = $$(".step");
  const stepTimes = steps.map((s) => parseFloat(s.dataset.time));
  const dial = {
    hand: $("#dialHand"), tip: $("#dialTip"), progress: $("#dialProgress"),
    time: $("#dialTime"), phase: $("#dialPhase"), sky: $("#protocolSky"),
  };
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
    const ticks = $("#dialTicks");
    if (!ticks) return;
    let html = "";
    for (let i = 0; i < 96; i++) {
      const t = i / 4, major = i % 24 === 0, hour = i % 4 === 0;
      const [x1, y1] = pt(major ? 166 : hour ? 172 : 178, t), [x2, y2] = pt(184, t);
      html += `<line class="tick${major ? " major" : ""}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" ${hour ? "" : 'stroke-opacity=".35"'}/>`;
      if (major) {
        const [lx, ly] = pt(150, t);
        html += `<text class="hour-label" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}">${String(t).padStart(2, "0")}:00</text>`;
      }
    }
    ticks.innerHTML = html;
    $("#fastArc").setAttribute("d", arc(118, 20, 12));
    $("#nightArc").setAttribute("d", arc(104, 23, 1));
    $("#dialEvents").innerHTML = stepTimes.map((t, i) => {
      const [x, y] = pt(184, t);
      return `<circle class="event-dot" data-i="${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"/>`;
    }).join("");
    const prog = $("#stepsProgress");
    if (prog) prog.innerHTML = steps.map(() => "<i></i>").join("");
  }
  const skyStops = [
    [6, [240, 138, 60, 0.16]], [9, [214, 178, 94, 0.13]], [12, [243, 220, 155, 0.12]],
    [18, [240, 110, 70, 0.12]], [21, [168, 115, 240, 0.14]], [23.5, [60, 80, 200, 0.14]],
  ];
  function skyAt(t) {
    for (let i = 0; i < skyStops.length - 1; i++) {
      const [a, ca] = skyStops[i], [b, cb] = skyStops[i + 1];
      if (t <= b) {
        const k = Math.max(0, Math.min(1, (t - a) / (b - a)));
        const c = ca.map((v, j) => v + (cb[j] - v) * k);
        return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${c[3].toFixed(3)})`;
      }
    }
    const c = skyStops[skyStops.length - 1][1];
    return `rgba(${c.join(",")})`;
  }
  function phaseAt(t) {
    if (t < 8) return "Morning";
    if (t < 10.5) return "Fasting window";
    if (t < 11.6) return "Training";
    if (t < 19) return "Eating window";
    if (t < 22.5) return "Wind-down";
    return "Deep sleep";
  }
  let activeStep = -1;
  function setDial(t, idx) {
    const [hx1, hy1] = pt(140, t), [hx2, hy2] = pt(196, t), [tx, ty] = pt(184, t);
    dial.hand.setAttribute("x1", hx1); dial.hand.setAttribute("y1", hy1);
    dial.hand.setAttribute("x2", hx2); dial.hand.setAttribute("y2", hy2);
    dial.tip.setAttribute("cx", tx); dial.tip.setAttribute("cy", ty);
    dial.progress.setAttribute("d", arc(184, stepTimes[0], Math.max(stepTimes[0] + 0.001, t)));
    const mins = Math.round((t % 1) * 60 / 5) * 5;
    const hh = (Math.floor(t) + (mins === 60 ? 1 : 0)) % 24;
    dial.time.textContent = `${String(hh).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
    dial.phase.textContent = phaseAt(t);
    if (dial.sky) dial.sky.style.setProperty("--sky", skyAt(t));
    $$(".event-dot").forEach((d) => d.classList.toggle("active", parseFloat(d.dataset.i) <= idx));
    if (idx !== activeStep) {
      const prev = steps[activeStep];
      const next = steps[idx];
      activeStep = idx;
      $$("#stepsProgress i").forEach((el, i) => el.classList.toggle("on", i === idx));
      if (protocol.classList.contains("stacked")) return;
      steps.forEach((s) => s.classList.toggle("active", s === next));
      if (motion && next) {
        if (prev) G.to(prev, { autoAlpha: 0, y: -30, duration: 0.35, ease: "power2.in", overwrite: true });
        G.fromTo(next, { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 0.6, delay: prev ? 0.2 : 0, ease: "expo.out", overwrite: true });
      }
    }
  }
  if (protocol) {
    buildDial();
    protocol.classList.add("stacked");
    setDial(stepTimes[stepTimes.length - 1], steps.length - 1);
  }

  /* ------------------------------------------------------------------ */
  /* Quiz                                                                */
  /* ------------------------------------------------------------------ */
  const QUIZ = [
    { q: "How's your energy on most days?", a: [
      ["thyroid", "Tired all day, even after a full night's sleep"],
      ["hgh", "Wired at night, but I can't fall asleep"],
      ["igf", "Fine, but my body stays sore long after training"],
      ["testo", "Okay, but I lack drive and motivation"] ] },
    { q: "What do your evenings look like?", a: [
      ["hgh", "Screens and snacks until late, bed after midnight"],
      ["thyroid", "I'm often cold, slow and sluggish"],
      ["testo", "Stressed. My head won't switch off"],
      ["igf", "Pretty calm, but I sleep less than 8 hours"] ] },
    { q: "How is your training going?", a: [
      ["igf", "I train, but I barely see muscle progress"],
      ["hgh", "Mostly long, steady cardio sessions"],
      ["testo", "My strength has stalled for weeks"],
      ["thyroid", "I don't have the energy to train hard"] ] },
    { q: "Which sounds most like your diet?", a: [
      ["thyroid", "I eat very little or I'm always dieting"],
      ["hgh", "Lots of sugar, especially in the evening"],
      ["igf", "Honestly? Not much protein"],
      ["testo", "Low-fat. I skip eggs, meat and fish"] ] },
  ];
  const RESULTS = {
    thyroid: { name: "Thyroid", tag: "T3", c: "var(--thyroid)", cause: "Your metabolic engine may be in “conservation mode”. When T3 is low, your body responds poorly to every other hormone.", ch: "Priority: Chapter 1, iodine, selenium & T3 conversion" },
    hgh: { name: "Growth", tag: "hormone", c: "var(--hgh)", cause: "Your nightly growth-hormone pulse is probably being blocked by late insulin, light or poor deep sleep.", ch: "Priority: Chapter 2, sleep protocol, fasting & lactate training" },
    igf: { name: "IGF-1", tag: "the builder", c: "var(--igf)", cause: "The builder isn't getting enough raw material or stimulus: protein, heavy compound training and sleep.", ch: "Priority: Chapter 3, protein intake, liver support & heavy training" },
    testo: { name: "Testosterone", tag: "& cortisol", c: "var(--testo)", cause: "Your power supply looks held back by stress, a low-fat diet or high SHBG.", ch: "Priority: Chapter 4, fats, zinc, lowering SHBG & cortisol control" },
  };
  const quizBody = $("#quizBody");
  const quizStep = $("#quizStep");
  const quizBar = $("#quizBar");
  let qi = 0, scores = {};
  function swap(render) {
    if (!motion) { render(); return; }
    G.to(quizBody, { autoAlpha: 0, y: -16, duration: 0.25, ease: "power2.in", onComplete: () => {
      render();
      G.fromTo(quizBody, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out" });
    } });
  }
  function renderQ() {
    const item = QUIZ[qi];
    quizStep.textContent = `Question ${qi + 1} / ${QUIZ.length}`;
    quizBar.style.width = `${(qi / QUIZ.length) * 100}%`;
    quizBody.innerHTML = `<div class="quiz-q"><h3>${item.q}</h3><div class="quiz-options">${item.a.map(([k, t], i) =>
      `<button type="button" class="quiz-opt" data-k="${k}" data-key="${"ABCD"[i]}">${t}</button>`).join("")}</div></div>`;
    $$(".quiz-opt", quizBody).forEach((b) => b.addEventListener("click", () => {
      if (quizBody.dataset.lock) return;
      quizBody.dataset.lock = "1";
      b.classList.add("picked");
      scores[b.dataset.k] = (scores[b.dataset.k] || 0) + 1;
      setTimeout(() => {
        delete quizBody.dataset.lock;
        qi++;
        swap(qi < QUIZ.length ? renderQ : renderResult);
      }, 320);
    }));
  }
  function renderResult() {
    const order = ["hgh", "igf", "thyroid", "testo"];
    const key = order.reduce((best, k) => ((scores[k] || 0) > (scores[best] || 0) ? k : best), order[0]);
    const r = RESULTS[key];
    quizStep.textContent = "Your result";
    quizBar.style.width = "100%";
    quizBody.innerHTML = `<div class="quiz-result" style="--c:${r.c}">
      <div class="res-orb" aria-hidden="true"></div>
      <div class="res-kicker">Your focus hormone</div>
      <h3>${r.name} <span class="serif">${r.tag}</span></h3>
      <p>${r.cause}</p>
      <span class="tag res-chapter" style="--c:${r.c}">${r.ch}</span>
      <div class="res-actions">
        <a href="#pricing" class="btn btn-gold" data-buy>Get the course <span class="price-pill">${price}</span></a>
        <button type="button" class="btn btn-ghost" id="quizRetry">Retake quiz</button>
      </div></div>`;
    bindBuy($("[data-buy]", quizBody));
    $("#quizRetry").addEventListener("click", () => { qi = 0; scores = {}; swap(renderQ); });
  }
  if (quizBody) renderQ();

  /* ------------------------------------------------------------------ */
  /* Accordions (chapters + FAQ)                                         */
  /* ------------------------------------------------------------------ */
  $$("details").forEach((d) => {
    const summary = $("summary", d);
    const body = $(".ch-body", d);
    if (!summary || !body) return;
    summary.addEventListener("click", (e) => {
      if (!motion) return;
      e.preventDefault();
      if (d.open) {
        G.to(body, { height: 0, duration: 0.45, ease: "power3.inOut", onComplete: () => { d.open = false; body.style.height = ""; ST.refresh(); } });
      } else {
        d.open = true;
        G.fromTo(body, { height: 0 }, { height: "auto", duration: 0.6, ease: "expo.out", onComplete: () => { body.style.height = ""; ST.refresh(); } });
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /* Everything below needs GSAP + motion allowed                        */
  /* ------------------------------------------------------------------ */
  const loader = $("#loader");
  if (!motion) {
    if (loader) loader.remove();
    document.body.classList.remove("is-loading");
    $$(".count").forEach((c) => (c.textContent = c.dataset.to));
    $$(".molecule .bond").forEach((b) => (b.style.opacity = 1));
    return;
  }

  /* Hero initial states */
  const words = $$(".hero-title .word");
  const heroFades = $$("[data-hero-fade]");
  const bonds = $$(".molecule .bond");
  const atoms = $$(".molecule .atom, .molecule .mol-label");
  const chips = $$(".chip");
  G.set(words, { yPercent: 115, rotate: 4 });
  G.set(heroFades, { autoAlpha: 0, y: 26 });
  bonds.forEach((b) => { const L = b.getTotalLength(); b.style.strokeDasharray = L; b.style.strokeDashoffset = L; });
  G.set(atoms, { autoAlpha: 0, scale: 0, transformOrigin: "50% 50%" });
  G.set(chips, { autoAlpha: 0, y: 20, scale: 0.9 });
  G.set(".orbit, .orbit-glow, .molecule-label", { autoAlpha: 0, scale: 0.85 });

  /* Loader */
  const count = $("#loaderCount");
  const bar = $("#loaderBar");
  const loadState = { v: 0 };
  const intro = G.timeline({ paused: true });
  intro
    .to(".orbit, .orbit-glow", { autoAlpha: 1, scale: 1, duration: 1.6, stagger: 0.08, ease: "expo.out" }, 0)
    .to(words, { yPercent: 0, rotate: 0, duration: 1.2, stagger: 0.07, ease: "expo.out" }, 0.05)
    .to(heroFades, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: "expo.out" }, 0.45)
    .to(bonds, { strokeDashoffset: 0, duration: 0.9, stagger: 0.035, ease: "power2.inOut" }, 0.2)
    .to(atoms, { autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.02, ease: "back.out(3)" }, 0.9)
    .to(chips, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.1, ease: "back.out(1.8)" }, 1.0)
    .to(".molecule-label", { autoAlpha: 1, scale: 1, duration: 0.8 }, 1.3)
    .add(startHeroLoops, 1.6);

  G.timeline()
    .to(loadState, { v: 100, duration: 1.15, ease: "power2.inOut", onUpdate: () => {
      const v = Math.round(loadState.v);
      count.textContent = v + "%";
      bar.style.width = v + "%";
    } })
    .to(".loader-inner", { autoAlpha: 0, y: -20, duration: 0.4, ease: "power2.in" })
    .to(loader, { yPercent: -100, duration: 0.9, ease: "expo.inOut", onStart: () => intro.play() }, "-=0.05")
    .add(() => { loader.remove(); document.body.classList.remove("is-loading"); ST.refresh(); });

  function startHeroLoops() {
    // floating chips
    chips.forEach((c, i) => G.to(c, { y: i % 2 ? 10 : -10, duration: 2.6 + i * 0.4, repeat: -1, yoyo: true, ease: "sine.inOut" }));
    // molecule gentle float
    G.to("#molecule", { y: -8, rotate: -1.5, duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut" });
    // energy pulse running along random bonds
    const dot = $("#pulseDot");
    const run = () => {
      const b = bonds[(Math.random() * bonds.length) | 0];
      const L = b.getTotalLength();
      const s = { t: 0 };
      G.to(dot, { opacity: 1, duration: 0.15 });
      G.to(s, { t: 1, duration: 0.7, ease: "power1.inOut", onUpdate: () => {
        const p = b.getPointAtLength(s.t * L);
        dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y);
      }, onComplete: () => { G.to(dot, { opacity: 0, duration: 0.2 }); G.delayedCall(0.25 + Math.random() * 0.6, run); } });
    };
    run();
    // mouse parallax
    if (finePointer) {
      const vis = $("#heroVisual");
      const mx = G.quickTo("#molecule", "x", { duration: 1, ease: "power3.out" });
      const my = G.quickTo(".orbit-2", "x", { duration: 1.4, ease: "power3.out" });
      $("#hero").addEventListener("mousemove", (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        mx(nx * 24); my(nx * -14);
        vis.style.setProperty("--ny", (e.clientY / window.innerHeight - 0.5).toFixed(3));
      });
    }
  }

  /* Hero scroll-out */
  G.to(".hero-copy", { yPercent: -12, autoAlpha: 0.2, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
  G.to("#heroVisual", { yPercent: 18, scale: 0.92, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });

  /* Marquee with scroll velocity */
  const track = $("#marqueeTrack");
  if (track) {
    track.appendChild(track.firstElementChild.cloneNode(true));
    const loop = G.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
    let dir = 1;
    ST.create({
      trigger: ".marquee", start: "top bottom", end: "bottom top",
      onUpdate: (self) => {
        const v = self.getVelocity();
        if (v !== 0) dir = v > 0 ? 1 : -1;
        const boost = Math.min(5, 1 + Math.abs(v) / 400);
        G.to(loop, { timeScale: boost * dir, duration: 0.2, overwrite: true });
        G.to(loop, { timeScale: dir, duration: 1.2, delay: 0.2, ease: "power2.out" });
      },
    });
  }

  /* Manifesto word highlight */
  if (manifesto) {
    G.to($$(".w", manifesto), {
      opacity: 1, stagger: 0.1, ease: "none",
      scrollTrigger: { trigger: manifesto, start: "top 80%", end: "bottom 40%", scrub: true },
    });
  }

  /* Generic reveals */
  ST.batch("[data-reveal]", {
    start: "top 90%", once: true,
    onEnter: (batch) => G.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.09, ease: "expo.out", overwrite: "auto" }),
  });

  /* Pillar card tilt + spotlight */
  if (finePointer) {
    $$(".pillar").forEach((card) => {
      const rx = G.quickTo(card, "rotationX", { duration: 0.6, ease: "power3.out" });
      const ry = G.quickTo(card, "rotationY", { duration: 0.6, ease: "power3.out" });
      G.set(card, { transformPerspective: 1000 });
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
        ry((px - 0.5) * 10); rx((0.5 - py) * 8);
      });
      card.addEventListener("mouseleave", () => { rx(0); ry(0); });
    });
  }

  /* Chain line + counters */
  const mm = G.matchMedia();
  mm.add("(min-width: 761px)", () => {
    G.fromTo("#chainFill", { scaleX: 0, scaleY: 1 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".chain", start: "top 75%", end: "bottom 60%", scrub: true } });
  });
  mm.add("(max-width: 760px)", () => {
    G.fromTo("#chainFill", { scaleY: 0, scaleX: 1 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".chain-row", start: "top 75%", end: "bottom 60%", scrub: true } });
  });
  $$(".count").forEach((el) => {
    const to = parseFloat(el.dataset.to), o = { v: 0 };
    ST.create({ trigger: el, start: "top 90%", once: true, onEnter: () =>
      G.to(o, { v: to, duration: 2, ease: "expo.out", onUpdate: () => (el.textContent = Math.round(o.v)) }) });
  });

  /* Protocol: pinned scrubbed dial on large screens */
  mm.add("(min-width: 900px)", () => {
    protocol.classList.remove("stacked");
    activeStep = -1;
    G.set(steps, { autoAlpha: 0 });
    setDial(stepTimes[0], 0);
    const n = steps.length;
    const st = ST.create({
      trigger: "#protocolStage", start: "top top", end: () => "+=" + window.innerHeight * n * 0.6,
      pin: true, scrub: 0.6, anticipatePin: 1,
      onUpdate: (self) => {
        const f = self.progress * (n - 1);
        const i = Math.min(n - 2, Math.floor(f));
        const k = Math.min(1, f - i);
        const t = stepTimes[i] + (stepTimes[i + 1] - stepTimes[i]) * k;
        setDial(t, Math.round(f));
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
    const tw = G.to(o, { t: stepTimes[stepTimes.length - 1], duration: 3.2, ease: "power2.inOut", paused: true,
      onUpdate: () => {
        let idx = 0;
        stepTimes.forEach((st, i) => { if (o.t >= st - 0.01) idx = i; });
        setDial(o.t, idx);
      } });
    const st = ST.create({ trigger: ".dial-wrap", start: "top 75%", once: true, onEnter: () => tw.play(0) });
    return () => { st.kill(); tw.kill(); };
  });

  /* Course page preview fan */
  const pages = $$("#preview .page");
  if (pages.length) {
    const spread = () => (window.innerWidth < 600 ? 0.5 : window.innerWidth < 960 ? 0.8 : 1);
    const base = [
      { x: -86, r: -10, y: 22 }, { x: -30, r: -3.5, y: 4 }, { x: 30, r: 3.5, y: -2 }, { x: 88, r: 8.5, y: 16 },
    ];
    G.set(pages, { x: 0, rotation: (i) => [-4, 3, -2, 0][i], y: 30, autoAlpha: 0 });
    G.to(pages, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: "#preview", start: "top 85%", once: true } });
    G.to(pages, {
      x: (i) => base[i].x * spread(), rotation: (i) => base[i].r, y: (i) => base[i].y, ease: "none",
      scrollTrigger: { trigger: "#preview", start: "top 75%", end: "center 40%", scrub: 0.8, invalidateOnRefresh: true },
    });
  }

  /* Final section: subtle scale on the moon */
  G.fromTo(".final-moon", { scale: 0.7, autoAlpha: 0.3 }, { scale: 1.1, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: "#final", start: "top bottom", end: "bottom top", scrub: true } });

  /* Price card float-in */
  G.from(".price-amount .int, .price-amount .dec", { yPercent: 60, autoAlpha: 0, duration: 1.2, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: ".price-card", start: "top 75%", once: true } });

  window.addEventListener("load", () => ST.refresh());
})();
