/* =============================================================================
   Sana’s birthday scrapbook — behaviour.
   Words, names, captions and photo choices live in content.js, not here.
   ============================================================================= */
(function () {
  "use strict";

  const C = window.BIRTHDAY_CONTENT;
  const SVG = window.BIRTHDAY_ILLUSTRATIONS || {};
  if (!C) return;

  /* ---------------------------------------------------------------- helpers */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () => motionQuery.matches;
  const get = (path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), C);
  const fmt = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? "" : vars[k]));
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const isShown = (node) => !!node && node.getClientRects().length > 0;
  const scrollBehavior = () => (reduced() ? "auto" : "smooth");
  const TOTAL_SECRETS = (C.secrets && C.secrets.total) || 5;
  const SCREENS = ["opening", "gifts", "memories", "fun", "cake", "letter", "final"];
  /* keep a trailing emoji on the same line as the word before it */
  const glue = (s) => String(s).replace(/[ \t]+(?=\p{Extended_Pictographic})/gu, " ");

  /* Timers are tracked so Replay can cancel anything still pending. The
     finale keeps its own set so skipping it never cancels anything else. */
  const timers = new Set();
  function later(fn, ms) {
    const id = window.setTimeout(() => { timers.delete(id); fn(); }, reduced() ? 0 : ms);
    timers.add(id);
    return id;
  }
  const finalTimers = new Set();
  function laterFinal(fn, ms) { // keeps its timing even with reduced motion (the finale fades instead of moving)
    const id = window.setTimeout(() => { finalTimers.delete(id); fn(); }, ms);
    finalTimers.add(id);
    return id;
  }
  function clearFinalTimers() { finalTimers.forEach((id) => window.clearTimeout(id)); finalTimers.clear(); }
  function clearTimers() { timers.forEach((id) => window.clearTimeout(id)); timers.clear(); clearFinalTimers(); }
  /* Each screen change bumps `visit`, so a delayed step can tell whether
     she is still on the screen that started it. */
  let visit = 0;

  function announce(text) {
    const live = $("#announcer");
    live.textContent = "";
    window.setTimeout(() => { live.textContent = text; }, 60);
  }

  function freshState() {
    return {
      screen: "opening",
      opening: false,
      opened: false,
      visitedGifts: false,
      gifts: new Set(),
      quizDone: false,
      afterFun: null,
      candlesOut: new Set(),
      wished: false,
      letterOpened: false,
      finalPlayed: false,
      finalRunning: false,
      secrets: new Set(),
      bonusShown: false,
    };
  }
  let state = freshState();

  /* ------------------------------------------------------ content binding */
  function setPhoto(img, key) {
    const p = C.photos[key];
    if (!p) return;
    img.src = p.src;
    if (p.width && p.height) { img.width = p.width; img.height = p.height; }
    const decorative = !!img.closest('[aria-hidden="true"]');
    img.alt = decorative ? "" : p.alt || "";
  }
  function bindContent() {
    if (C.meta && C.meta.pageTitle) document.title = C.meta.pageTitle;
    $$("[data-c]").forEach((node) => {
      const v = get(node.dataset.c);
      if (typeof v === "string") node.textContent = glue(v);
    });
    $$("img[data-photo]").forEach((img) => setPhoto(img, get(img.dataset.photo)));
    $("#secrets-total").textContent = String(TOTAL_SECRETS);
  }

  /* Inline SVG illustrations. Ids are made unique per copy so two copies of
     the same drawing never share gradients (a hidden copy would break them). */
  let svgCopy = 0;
  function uniquifyIds(markup) {
    svgCopy += 1;
    const ids = [];
    markup.replace(/\sid="([^"]+)"/g, (_, id) => { ids.push(id); return ""; });
    let out = markup;
    ids.forEach((id) => {
      const safe = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const next = `${id}-c${svgCopy}`;
      out = out
        .replace(new RegExp(`id="${safe}"`, "g"), `id="${next}"`)
        .replace(new RegExp(`url\\(#${safe}\\)`, "g"), `url(#${next})`)
        .replace(new RegExp(`href="#${safe}"`, "g"), `href="#${next}"`);
    });
    return out;
  }
  function injectSvgs() {
    $$(".svg-slot[data-svg]").forEach((slot) => {
      const markup = SVG[slot.dataset.svg];
      if (!markup) return;
      slot.innerHTML = uniquifyIds(markup);
      const svg = slot.querySelector("svg");
      if (svg) { svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false"); }
    });
  }

  /* =========================================================== FX (canvas) */
  const fx = (function () {
    const canvas = $("#fx");
    const ctx = canvas.getContext("2d");
    const COLORS = ["#B3122E", "#D8475C", "#F4C9C9", "#E9A2A6", "#C9A04E", "#EBD49B", "#FBF5EA"];
    const STAR_COLORS = ["#EBD49B", "#FFE7A8", "#F4C9C9", "#FFFFFF"];
    let W = 0, H = 0, parts = [], raf = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = (arr) => arr[(Math.random() * arr.length) | 0];

    function starPath(r) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? r : r * 0.45;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
    }
    function heartPath(s) {
      ctx.beginPath();
      ctx.moveTo(0, s * 0.35);
      ctx.bezierCurveTo(-s, -s * 0.3, -s * 0.45, -s, 0, -s * 0.45);
      ctx.bezierCurveTo(s * 0.45, -s, s, -s * 0.3, 0, s * 0.35);
      ctx.closePath();
    }
    function step(p) {
      p.life += 1;
      if (p.kind === "star") {
        p.x += p.vx; p.y += p.vy; p.vx += Math.sin(p.life / 40 + p.seed) * 0.01;
        const t = p.life / p.max;
        p.alpha = Math.min(1, t * 6) * (1 - Math.max(0, (t - 0.7) / 0.3)) * (0.65 + 0.35 * Math.sin(p.life / 7 + p.seed));
      } else {
        p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag;
        p.x += p.vx + Math.sin(p.life / 12 + p.seed) * 0.6; p.y += p.vy;
        p.rot += p.vr;
        p.alpha = p.life > p.max - 40 ? Math.max(0, (p.max - p.life) / 40) : 1;
      }
      // stars start invisible and fade in, so only paper is culled by alpha
      return p.life < p.max && p.y < H + 40 && (p.kind === "star" || p.alpha > 0.01);
    }
    function draw(p) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.kind === "star") {
        ctx.shadowColor = "rgba(255,226,160,.9)"; ctx.shadowBlur = 8;
        starPath(p.size); ctx.fill();
      } else if (p.shape === "star") {
        starPath(p.w * 0.7); ctx.fill();
      } else if (p.shape === "heart") {
        heartPath(p.w * 0.75); ctx.fill();
      } else {
        ctx.scale(1, Math.cos(p.life / 6 + p.seed));
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    function loop() {
      ctx.clearRect(0, 0, W, H);
      parts = parts.filter(step);
      parts.forEach(draw);
      raf = parts.length ? window.requestAnimationFrame(loop) : 0;
    }
    function start() { if (!raf) raf = window.requestAnimationFrame(loop); }

    function confetti(opts) {
      if (reduced()) return;
      const o = Object.assign({ x: W / 2, y: H / 3, count: 70, spread: 1, power: 1 }, opts || {});
      for (let i = 0; i < o.count; i++) {
        const r = Math.random();
        parts.push({
          kind: "paper", shape: r < 0.16 ? "star" : r < 0.3 ? "heart" : "rect",
          x: o.x + rnd(-10, 10), y: o.y + rnd(-6, 6),
          vx: rnd(-7, 7) * o.spread, vy: rnd(-12, -4) * o.power,
          g: 0.22, drag: 0.985, rot: rnd(0, Math.PI * 2), vr: rnd(-0.2, 0.2),
          w: rnd(6, 11), h: rnd(4, 8), color: pick(COLORS),
          life: 0, max: rnd(150, 230), seed: rnd(0, 10), alpha: 1,
        });
      }
      start();
    }
    function rain(opts) {
      if (reduced()) return;
      const o = Object.assign({ count: 110, duration: 2200 }, opts || {});
      for (let i = 0; i < o.count; i++) {
        const r = Math.random();
        parts.push({
          kind: "paper", shape: r < 0.14 ? "star" : r < 0.26 ? "heart" : "rect",
          x: rnd(0, W), y: rnd(-H * 0.6, -10) - (i / o.count) * (o.duration / 8),
          vx: rnd(-1.2, 1.2), vy: rnd(1, 3),
          g: 0.035, drag: 0.995, rot: rnd(0, 6), vr: rnd(-0.08, 0.08),
          w: rnd(6, 10), h: rnd(4, 7), color: pick(COLORS),
          life: 0, max: 520, seed: rnd(0, 10), alpha: 1,
        });
      }
      start();
    }
    function stars(opts) {
      if (reduced()) return;
      const o = Object.assign({ count: 24 }, opts || {});
      for (let i = 0; i < o.count; i++) {
        parts.push({
          kind: "star",
          x: rnd(0, W), y: rnd(H * 0.35, H * 1.05),
          vx: rnd(0.15, 0.9) * (Math.random() < 0.5 ? -1 : 1), vy: rnd(-1.6, -0.6),
          rot: rnd(0, 1), vr: 0, size: rnd(3, 8), color: pick(STAR_COLORS),
          life: 0, max: rnd(150, 260), seed: rnd(0, 10), alpha: 0,
        });
      }
      start();
    }
    function fade() {
      parts.forEach((p) => { p.max = Math.min(p.max, p.life + 36); });
    }
    function stop() {
      parts = [];
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      ctx.clearRect(0, 0, W, H);
    }
    function attach(host) { if (canvas.parentNode !== host) host.appendChild(canvas); }
    function detach() { if (canvas.parentNode !== document.body) document.body.appendChild(canvas); }

    resize();
    window.addEventListener("resize", resize);
    return { confetti, rain, stars, fade, stop, attach, detach };
  })();

  function centerOf(node) {
    const r = node.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /* ============================================================ navigation */
  function go(name) {
    const target = name === "opening" ? "" : name;
    if (location.hash.slice(1) !== target) {
      location.hash = target; // hashchange → route()
    } else {
      route(name);
    }
  }
  function route(name) {
    if (!SCREENS.includes(name)) name = "opening";
    if (name !== "opening" && !state.opened) name = "opening";
    if ((name === "cake" || name === "letter") && !state.quizDone) {
      // a little fun before the emotional part: the quiz comes first, once
      state.afterFun = name;
      name = "fun";
      try { location.replace("#fun"); } catch (e) { /* ignore */ }
    }
    showScreen(name);
  }
  window.addEventListener("hashchange", () => route(location.hash.slice(1) || "opening"));

  function showScreen(name, opts) {
    const o = Object.assign({ focus: true }, opts || {});
    const prev = state.screen;
    const next = $(`#screen-${name}`);
    if (prev !== name) {
      visit += 1;
      onLeave(prev);
      fx.fade();
      const prevEl = $(`#screen-${prev}`);
      if (prevEl) prevEl.hidden = true;
    }
    next.hidden = false;
    state.screen = name;
    document.body.dataset.screen = name;
    window.scrollTo(0, 0);
    if (!reduced() && prev !== name) {
      next.classList.remove("is-entering");
      void next.offsetWidth;
      next.classList.add("is-entering");
      next.addEventListener("animationend", () => next.classList.remove("is-entering"), { once: true });
    }
    updateTopbar();
    onEnter(name, prev);
    if (o.focus && prev !== name) focusHeading(next);
  }
  function focusHeading(section) {
    const target = $("[tabindex='-1']:not([hidden])", section);
    if (target && isShown(target)) target.focus({ preventScroll: true });
  }
  function updateTopbar() {
    const s = state.screen;
    $("#nav-gifts").hidden = s === "gifts" || (s === "opening" && !state.visitedGifts);
    fitTopbar();
  }
  /* Hide words in the top bar in stages until it fits (narrow phones, big
     text settings). The words stay available to screen readers. */
  const TIGHT = ["is-tight-1", "is-tight-2", "is-tight-3"];
  function fitTopbar() {
    const bar = $("#topbar");
    const hint = $("#hint-btn");
    bar.classList.remove(...TIGHT);
    const limit = document.documentElement.clientWidth - 8;
    for (const c of TIGHT) {
      if (hint.getBoundingClientRect().right <= limit) break;
      bar.classList.add(c);
    }
  }
  function onEnter(name) {
    if (name === "gifts") enterGifts();
    if (name === "memories") markGiftOpened("memories");
    if (name === "fun") enterFun();
    if (name === "cake") enterCake();
    if (name === "letter") enterLetter();
    if (name === "final") enterFinal();
  }
  function onLeave(name) {
    if (name === "cake") document.body.classList.remove("is-candlelit");
    if (name === "letter") leaveLetter();
    if (name === "final") leaveFinal();
  }

  /* =============================================================== opening */
  function openEnvelope() {
    if (state.opened || state.opening) return;
    state.opening = true;
    const opening = $("#opening");
    const env = $("#envelope");
    $("#open-envelope").disabled = true;
    if (reduced()) { finishOpen(true); return; }
    opening.classList.add("is-opening");
    env.classList.add("is-unsealing");
    later(() => fx.stars({ count: 22 }), 300);
    later(() => env.classList.add("is-open"), 1050);
    later(() => finishOpen(false), 1950);
  }
  function finishOpen(instant) {
    const opening = $("#opening");
    const env = $("#envelope");
    const card = $("#reveal-card");
    const stage = $("#opening-stage");
    const smallCard = $("#envelope-card");
    const first = smallCard.getBoundingClientRect();
    const stageFirst = stage.getBoundingClientRect();

    opening.classList.remove("is-opening");
    opening.classList.add("is-open");
    env.classList.remove("is-unsealing");
    env.classList.add("is-open");
    $("#opening-title").hidden = true;
    $("#opening-below").hidden = true;
    $("#opening-cta").hidden = true;
    card.hidden = false;
    state.opened = true;
    state.opening = false;
    window.scrollTo(0, 0);
    preloadPhotos();

    const steps = $$(".reveal-step", card);
    steps.forEach((s, i) => s.style.setProperty("--i", String(i)));

    if (instant) {
      $("#reveal-title").focus({ preventScroll: true });
      return;
    }

    const last = card.getBoundingClientRect();
    const stageLast = stage.getBoundingClientRect();
    card.classList.add("is-revealing");
    card.animate(
      [
        { transformOrigin: "0 0", transform: `translate(${first.left - last.left}px, ${first.top - last.top}px) scale(${first.width / last.width}, ${first.height / last.height})` },
        { transformOrigin: "0 0", transform: "none" },
      ],
      { duration: 800, easing: "cubic-bezier(.22,.9,.3,1)" }
    );
    stage.animate(
      [
        { transformOrigin: "0 0", transform: `translate(${stageFirst.left - stageLast.left}px, ${stageFirst.top - stageLast.top}px) scale(${stageFirst.width / stageLast.width})` },
        { transformOrigin: "0 0", transform: "none" },
      ],
      { duration: 800, easing: "cubic-bezier(.22,.9,.3,1)" }
    );
    fx.stars({ count: 30 });
    later(() => card.classList.add("is-shown"), 160);
    later(() => $("#reveal-title").focus({ preventScroll: true }), 700);
    later(() => card.classList.remove("is-revealing", "is-shown"), 160 + steps.length * 260 + 900);
  }
  /* warm the cache while she reads the card, so the scrapbook never waits */
  let preloaded = false;
  function preloadPhotos() {
    if (preloaded) return;
    preloaded = true;
    Object.keys(C.photos).forEach((k, i) => {
      window.setTimeout(() => {
        const im = new Image();
        im.decoding = "async";
        im.src = C.photos[k].src;
      }, 400 + i * 120);
    });
  }
  function resetOpening() {
    const opening = $("#opening");
    const env = $("#envelope");
    const card = $("#reveal-card");
    opening.classList.remove("is-opening", "is-open");
    env.classList.remove("is-unsealing", "is-open");
    card.classList.remove("is-revealing", "is-shown");
    card.getAnimations().forEach((a) => a.cancel());
    $("#opening-stage").getAnimations().forEach((a) => a.cancel());
    card.hidden = true;
    $("#opening-title").hidden = false;
    $("#opening-below").hidden = false;
    $("#opening-cta").hidden = false;
    $("#open-envelope").disabled = false;
  }

  /* ================================================================= gifts */
  function initGifts() {
    $$(".gift").forEach((btn, i) => {
      btn.style.setProperty("--i", String(i));
      btn.parentElement.style.setProperty("--i", String(i));
      btn.addEventListener("click", () => openGift(btn));
    });
  }
  function enterGifts() {
    const first = !state.visitedGifts;
    state.visitedGifts = true;
    // a gift whose unwrap only led to the quiz goes back to being wrapped
    $$(".gift.is-unwrapping").forEach((g) => g.classList.remove("is-unwrapping"));
    updateTopbar();
    const list = $(".gifts");
    if (first && !reduced()) {
      list.classList.add("is-arriving");
      later(() => list.classList.remove("is-arriving"), 1400);
    }
  }
  function markGiftOpened(name) {
    state.gifts.add(name);
    const btn = $(`.gift[data-gift="${name}"]`);
    if (btn) btn.classList.add("is-opened");
  }
  function sparkleBurst(btn) {
    const host = $(".gift__sparkles", btn);
    host.innerHTML = "";
    for (let i = 0; i < 12; i++) {
      const s = el("i", null, i % 3 ? "✦" : "♥");
      const a = (Math.PI * 2 * i) / 12;
      const dist = 70 + Math.random() * 40;
      s.style.setProperty("--dx", `${Math.cos(a) * dist}px`);
      s.style.setProperty("--dy", `${Math.sin(a) * dist - 30}px`);
      s.style.color = i % 3 ? "var(--gold)" : "var(--cherry)";
      host.appendChild(s);
    }
    later(() => { host.innerHTML = ""; }, 1100);
  }
  function openGift(btn) {
    const target = btn.dataset.gift;
    if (btn.classList.contains("is-unwrapping")) return;
    if (state.gifts.has(target) || reduced()) {
      go(target); // each section marks its gift as opened when she actually arrives
      return;
    }
    btn.classList.add("is-unwrapping");
    sparkleBurst(btn);
    const c = centerOf($(".gift__art", btn));
    const v = visit;
    later(() => { if (v === visit) fx.confetti({ x: c.x, y: c.y - 20, count: 46, spread: 0.7, power: 0.85 }); }, 520);
    later(() => {
      if (v !== visit) { btn.classList.remove("is-unwrapping"); return; } // she already went elsewhere
      const detour = target !== "memories" && !state.quizDone;
      if (detour) { go(target); return; } // the quiz comes first; this gift stays wrapped for later
      btn.classList.remove("is-unwrapping");
      markGiftOpened(target);
      go(target);
    }, 1550);
  }

  /* ============================================================== memories */
  const TILTS = [-2.6, 1.8, -1.2, 2.6, -2.2, 1.2, -1.8, 2.2, -0.8];
  let polaroids = [];
  let photoGallery = [];
  let scrapCols = 0;

  function buildPolaroid(p, i) {
    const photo = C.photos[p.photo];
    const fig = $("#tpl-polaroid").content.firstElementChild.cloneNode(true);
    fig.style.setProperty("--tilt", `${TILTS[i % TILTS.length]}deg`);
    fig.dataset.ratio = photo && photo.width ? String(photo.height / photo.width) : "1.33";
    const img = $(".polaroid__img", fig);
    if (photo) {
      img.src = photo.src;
      img.alt = photo.alt || "";
      if (photo.width && photo.height) { img.width = photo.width; img.height = photo.height; }
    }
    $(".polaroid__caption", fig).textContent = glue(p.caption || "");
    const openBtn = $(".polaroid__open", fig);
    // the button is named "Enlarge photo:" + the photo's description (its alt text)
    $(".polaroid__open-label", fig).textContent = `${C.ui.enlarge}: `;
    fig._item = { type: "image", src: photo && photo.src, alt: (photo && photo.alt) || "", caption: glue(p.caption || ""), width: photo && photo.width, height: photo && photo.height };
    openBtn.addEventListener("click", () => lightbox.open(photoGallery, Math.max(0, photoGallery.indexOf(fig._item)), openBtn));

    const tape = $(".tape", fig);
    tape.src = i % 3 === 1 ? "assets/illustrations/washi-tape-gold.svg" : "assets/illustrations/washi-tape.svg";
    tape.style.setProperty("--tape-tilt", `${i % 2 ? 4 : -3}deg`);

    const front = $(".polaroid__face--front", fig);
    const back = $(".polaroid__face--back", fig);
    if (p.back) {
      fig.classList.add("has-back");
      $(".polaroid__back-text", fig).textContent = glue(p.back);
      back.setAttribute("aria-hidden", "true");
      const flip = el("button", "polaroid__flip");
      flip.type = "button";
      flip.setAttribute("aria-pressed", "false");
      flip.setAttribute("aria-label", `${C.ui.turnOver}: ${p.caption || ""}`);
      const icon = el("span", "polaroid__flip-icon", "↻");
      icon.setAttribute("aria-hidden", "true");
      const label = el("span", "polaroid__flip-label", C.ui.turnOver);
      label.setAttribute("aria-hidden", "true");
      flip.append(icon, label);
      flip.addEventListener("click", () => setFlipped(fig, !fig.classList.contains("is-flipped")));
      fig.appendChild(flip);
      fig._flip = { flip, label, front, back, openBtn, text: p.back, caption: p.caption || "" };
    } else {
      back.remove();
    }
    if (p.sticker) {
      const s = el("button", "secret secret--sticker");
      s.type = "button";
      s.dataset.secret = "2";
      const im = el("img");
      im.src = "assets/illustrations/sticker-heart.svg";
      im.alt = "";
      s.appendChild(im);
      fig.appendChild(s);
    }
    return fig;
  }
  function setFlipped(fig, flipped) {
    const f = fig._flip;
    if (!f) return;
    fig.classList.toggle("is-flipped", flipped);
    f.flip.setAttribute("aria-pressed", String(flipped));
    f.label.textContent = flipped ? C.ui.turnBack : C.ui.turnOver; // the name stays put; aria-pressed carries the state
    f.back.setAttribute("aria-hidden", String(!flipped));
    f.front.setAttribute("aria-hidden", String(flipped));
    f.openBtn.tabIndex = flipped ? -1 : 0;
    if (flipped) announce(f.text);
  }
  function buildScrapbook() {
    polaroids = C.memories.polaroids.map(buildPolaroid);
    layoutScrapbook(true);
    window.matchMedia("(min-width: 761px)").addEventListener("change", () => layoutScrapbook(false));
  }
  function layoutScrapbook(force) {
    const n = window.matchMedia("(min-width: 761px)").matches ? 3 : 2;
    if (!force && n === scrapCols) return;
    scrapCols = n;
    const book = $("#scrapbook");
    const restore = book.contains(document.activeElement) ? document.activeElement : null;
    const cols = Array.from({ length: n }, () => el("div", "scrapbook__col"));
    const heights = new Array(n).fill(0);
    heights[1] = 0.35; // the middle column starts a little lower
    polaroids.forEach((fig) => {
      let k = 0;
      for (let j = 1; j < n; j++) if (heights[j] < heights[k] - 0.05) k = j;
      cols[k].appendChild(fig);
      heights[k] += parseFloat(fig.dataset.ratio || "1.33") + 0.35;
    });
    book.replaceChildren(...cols);
    // Previous/Next in the lightbox follows the same order as Tab does
    photoGallery = $$(".polaroid--scrap", book).map((f) => f._item);
    if (restore) restore.focus({ preventScroll: true });
  }

  /* video reel */
  let videoGallery = [];
  function buildReel() {
    const videos = (C.videos || []).filter((v) => v && v.src);
    if (!videos.length) { $("#reel").hidden = true; return; }
    const strip = $("#reel-strip");
    videoGallery = videos.map((v) => ({ type: "video", src: v.src, poster: v.poster, caption: glue(v.caption || ""), width: v.width, height: v.height }));
    videos.forEach((v, i) => {
      const item = el("div");
      item.setAttribute("role", "listitem");
      const b = el("button", "clip");
      b.type = "button";
      b.setAttribute("aria-label", `${C.ui.playClip}: ${v.caption || ""}`);
      // the thumbnail's own shape decides the clip's width (see .clip in styles.css)
      const pw = v.posterWidth || v.width, ph = v.posterHeight || v.height;
      if (pw && ph) b.style.setProperty("--ar", (pw / ph).toFixed(4));
      const frame = el("span", "clip__frame");
      const img = el("img");
      img.src = v.poster || "";
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      if (pw && ph) { img.width = pw; img.height = ph; }
      frame.append(img, el("span", "clip__play"));
      const cap = el("span", "clip__caption", glue(v.caption || ""));
      b.append(frame, cap);
      b.addEventListener("click", () => lightbox.open(videoGallery, i, b));
      item.appendChild(b);
      strip.appendChild(item);
    });
  }

  /* ============================================================== lightbox */
  const lightbox = (function () {
    const dlg = $("#lightbox");
    const media = $("#lightbox-media");
    const caption = $("#lightbox-caption");
    const count = $("#lightbox-count");
    const prevBtn = $("#lightbox-prev");
    const nextBtn = $("#lightbox-next");
    const fig = $(".lightbox__polaroid", dlg);
    const status = $("#lightbox-status");
    let list = [], index = 0, trigger = null, touchX = null, openedAt = 0;

    /* stop and release a clip completely, so it stops downloading too */
    const unloadVideos = () => media.querySelectorAll("video").forEach((v) => {
      v.pause();
      v.removeAttribute("src");
      v.load();
    });
    function render(dir) {
      const item = list[index];
      const hadFocus = media.contains(document.activeElement);
      unloadVideos();
      media.replaceChildren();
      let focusable = null;
      if (item.type === "video") {
        const v = el("video");
        v.src = item.src;
        if (item.poster) v.poster = item.poster;
        v.controls = true;
        v.playsInline = true;
        v.setAttribute("playsinline", "");
        v.setAttribute("aria-label", item.caption || C.ui.playClip);
        v.preload = "auto";
        if (item.width && item.height) { v.width = item.width; v.height = item.height; }
        media.appendChild(v);
        focusable = v;
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      } else {
        const img = el("img");
        img.src = item.src;
        img.alt = item.alt || "";
        if (item.width && item.height) { img.width = item.width; img.height = item.height; }
        media.appendChild(img);
      }
      caption.textContent = item.caption || "";
      count.textContent = list.length > 1 ? `${index + 1} / ${list.length}` : "";
      status.textContent = list.length > 1 ? `${index + 1} of ${list.length}: ${item.caption || ""}` : item.caption || "";
      prevBtn.hidden = nextBtn.hidden = list.length < 2;
      if (hadFocus) (focusable || nextBtn).focus({ preventScroll: true });
      if (dir && !reduced()) {
        fig.style.setProperty("--swap-from", dir > 0 ? "28px" : "-28px");
        fig.classList.remove("is-swapping");
        void fig.offsetWidth;
        fig.classList.add("is-swapping");
      }
    }
    function open(items, i, from) {
      list = items; index = i; trigger = from || null;
      render(0);
      if (!dlg.open) { dlg.showModal(); openedAt = performance.now(); }
      $("#lightbox-close").focus();
    }
    function move(d) {
      if (list.length < 2) return;
      index = (index + d + list.length) % list.length;
      render(d);
    }
    function close() { if (dlg.open) dlg.close(); }
    prevBtn.addEventListener("click", () => move(-1));
    nextBtn.addEventListener("click", () => move(1));
    $("#lightbox-close").addEventListener("click", close);
    dlg.addEventListener("click", (e) => {
      // the second tap of a double-tap must not close what the first tap opened
      if (performance.now() - openedAt < 400) return;
      if (e.target === dlg || e.target.classList.contains("lightbox__frame")) close();
    });
    dlg.addEventListener("keydown", (e) => {
      if (e.target.closest && e.target.closest("video")) return; // arrows seek inside a playing clip
      if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
    });
    dlg.addEventListener("touchstart", (e) => { touchX = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
    dlg.addEventListener("touchend", (e) => {
      if (touchX == null || e.target.closest("video")) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1);
      touchX = null;
    });
    dlg.addEventListener("close", () => {
      unloadVideos();
      media.replaceChildren();
      status.textContent = "";
      if (trigger && isShown(trigger)) trigger.focus({ preventScroll: true });
      trigger = null;
    });
    return { open, close };
  })();

  /* =================================================================== fun */
  function initFun() {
    $$(".answer").forEach((btn) => btn.addEventListener("click", () => answer(btn)));
    $("#fun-continue").addEventListener("click", () => {
      const target = state.afterFun || (state.wished ? "letter" : "cake");
      state.afterFun = null;
      go(target);
    });
  }
  function answer(btn) {
    const yes = btn.dataset.answer === "yes";
    $$(".answer").forEach((b) => b.classList.toggle("is-chosen", b === btn));
    const res = $("#quiz-response");
    res.textContent = glue(yes ? C.fun.responseYes : C.fun.responseThink);
    res.classList.remove("is-popping");
    void res.offsetWidth;
    res.classList.add("is-popping");
    if (yes) {
      const c = centerOf(btn);
      fx.confetti({ x: c.x, y: c.y, count: 36, spread: 0.6, power: 0.7 });
    }
    if (!state.quizDone) {
      state.quizDone = true;
      const v = visit;
      later(() => { if (v === visit) showCertificate(); }, 2000);
    }
  }
  function setContinueLabel() {
    const target = state.afterFun || (state.wished ? "letter" : "cake");
    $("#fun-continue").textContent = glue(target === "letter" ? C.fun.continueLetter : C.fun.continue);
  }
  function showCertificate() {
    const wrap = $("#certificate-wrap");
    setContinueLabel();
    wrap.hidden = false;
    if (reduced()) { $("#certificate-title").focus({ preventScroll: false }); return; }
    wrap.classList.add("is-arriving");
    // scroll so the punchline stays just below the top bar, with the certificate under it
    const res = $("#quiz-response");
    const y = res.getBoundingClientRect().top + window.scrollY - ($("#topbar").offsetHeight + 12);
    window.scrollTo({ top: Math.max(0, y), behavior: scrollBehavior() });
    const v = visit;
    later(() => {
      if (v !== visit) return;
      const c = centerOf($(".secret--stamp", wrap));
      fx.confetti({ x: c.x, y: c.y, count: 60, spread: 0.9, power: 0.9 });
    }, 1250);
    later(() => { if (v === visit) $("#certificate-title").focus({ preventScroll: true }); }, 900);
    later(() => wrap.classList.remove("is-arriving"), 2200);
  }
  function enterFun() {
    if (state.quizDone) {
      $("#certificate-wrap").hidden = false;
      setContinueLabel();
    }
  }
  function resetFun() {
    $$(".answer").forEach((b) => b.classList.remove("is-chosen"));
    const res = $("#quiz-response");
    res.textContent = "";
    res.classList.remove("is-popping");
    const wrap = $("#certificate-wrap");
    wrap.hidden = true;
    wrap.classList.remove("is-arriving");
  }

  /* ================================================================== cake */
  function initCake() {
    $$("#cake .smoke").forEach((p) => p.setAttribute("pathLength", "100"));
    $$(".candle-btn").forEach((btn) => {
      const n = Number(btn.dataset.candle);
      btn.setAttribute("aria-label", `Blow out candle ${n + 1}`);
      btn.addEventListener("click", () => blowCandle(n));
    });
    $("#blow-candles").addEventListener("click", blowAll);
  }
  function candleGroup(n) { return $(`#cake .candle[data-candle="${n}"]`); }
  /* candles use aria-disabled rather than disabled, so keyboard focus never drops to the page */
  function blowCandle(n) {
    if (state.candlesOut.has(n) || state.wished) return;
    state.candlesOut.add(n);
    const g = candleGroup(n);
    if (g) g.classList.add("is-out");
    const btn = $(`.candle-btn[data-candle="${n}"]`);
    if (btn) { btn.setAttribute("aria-disabled", "true"); btn.setAttribute("aria-label", `Candle ${n + 1} is out`); }
    if (state.candlesOut.size >= 4) {
      $("#blow-candles").setAttribute("aria-disabled", "true");
      later(finishWish, 900);
    }
  }
  function blowAll() {
    const b = $("#blow-candles");
    if (b.getAttribute("aria-disabled") === "true") return;
    b.setAttribute("aria-disabled", "true");
    const remaining = [0, 1, 2, 3].filter((n) => !state.candlesOut.has(n));
    remaining.forEach((n, k) => later(() => blowCandle(n), k * 150));
  }
  function finishWish() {
    if (state.wished) return;
    state.wished = true;
    document.body.classList.remove("is-candlelit");
    $("#cake-actions").hidden = true;
    $(".cake-scene").classList.add("is-wished");
    const wish = $("#wish");
    wish.hidden = false;
    if (state.screen !== "cake") return; // she left before the last candle went out: no fanfare off-screen
    if (!reduced()) wish.classList.add("is-arriving");
    fx.rain({ count: 120 });
    const cake = centerOf($("#cake"));
    fx.confetti({ x: cake.x, y: cake.y - 60, count: 50, spread: 0.8, power: 0.8 });
    const v = visit;
    later(() => {
      if (v !== visit) return;
      wish.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
      $("#wish-text").focus({ preventScroll: true }); // focus reads the wish to screen readers
    }, 350);
  }
  function enterCake() {
    markGiftOpened("cake");
    if (!state.wished) document.body.classList.add("is-candlelit");
  }
  function resetCake() {
    state.candlesOut = new Set();
    $$("#cake .candle").forEach((g) => g.classList.remove("is-out"));
    $$(".candle-btn").forEach((b) => {
      b.removeAttribute("aria-disabled");
      b.setAttribute("aria-label", `Blow out candle ${Number(b.dataset.candle) + 1}`);
    });
    $("#blow-candles").removeAttribute("aria-disabled");
    $("#cake-actions").hidden = false;
    $(".cake-scene").classList.remove("is-wished");
    const wish = $("#wish");
    wish.hidden = true;
    wish.classList.remove("is-arriving");
  }

  /* ================================================================ letter */
  function buildLetter() {
    const body = $("#letter-body");
    const paras = C.letter.paragraphs || [];
    paras.forEach((t, i) => {
      const p = el("p", null, glue(t));
      if (i === 0) p.classList.add("is-greeting");
      else if (i === paras.length - 1) p.classList.add("is-closing");
      else if (C.dialogue && t.indexOf(C.dialogue) !== -1) p.classList.add("is-aside");
      body.appendChild(p);
    });
  }
  const letterParts = () => [$("#letter-layout"), $(".letter-seal"), $(".letter-end")];
  function enterLetter() {
    markGiftOpened("letter");
    const scene = $("#letter-scene");
    const env = $("#letter-envelope");
    if (state.letterOpened || reduced()) {
      state.letterOpened = true;
      env.hidden = true;
      letterParts().forEach((n) => { n.hidden = false; });
      return;
    }
    env.hidden = false;
    letterParts().forEach((n) => { n.hidden = true; });
    scene.classList.remove("is-opening", "is-unfolding");
    const v = visit;
    later(() => { if (v === visit) scene.classList.add("is-opening"); }, 450);
    later(() => {
      if (v !== visit) return;
      scene.classList.remove("is-opening");
      env.hidden = true;
      letterParts().forEach((n) => { n.hidden = false; });
      scene.classList.add("is-unfolding");
      state.letterOpened = true;
      window.scrollTo(0, 0);
      $("#letter-title").focus({ preventScroll: true });
      later(() => scene.classList.remove("is-unfolding"), 1200);
    }, 2150);
  }
  /* leaving before the envelope finished opening re-arms it for next time */
  function leaveLetter() {
    if (!state.letterOpened) resetLetter();
  }
  function resetLetter() {
    const scene = $("#letter-scene");
    scene.classList.remove("is-opening", "is-unfolding");
    $("#letter-envelope").hidden = false;
    letterParts().forEach((n) => { n.hidden = true; });
  }

  /* ================================================================= final */
  function garlandRows(count) {
    const wide = window.matchMedia("(min-width: 700px)").matches;
    if (wide) return count > 5 ? [Math.ceil(count / 2), Math.floor(count / 2)] : [count];
    const rows = [];
    let left = count;
    while (left > 0) { rows.push(Math.min(3, left)); left -= 3; }
    return rows;
  }
  function buildGarlandRow(keys, rowIndex) {
    const row = el("div", "garland");
    const n = keys.length;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "garland__string");
    svg.setAttribute("viewBox", "0 0 100 60");
    svg.setAttribute("preserveAspectRatio", "none");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M0 8 Q50 58 100 8");
    svg.appendChild(path);
    row.appendChild(svg);
    const curve = (t) => (8 + 100 * t * (1 - t)) / 60; // fraction of the 52px string box
    const bulbs = n * 3 + 1;
    for (let b = 0; b < bulbs; b++) {
      const t = (b + 0.5) / bulbs;
      const bulb = el("span", "garland__bulb");
      bulb.style.left = `${t * 100}%`;
      bulb.style.top = `calc(${curve(t)} * 52px)`;
      bulb.style.setProperty("--i", String(b + rowIndex * 7));
      row.appendChild(bulb);
    }
    keys.forEach((key, i) => {
      const t = (i + 0.5) / n;
      const wrap = el("div", "garland__photo");
      wrap.style.left = `${t * 100}%`;
      wrap.style.top = `calc(${curve(t)} * 52px - 2px)`;
      const pol = el("div", "polaroid");
      pol.style.setProperty("--tilt", `${(i % 2 ? 1 : -1) * (2 + (i % 3))}deg`);
      const img = el("img", "polaroid__img");
      const ph = C.photos[key];
      if (ph) {
        img.src = ph.src;
        if (ph.width && ph.height) {
          img.width = ph.width; img.height = ph.height;
          wrap.style.setProperty("--ratio", (ph.height / ph.width).toFixed(3));
        }
      }
      img.alt = "";
      img.loading = "lazy";
      pol.appendChild(img);
      wrap.appendChild(pol);
      row.appendChild(wrap);
    });
    return row;
  }
  let garlandLayout = "";
  function buildGarlands(force) {
    const keys = (C.final.photos || []).filter((k) => C.photos[k]);
    const rows = garlandRows(keys.length);
    const sig = rows.join(",");
    if (!force && sig === garlandLayout) return;
    garlandLayout = sig;
    const a = $("#garland-a");
    const b = $("#garland-b");
    a.replaceChildren();
    b.replaceChildren();
    let idx = 0;
    rows.forEach((size, r) => {
      const row = buildGarlandRow(keys.slice(idx, idx + size), r);
      idx += size;
      (r === 0 ? a : b).appendChild(row);
    });
    if (state.screen === "final") {
      // rebuilt mid-finale (e.g. a tablet was rotated): keep what was already showing visible
      if (state.finalPlayed) showFinalNow();
      else {
        $$("#garland-a .garland__photo").forEach((p) => p.classList.add("is-hung"));
        if (b.classList.contains("is-shown")) $$("#garland-b .garland__photo").forEach((p) => p.classList.add("is-hung"));
      }
    }
  }
  function buildFinal() {
    const host = $("#final-lines");
    (C.final.lines || []).forEach((t, i, arr) => {
      const p = el("p", "final__line", glue(t));
      if (i === arr.length - 1) p.classList.add("is-family");
      host.appendChild(p);
    });
    buildGarlands(true);
    window.matchMedia("(min-width: 700px)").addEventListener("change", () => buildGarlands(false));
    // a tap anywhere (or Escape / Enter / Space) skips to the end of the finale
    $("#screen-final").addEventListener("click", (e) => {
      if (state.finalRunning && !e.target.closest("button")) skipFinal();
    });
    document.addEventListener("keydown", (e) => {
      if (state.screen !== "final" || !state.finalRunning || document.querySelector("dialog[open]")) return;
      if (e.key === "Escape" || ((e.key === "Enter" || e.key === " ") && !e.target.closest("button, a"))) {
        e.preventDefault();
        skipFinal();
      }
    });
  }
  function hang(photos, startMs) {
    photos.forEach((p, i) => laterFinal(() => p.classList.add("is-hung"), startMs + i * 170));
  }
  function revealNear(node) {
    const r = node.getBoundingClientRect();
    if (r.bottom > window.innerHeight - 24) node.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
  }
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  function setDusk(on) {
    document.body.classList.toggle("is-dusk", on);
    if (themeMeta) themeMeta.setAttribute("content", on ? "#2A1612" : "#F6ECDA");
  }
  function showFinalNow() {
    $$("#screen-final .garland__photo").forEach((p) => p.classList.add("is-hung"));
    $$(".final__line").forEach((l) => l.classList.add("is-shown"));
    ["#final-wish", "#final-bubble", "#final-actions", "#garland-b"].forEach((s) => $(s).classList.add("is-shown"));
  }
  /* The finale keeps its pacing even with reduced motion: there it fades
     line by line instead of moving. */
  function enterFinal() {
    setDusk(true);
    if (state.finalPlayed) {
      showFinalNow();
      return;
    }
    state.finalRunning = true;
    hang($$("#garland-a .garland__photo"), 500);
    const lines = $$(".final__line");
    const start = 1500, gap = 1500;
    lines.forEach((l, i) => laterFinal(() => { l.classList.add("is-shown"); revealNear(l); }, start + i * gap));
    const afterLines = start + lines.length * gap + 500;
    laterFinal(() => { $("#final-wish").classList.add("is-shown"); revealNear($("#final-wish")); }, afterLines);
    laterFinal(() => { // after a short pause, the joke
      const bubble = $("#final-bubble");
      bubble.classList.add("is-shown");
      revealNear(bubble);
      fx.stars({ count: 36 });
      fx.rain({ count: 140 });
    }, afterLines + 2400);
    laterFinal(() => { // the second string of photos, where she can see it hang
      const gb = $("#garland-b");
      gb.classList.add("is-shown");
      revealNear(gb);
      hang($$("#garland-b .garland__photo"), 200);
    }, afterLines + 3800);
    laterFinal(() => {
      const actions = $("#final-actions");
      actions.classList.add("is-shown");
      actions.scrollIntoView({ behavior: scrollBehavior(), block: "end" });
      state.finalRunning = false;
      state.finalPlayed = true;
    }, afterLines + 5600);
  }
  function skipFinal() {
    clearFinalTimers();
    showFinalNow();
    state.finalRunning = false;
    state.finalPlayed = true;
  }
  function leaveFinal() {
    setDusk(false);
    if (state.finalRunning) skipFinal();
  }
  function resetFinal() {
    setDusk(false);
    $$("#screen-final .garland__photo").forEach((p) => p.classList.remove("is-hung"));
    $$(".final__line").forEach((l) => l.classList.remove("is-shown"));
    ["#final-wish", "#final-bubble", "#final-actions", "#garland-b"].forEach((s) => $(s).classList.remove("is-shown"));
  }

  /* =============================================================== secrets */
  const secretById = (id) => C.secrets.items.find((s) => s.id === id);
  let noteTrigger = null;

  function initSecrets() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".secret[data-secret]");
      if (!btn) return;
      e.preventDefault();
      findSecret(Number(btn.dataset.secret), btn);
    });
    refreshSecretLabels();
  }
  function refreshSecretLabels() {
    $$(".secret[data-secret]").forEach((btn) => {
      const s = secretById(Number(btn.dataset.secret));
      if (!s) return;
      const found = state.secrets.has(s.id);
      btn.classList.toggle("is-found", found);
      btn.setAttribute("aria-label", found ? `Read hidden note ${s.id} again (${s.label})` : `Hidden note: ${s.label}`);
    });
    $("#secrets-count").textContent = String(state.secrets.size);
  }
  function findSecret(id, trigger) {
    const s = secretById(id);
    if (!s) return;
    const isNew = !state.secrets.has(id);
    if (isNew) {
      state.secrets.add(id);
      refreshSecretLabels();
      const tag = $("#secrets-tag");
      tag.classList.remove("is-bumped");
      void tag.offsetWidth;
      tag.classList.add("is-bumped");
    }
    openNote(s, trigger, isNew);
  }
  /* Open a dialog at its top, with focus on its first words so screen
     readers read the note itself. */
  function openDialog(dlg, trigger, focusTarget) {
    dlg._trigger = trigger || document.activeElement;
    if (!dlg.open) dlg.showModal();
    dlg._openedAt = performance.now();
    dlg.scrollTop = 0;
    if (focusTarget) focusTarget.focus({ preventScroll: true });
  }
  function openNote(s, trigger, celebrate) {
    const dlg = $("#note-dialog");
    $("#note-label").textContent = fmt(C.secrets.noteLabel, { n: s.id });
    const img = $("#note-photo");
    const fig = img.closest("figure");
    if (s.photo && C.photos[s.photo]) { setPhoto(img, s.photo); fig.hidden = false; } else { fig.hidden = true; }
    $("#note-text").textContent = glue(s.note);
    noteTrigger = trigger || null;
    openDialog(dlg, trigger, $("#note-text"));
    if (celebrate) {
      fx.attach(dlg);
      later(() => fx.confetti({ x: window.innerWidth / 2, y: window.innerHeight * 0.3, count: 40, spread: 0.8, power: 0.7 }), 380);
    }
  }
  function openBonus(trigger) {
    const dlg = $("#bonus-dialog");
    const host = $("#bonus-lines");
    host.replaceChildren(...C.secrets.bonus.lines.map((t, i) => {
      const p = el("p", null, glue(t));
      p.id = `bonus-line-${i}`;
      return p;
    }));
    dlg.setAttribute("aria-describedby", C.secrets.bonus.lines.slice(1).map((_, i) => `bonus-line-${i + 1}`).join(" "));
    openDialog(dlg, trigger || $("#hint-btn"), host);
    fx.attach(dlg);
    later(() => { fx.rain({ count: 120 }); fx.stars({ count: 20 }); }, 400);
  }
  /* what (if anything) has to happen before a secret can be reached */
  function secretLock(s) {
    if (!state.opened && s.where !== "opening") return "open";
    if (!state.quizDone && ["fun", "cake", "letter"].includes(s.where)) return "quiz";
    return "";
  }
  function openHints(trigger) {
    const dlg = $("#hints-dialog");
    const found = state.secrets.size;
    $("#hints-intro").textContent = found >= TOTAL_SECRETS ? C.secrets.hintsAllFound : fmt(C.secrets.hintsIntro, { found });
    const list = $("#hints-list");
    list.replaceChildren();
    C.secrets.items.forEach((s) => {
      const isFound = state.secrets.has(s.id);
      const lock = isFound ? "" : secretLock(s);
      const li = el("li", `hint${isFound ? " is-found" : ""}`);
      const mark = el("span", "hint__mark", isFound ? "✓" : "✦");
      mark.setAttribute("aria-hidden", "true");
      const lockText = lock === "open" ? C.secrets.lockedOpen : lock === "quiz" ? C.secrets.lockedQuiz : "";
      const text = el("p", "hint__text", glue(lockText ? `${lockText} ${s.hint}` : s.hint));
      const status = el("span", "sr-only", isFound ? " (found)" : " (not found yet)");
      text.appendChild(status);
      const label = isFound ? C.secrets.readAgain
        : lock === "open" ? C.secrets.takeMeToEnvelope
        : lock === "quiz" ? C.secrets.takeMeToQuestion
        : C.secrets.takeMeThere;
      const action = el("button", "hint__action", label);
      action.type = "button";
      action.setAttribute("aria-label", `${label}: ${s.label}`);
      action.addEventListener("click", () => {
        dlg.close();
        if (isFound) openNote(s, $("#hint-btn"), false);
        else takeMeThere(s, lock);
      });
      li.append(mark, text, action);
      list.appendChild(li);
    });
    $("#hints-bonus").hidden = found < TOTAL_SECRETS;
    openDialog(dlg, trigger, $("#hints-intro"));
  }
  function highlight(btn) {
    btn.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
    btn.classList.remove("is-highlighted");
    void btn.offsetWidth;
    btn.classList.add("is-highlighted");
    btn.focus({ preventScroll: true });
    later(() => btn.classList.remove("is-highlighted"), 3200);
  }
  function takeMeThere(s, lock) {
    if (lock === "open") { // the envelope comes first
      go("opening");
      later(() => highlight($("#open-envelope")), 350);
      return;
    }
    go(lock === "quiz" ? "fun" : s.where);
    if (lock === "quiz") return; // the question is right at the top of that screen
    const wait = s.where === "letter" && !state.letterOpened ? 2500 : 650;
    later(() => {
      // (navigation happens via the hash, after this call, so check visibility rather than `visit`)
      const btn = $(`.secret[data-secret="${s.id}"]`);
      if (btn && isShown(btn) && state.screen === s.where) highlight(btn);
    }, wait);
  }
  function resetSecrets() {
    state.secrets = new Set();
    state.bonusShown = false;
    refreshSecretLabels();
  }

  /* dialogs: shared close behaviour */
  function initDialogs() {
    $$("dialog").forEach((dlg) => {
      $$("[data-close]", dlg).forEach((b) => b.addEventListener("click", () => dlg.close()));
      if (dlg.id !== "lightbox") {
        dlg.addEventListener("click", (e) => {
          // a tap outside the card closes it, but not the second tap of a double-tap
          if (e.target === dlg && performance.now() - (dlg._openedAt || 0) >= 400) dlg.close();
        });
      }
      dlg.addEventListener("close", () => {
        fx.detach();
        const t = dlg._trigger;
        dlg._trigger = null;
        if (dlg.id === "note-dialog" && state.secrets.size >= TOTAL_SECRETS && !state.bonusShown) {
          state.bonusShown = true;
          later(() => openBonus(t), 250); // afterwards focus returns to the secret that finished the set
          return;
        }
        if (t && isShown(t) && dlg.id !== "lightbox") t.focus({ preventScroll: true });
      });
    });
    $("#hint-btn").addEventListener("click", (e) => openHints(e.currentTarget));
    $("#hints-bonus").addEventListener("click", () => {
      $("#hints-dialog").close();
      later(() => openBonus(), 150);
    });
  }
  function closeAllDialogs() {
    $$("dialog").forEach((d) => { if (d.open) { d._trigger = null; d.close(); } });
  }

  /* ================================================================= music */
  function initMusic() {
    const src = C.music && C.music.src;
    if (!src) return;
    const box = $("#music");
    const toggle = $("#music-toggle");
    const mute = $("#music-mute");
    const label = $("#music-label");
    const audio = new Audio();
    audio.loop = true;
    audio.preload = "metadata";
    audio.volume = 0.55;
    const paint = () => {
      const playing = !audio.paused;
      label.textContent = playing ? C.ui.musicPause : C.ui.musicPlay;
      toggle.setAttribute("aria-pressed", String(playing));
      mute.hidden = !playing && !audio.muted;
      $("#music-mute-icon").textContent = audio.muted ? "🔇" : "🔊";
      $("#music-mute-label").textContent = audio.muted ? C.ui.unmute : C.ui.mute;
      mute.setAttribute("aria-pressed", String(audio.muted));
    };
    audio.addEventListener("loadedmetadata", () => { box.hidden = false; paint(); }, { once: true });
    audio.addEventListener("error", () => { box.hidden = true; }, { once: true });
    audio.addEventListener("play", paint);
    audio.addEventListener("pause", paint);
    toggle.addEventListener("click", () => {
      if (audio.paused) { const p = audio.play(); if (p && p.catch) p.catch(() => {}); } else audio.pause();
    });
    mute.addEventListener("click", () => { audio.muted = !audio.muted; paint(); });
    audio.src = src;
  }

  /* ================================================================ replay */
  function replay() {
    clearTimers();
    fx.stop();
    closeAllDialogs();
    document.body.classList.remove("is-candlelit", "is-dusk");
    resetOpening();
    resetFun();
    resetCake();
    resetLetter();
    resetFinal();
    polaroids.forEach((fig) => setFlipped(fig, false));
    $$(".gift").forEach((g) => g.classList.remove("is-opened", "is-unwrapping"));
    state = freshState();
    resetSecrets();
    state.screen = SCREENS.find((s) => !$(`#screen-${s}`).hidden) || "opening";
    go("opening");
    showScreen("opening", { focus: false });
    updateTopbar();
    $("#open-envelope").focus({ preventScroll: true });
  }

  /* ================================================================== init */
  function wire() {
    $("#open-envelope").addEventListener("click", openEnvelope);
    $("#to-gifts").addEventListener("click", () => go("gifts"));
    $("#nav-gifts").addEventListener("click", () => go("gifts"));
    $("#to-final").addEventListener("click", () => go("final"));
    $("#memories-again").addEventListener("click", () => go("memories"));
    $("#replay").addEventListener("click", replay);
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-go]");
      if (b) go(b.dataset.go);
    });
  }

  function init() {
    injectSvgs();
    bindContent();
    buildScrapbook();
    buildReel();
    buildLetter();
    buildFinal();
    initGifts();
    initFun();
    initCake();
    initSecrets();
    initDialogs();
    initMusic();
    wire();
    resetLetter();
    // Always begin with the sealed envelope, whatever the address bar says,
    // and drop a leftover #section so Back never jumps into the middle.
    try { if (location.hash) history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* sandboxed frames may refuse */ }
    $$(".screen").forEach((s) => { s.hidden = s.id !== "screen-opening"; });
    state.screen = "opening";
    document.body.dataset.screen = "opening";
    updateTopbar();
    // the top bar's room depends on the fonts and the screen size
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTopbar);
    let fitQueued = false;
    const refit = () => {
      if (fitQueued) return;
      fitQueued = true;
      window.requestAnimationFrame(() => { fitQueued = false; fitTopbar(); });
    };
    window.addEventListener("resize", refit);
    if (window.ResizeObserver) new ResizeObserver(refit).observe($("#secrets-tag"));
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
