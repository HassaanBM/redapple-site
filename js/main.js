/* ==========================================================================
   Red Apple Food Box | main script
   1 Config  2 Utilities + motion  3 Art  4 Scroll lock + Lenis  5 Loader
   6 Reveals  7 Hero  8 Categories  9 Menu + modal  10 Scroll effects
   ========================================================================== */

/* 1 CONFIG ---------------------------------------------------------------- */
const MAPS_URL = "https://www.google.com/maps/place/Red+Apple+Food+Box/@31.0524918,-97.4649503,17z/data=!3m1!4b1!4m6!3m5!1s0x86454176c174fa31:0x272156a6348245b2!8m2!3d31.0524918!4d-97.4649503!16s%2Fg%2F11n45q1s84";
/* Photos come from js/photos.js. A slot without a photo falls back to a drawn illustration. */
const IMG = window.RED_APPLE_IMAGES || {};
const PHOTOS = {
  hero: IMG.storefront,
  shelf: IMG.aisle,
  aisle: IMG.aisle,
  snacks: IMG.snacks,
  drinks: IMG.drinks,
  essentials: IMG.essentials,
  pantry: IMG.pantry,
  basket: IMG.basket,
  "essentials-tall": IMG.essentials,
  "snacks-tall": IMG.snacks,
  "c-all": IMG.aisle,
  "c-snacks": IMG.snacks,
  "c-drinks": IMG.drinks,
  f1: IMG.aisle,
  f2: IMG.snacks,
  f3: IMG.drinks
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = () => matchMedia("(min-width:769px) and (hover:hover)").matches;

/* Adaptive rem for screens wider than 1920px */
const FONT_BASE = 16, BASE_W = 1920, COEF = 0.6666;
function updateRootFontSize() {
  const reduction = ((BASE_W - innerWidth) / BASE_W) * 100 * COEF;
  const size = FONT_BASE - (FONT_BASE * reduction) / 100;
  if (size > FONT_BASE) document.documentElement.style.fontSize = size + "px";
  else document.documentElement.style.removeProperty("font-size");
}
addEventListener("resize", updateRootFontSize);
updateRootFontSize();

history.scrollRestoration = "manual";
window.scrollTo(0, 0);
$$("[data-maps]").forEach(a => (a.href = MAPS_URL));
$("#maps-url").textContent = MAPS_URL;

/* 2 UTILITIES + MOTION ---------------------------------------------------- */
const easeOutExpo = t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
const easeInOutCubic = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* One shared requestAnimationFrame loop drives tweens, springs and scroll effects */
const tickers = new Set();
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 20);
  last = now;
  tickers.forEach(fn => { if (fn(now, dt) === false) tickers.delete(fn); });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function tween({ delay = 0, duration = 600, ease = easeOutExpo, update, done }) {
  if (reduce) { update(1); done && done(); return; }
  let start = null;
  tickers.add(now => {
    if (start === null) start = now + delay;
    if (now < start) return true;
    const t = clamp((now - start) / duration, 0, 1);
    update(ease(t));
    if (t === 1) { done && done(); return false; }
    return true;
  });
}

/* Spring: v += (-tension * (x - target) - friction * v) * dt; x += v * dt */
class Spring {
  constructor(x, tension = 170, friction = 22) { this.x = x; this.v = 0; this.target = x; this.tension = tension; this.friction = friction; }
  step(dt) {
    this.v += (-this.tension * (this.x - this.target) - this.friction * this.v) * dt;
    this.x += this.v * dt;
  }
  get settled() { return Math.abs(this.v) < .01 && Math.abs(this.x - this.target) < .002; }
}
function motion(el, init = {}) {
  const base = { x: 0, y: 0, s: 1, o: 1, r: 0, ...init };
  let usesO = "o" in init;
  const sp = {};
  for (const k in base) sp[k] = new Spring(base[k]);
  let running = false;
  const apply = () => {
    el.style.transform = `translate3d(${sp.x.x}px,${sp.y.x}px,0) scale(${sp.s.x}) rotate(${sp.r.x}deg)`;
    if (usesO) el.style.opacity = clamp(sp.o.x, 0, 1);
  };
  const run = () => {
    if (running) return;
    running = true;
    tickers.add((now, dt) => {
      let moving = false;
      for (const k in sp) { sp[k].step(dt); if (!sp[k].settled) moving = true; }
      if (!moving) { for (const k in sp) { sp[k].x = sp[k].target; sp[k].v = 0; } apply(); running = false; return false; }
      apply();
      return true;
    });
  };
  apply();
  return {
    to(props, { delay = 0, tension = 170, friction = 22 } = {}) {
      if ("o" in props) usesO = true;
      const go = () => {
        for (const k in props) { sp[k].target = props[k]; sp[k].tension = tension; sp[k].friction = friction; }
        if (reduce) { for (const k in props) { sp[k].x = props[k]; sp[k].v = 0; } apply(); } else run();
      };
      delay && !reduce ? setTimeout(go, delay) : go();
    }
  };
}

/* 3 ART: illustrated stand-ins for photography ---------------------------- */
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const PAL = ["#d62828", "#781b24", "#43854a", "#f2e6d6", "#ff5a52", "#2b2b2b", "#e9b44c", "#f6f4f1"];
function art({ w = 800, h = 1000, seed = 1, kind = "mix", bg = ["#f7ebe6", "#e9d6cf"], shelves = 3, plank = "#6b3a2a" }) {
  const r = rng(seed), sh = h / shelves;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient><radialGradient id="v" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>`;
  for (let i = 0; i < shelves; i++) {
    const base = (i + 1) * sh - h * .035;
    let x = w * .03;
    while (x < w * .96) {
      const type = kind === "mix" ? ["bag", "can", "bottle", "box", "jar"][r() * 5 | 0]
        : { snacks: "bag", drinks: r() < .5 ? "can" : "bottle", essentials: "box", pantry: r() < .5 ? "jar" : "can" }[kind];
      const pw = sh * (.2 + r() * .14), ph = sh * (.42 + r() * .3), y = base - ph;
      const c = PAL[r() * PAL.length | 0]; let c2 = PAL[r() * PAL.length | 0]; if (c2 === c) c2 = "#f2e6d6";
      if (type === "bag") s += `<rect x="${x}" y="${y}" width="${pw}" height="${ph}" rx="${pw * .12}" fill="${c}"/><rect x="${x}" y="${y + ph * .3}" width="${pw}" height="${ph * .28}" fill="${c2}" opacity=".92"/><circle cx="${x + pw / 2}" cy="${y + ph * .44}" r="${pw * .13}" fill="#fff" opacity=".85"/><rect x="${x}" y="${y}" width="${pw}" height="${ph * .07}" fill="#000" opacity=".14"/>`;
      if (type === "can") s += `<rect x="${x}" y="${y}" width="${pw}" height="${ph}" rx="${pw * .14}" fill="${c}"/><rect x="${x}" y="${y + ph * .34}" width="${pw}" height="${ph * .26}" fill="${c2}" opacity=".9"/><ellipse cx="${x + pw / 2}" cy="${y + 2}" rx="${pw / 2}" ry="${pw * .09}" fill="#fff" opacity=".4"/>`;
      if (type === "bottle") s += `<rect x="${x + pw * .35}" y="${y}" width="${pw * .3}" height="${ph * .24}" fill="${c}"/><rect x="${x}" y="${y + ph * .2}" width="${pw}" height="${ph * .8}" rx="${pw * .26}" fill="${c}"/><rect x="${x}" y="${y + ph * .5}" width="${pw}" height="${ph * .22}" fill="${c2}" opacity=".9"/><rect x="${x + pw * .32}" y="${y - ph * .04}" width="${pw * .36}" height="${ph * .06}" fill="#fff"/>`;
      if (type === "box") s += `<rect x="${x}" y="${y}" width="${pw}" height="${ph}" rx="5" fill="${c}"/><rect x="${x}" y="${y + ph * .12}" width="${pw}" height="${ph * .18}" fill="${c2}" opacity=".9"/><rect x="${x + pw * .2}" y="${y + ph * .5}" width="${pw * .6}" height="${ph * .22}" rx="4" fill="#fff" opacity=".8"/>`;
      if (type === "jar") s += `<rect x="${x + pw * .08}" y="${y}" width="${pw * .84}" height="${ph * .12}" rx="3" fill="#2b2b2b"/><rect x="${x}" y="${y + ph * .1}" width="${pw}" height="${ph * .9}" rx="${pw * .18}" fill="${c}" opacity=".92"/><rect x="${x + pw * .12}" y="${y + ph * .42}" width="${pw * .76}" height="${ph * .3}" rx="4" fill="#fff" opacity=".85"/>`;
      x += pw + sh * (.03 + r() * .03);
    }
    s += `<rect x="0" y="${base}" width="${w}" height="${h * .035}" fill="${plank}"/><rect x="0" y="${base + h * .035}" width="${w}" height="${h * .02}" fill="#000" opacity=".18"/>`;
  }
  s += `<rect width="${w}" height="${h}" fill="url(#v)"/></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
}
const DARK = ["#3a0f14", "#1c0608"];
const ART = {
  hero: { w: 1600, h: 1000, seed: 11, kind: "mix", bg: DARK, shelves: 7, plank: "#2a1210" },
  shelf: { w: 500, h: 400, seed: 21, kind: "mix", shelves: 3 },
  aisle: { w: 400, h: 300, seed: 31, kind: "essentials", shelves: 2 },
  snacks: { w: 440, h: 290, seed: 41, kind: "snacks", shelves: 2 },
  drinks: { w: 440, h: 290, seed: 51, kind: "drinks", shelves: 2 },
  essentials: { w: 440, h: 290, seed: 61, kind: "essentials", shelves: 2 },
  pantry: { w: 440, h: 290, seed: 71, kind: "pantry", shelves: 2 },
  "essentials-tall": { w: 600, h: 800, seed: 81, kind: "essentials", shelves: 4 },
  "snacks-tall": { w: 600, h: 800, seed: 91, kind: "mix", shelves: 4, bg: ["#fbe7e2", "#f0cdc6"] },
  "c-all": { w: 600, h: 800, seed: 101, kind: "mix", shelves: 4 },
  "c-snacks": { w: 600, h: 800, seed: 111, kind: "snacks", shelves: 4, bg: ["#fbe7e2", "#f0cdc6"] },
  "c-drinks": { w: 600, h: 800, seed: 121, kind: "drinks", shelves: 4, bg: ["#e5efe4", "#c9ddc8"] },
  basket: { w: 400, h: 300, seed: 161, kind: "mix", shelves: 2 },
  "f1": { w: 200, h: 200, seed: 131, kind: "mix", shelves: 2 },
  "f2": { w: 200, h: 200, seed: 141, kind: "snacks", shelves: 2 },
  "f3": { w: 200, h: 200, seed: 151, kind: "drinks", shelves: 2 }
};
/* A slot can hold one source or a list. Sources are tried in order, then an illustration. */
function setArt(img, key) {
  const queue = [].concat(PHOTOS[key] || []);
  const next = () => { img.src = queue.length ? queue.shift() : art(ART[key]); };
  img.onerror = () => { if (!queue.length) img.onerror = null; next(); };
  next();
}
$$("img[data-art]").forEach(img => setArt(img, img.dataset.art));

/* 4 SCROLL LOCK + LENIS --------------------------------------------------- */
const locks = new Set();
let lenis = null;
function syncLock() {
  const on = locks.size > 0;
  document.documentElement.classList.toggle("is-locked", on);
  if (lenis) on ? lenis.stop() : lenis.start();
}
const lock = k => { locks.add(k); syncLock(); };
const unlock = k => { locks.delete(k); syncLock(); };
lock("loader");

(async () => {
  try {
    const mod = await Promise.race([import("lenis"), new Promise((_, rej) => setTimeout(rej, 4000))]);
    const Lenis = mod.default || mod.Lenis;
    lenis = new Lenis({ smoothWheel: true });
    tickers.add(now => { lenis.raf(now); return true; });
    syncLock();
  } catch (e) { lenis = null; /* native scrolling is used instead */ }
})();

function scrollToEl(el) {
  if (lenis) lenis.scrollTo(el, { offset: -8 });
  else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

/* 5 LOADER ---------------------------------------------------------------- */
let ready = false;
const readyCbs = [];
const whenReady = fn => (ready ? fn() : readyCbs.push(fn));
{
  const MIN_VISIBLE_MS = reduce ? 200 : 1400, MAX_VISIBLE_MS = reduce ? 200 : 2600, EXIT_MS = reduce ? 0 : 850;
  const loader = $("#loader"), fill = $("#loader-fill");
  let started = false;
  const finish = () => {
    ready = true;
    readyCbs.splice(0).forEach(f => f());
    unlock("loader");
    tween({
      duration: EXIT_MS, ease: easeInOutCubic,
      update: t => (loader.style.transform = `translateY(${-105 * t}%)`),
      done: () => loader.remove()
    });
  };
  const begin = () => {
    if (started) return;
    started = true;
    tween({ duration: MIN_VISIBLE_MS, ease: easeInOutCubic, update: t => (fill.style.transform = `scaleX(${t})`), done: finish });
  };
  if (document.readyState === "complete") begin();
  else { addEventListener("load", begin, { once: true }); setTimeout(begin, MAX_VISIBLE_MS); }
}

/* 6 REVEALS --------------------------------------------------------------- */
function wrapMask(node) {
  const mk = document.createElement("span"); mk.className = "mk";
  const mw = document.createElement("span"); mw.className = "mw";
  while (node.firstChild) mw.appendChild(node.firstChild);
  mk.appendChild(mw); node.appendChild(mk);
  return mw;
}
const hideMw = mw => { mw.style.transform = "translateY(115%)"; mw.style.opacity = "0"; };
function playMw(mws, { stagger = 140, duration = 1100, delay = 0, ease = easeOutExpo } = {}) {
  mws.forEach((mw, i) => tween({
    delay: delay + i * stagger, duration, ease,
    update: t => { mw.style.transform = `translateY(${115 * (1 - t)}%)`; mw.style.opacity = Math.min(1, t * 3); }
  }));
}
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = "";
  return words.map((w, i) => {
    const mk = document.createElement("span"); mk.className = "mk";
    const mw = document.createElement("span"); mw.className = "mw"; mw.textContent = w;
    mk.appendChild(mw); el.appendChild(mk);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    return mw;
  });
}
function inView(el, fn, margin = "0px 0px -12% 0px") {
  if (!("IntersectionObserver" in window)) { fn(); return; }
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { rootMargin: margin });
  io.observe(el);
}

/* Fade-and-rise / scale-up reveals */
$$("[data-reveal]").forEach((el, i) => {
  const kind = el.dataset.reveal;
  const m = motion(el, kind === "scale" ? { s: .92, o: 0 } : { y: 40, o: 0 });
  inView(el, () => m.to(kind === "scale" ? { s: 1, o: 1 } : { y: 0, o: 1 }, { delay: (i % 3) * 70 }));
});
/* Stacked line reveals */
$$("[data-lines]").forEach(el => {
  const mws = $$(".ln", el).map(ln => wrapMask(ln));
  mws.forEach(hideMw);
  inView(el, () => playMw(mws, { stagger: +(el.dataset.stagger || 120), duration: 1000 }));
});
/* Word-by-word fade-and-rise paragraph */
$$("[data-words]").forEach(el => {
  const words = splitWords(el);
  const ms = words.map(w => { w.parentElement.style.clipPath = "none"; return motion(w, { y: 12, o: 0 }); });
  inView(el, () => ms.forEach((m, i) => m.to({ y: 0, o: 1 }, { delay: i * 22 })));
});

/* 7 HERO ------------------------------------------------------------------ */
const heroImg = $("#hero-img");
{
  const title = $("#hero-title");
  const words = title.textContent.trim().split(" ");
  title.textContent = "";
  title.setAttribute("aria-label", "Good food. Everyday ease.");
  const mws = words.map((w, i) => {
    const mk = document.createElement("span"); mk.className = "mk"; mk.setAttribute("aria-hidden", "true");
    const mw = document.createElement("span"); mw.className = "mw"; mw.textContent = w;
    mk.appendChild(mw); title.appendChild(mk);
    if (i < words.length - 1) { const g = document.createElement("span"); g.className = "gap"; g.setAttribute("aria-hidden", "true"); title.appendChild(g); }
    hideMw(mw);
    return mw;
  });
  const tag = $$("#tagline .ln").map(wrapMask); tag.forEach(hideMw);
  const hl = motion($("#hl"), { y: 60, o: 0 }), feat = motion($("#feat-card"), { y: 30, o: 0 });
  whenReady(() => {
    playMw(mws, { stagger: 140, duration: 1100, ease: easeOutExpo });
    playMw(tag, { stagger: 110, duration: 900, delay: 350, ease: easeOutExpo });
    hl.to({ y: 0, o: 1 }, { delay: 500 });
    feat.to({ y: 0, o: 1 }, { delay: 400 });
    startFeat();
  });
}

/* Hero featured carousel (autoplay starts after the loader) */
const FEAT = [
  { tag: "Fresh Finds", title: "Everyday Favorites", cta: "Explore picks", href: "#categories", art: "f1" },
  { tag: "Snack Break", title: "Sweet & Savory", cta: "See snacks", href: "#snacks", art: "f2" },
  { tag: "Cold & Ready", title: "Drinks on the Go", cta: "Discover drinks", href: "#drinks", art: "f3" }
];
let featSet, featIdx = 0, featTimer = null, featStarted = false;
function makeDots(box, n, onPick, label) {
  box.innerHTML = "";
  const bs = Array.from({ length: n }, (_, i) => {
    const b = document.createElement("button");
    b.className = "dot"; b.type = "button"; b.setAttribute("aria-label", `${label} ${i + 1}`);
    b.innerHTML = "<i></i>"; b.addEventListener("click", () => onPick(i)); box.appendChild(b); return b;
  });
  return i => bs.forEach((b, k) => b.setAttribute("aria-current", String(k === i)));
}
{
  const card = $("#feat-card");
  const inner = $(".feat-info", card), img = $("#feat-img");
  const m = motion(inner), mi = motion(img);
  featSet = makeDots($("#feat-dots"), FEAT.length, i => { goFeat(i); restartFeat(); }, "Show featured pick");
  const paint = i => {
    const f = FEAT[i];
    $("#feat-tag").textContent = f.tag; $("#feat-title").textContent = f.title;
    const cta = $("#feat-cta"); cta.textContent = f.cta + " ↓"; cta.href = f.href;
    setArt(img, f.art); img.alt = ""; featSet(i);
  };
  window.goFeat = i => {
    featIdx = (i + FEAT.length) % FEAT.length;
    m.to({ o: 0, y: 10, s: .98 }, { tension: 300, friction: 28 }); mi.to({ o: 0, s: .94 }, { tension: 300, friction: 28 });
    setTimeout(() => { paint(featIdx); m.to({ o: 1, y: 0, s: 1 }); mi.to({ o: 1, s: 1 }); }, reduce ? 0 : 220);
  };
  paint(0);
}
const goFeat = i => window.goFeat(i);
function restartFeat() { clearInterval(featTimer); if (featStarted) featTimer = setInterval(() => goFeat(featIdx + 1), 3800); }
function startFeat() { featStarted = true; restartFeat(); }

/* 8 CATEGORIES ------------------------------------------------------------ */
const CATS = [
  { words: ["Everyday", "Essentials", "Right", "Nearby"], title: "Everyday Essentials", body: "The things you need, within easy reach.", art: "c-all" },
  { words: ["Fresh", "Finds", "Quick", "Stops"], title: "Snacks & Treats", body: "A quick pick for your next break.", art: "c-snacks" },
  { words: ["Your", "Local", "Daily", "Favorite"], title: "Drinks & Refreshments", body: "Grab a refreshing favorite.", art: "c-drinks" }
];
let catIdx = 0, setCatDots;
{
  const gws = $$(".gw"), mws = gws.map(wrapMask);
  const img = $("#cat-img"), cap = $(".cat-cap"), mi = motion(img), mc = motion(cap);
  const paint = (i, first) => {
    const c = CATS[i];
    c.words.forEach((w, k) => (mws[k].textContent = w));
    mws.forEach(hideMw);
    const go = () => playMw(mws, { stagger: 80, duration: 700, ease: easeOutExpo });
    first ? inView($("#ghost"), go) : go();
    setArt(img, c.art);
    $("#cat-title").textContent = c.title; $("#cat-body").textContent = c.body;
    img.alt = c.title;
    setCatDots(i);
  };
  const show = i => {
    catIdx = (i + CATS.length) % CATS.length;
    mi.to({ o: 0, s: 1.04 }, { tension: 300, friction: 28 }); mc.to({ o: 0, y: 8 }, { tension: 300, friction: 28 });
    setTimeout(() => { paint(catIdx); mi.to({ o: 1, s: 1 }); mc.to({ o: 1, y: 0 }); }, reduce ? 0 : 220);
  };
  setCatDots = makeDots($("#cat-dots"), CATS.length, show, "Show category");
  $("#cat-prev").addEventListener("click", () => show(catIdx - 1));
  $("#cat-next").addEventListener("click", () => show(catIdx + 1));
  paint(0, true);
  window.__gws = gws;
}

/* Hover springs (desktop pointer devices only) */
function hoverSpring(el, over, out, target = el) {
  const m = motion(target);
  el.addEventListener("pointerenter", () => canHover() && m.to(over, { tension: 220, friction: 20 }));
  el.addEventListener("pointerleave", () => m.to(out, { tension: 220, friction: 20 }));
}
$$(".arrow-btn svg").forEach(svg => {
  const btn = svg.closest(".arrow-btn");
  if (btn.classList.contains("prev")) return;
  hoverSpring(btn, { s: 1.15 }, { s: 1 }, svg);
});
$$("[data-zoom]").forEach(card => hoverSpring(card, { s: 1.06 }, { s: 1 }, card.querySelector("img")));

/* 9 MENU + MODAL ---------------------------------------------------------- */
const menu = $("#menu"), burger = $("#burger");
let menuOpen = false;
{
  const links = $$(".menu-links a"), top = $(".menu-top"), bottom = $(".menu-bottom");
  const mm = motion(menu, { y: -24, o: 0 });
  const lm = links.map(a => motion(a, { y: 50, o: 0 }));
  const tm = motion(top, { o: 0 }), bm = motion(bottom, { y: 20, o: 0 });
  window.openMenu = () => {
    if (menuOpen) return;
    menuOpen = true; lock("menu");
    menu.classList.add("open"); menu.setAttribute("aria-hidden", "false");
    mm.to({ y: 0, o: 1 }, { tension: 200, friction: 26 }); tm.to({ o: 1 });
    lm.forEach((m, i) => m.to({ y: 0, o: 1 }, { delay: 120 + i * 70 }));
    bm.to({ y: 0, o: 1 }, { delay: 420 });
    $("#menu-close").focus();
  };
  window.closeMenu = (restoreFocus = true) => {
    if (!menuOpen) return;
    menuOpen = false; unlock("menu");
    mm.to({ y: -24, o: 0 }, { tension: 260, friction: 30 });
    setTimeout(() => { if (!menuOpen) { menu.classList.remove("open"); menu.setAttribute("aria-hidden", "true"); lm.forEach(m => m.to({ y: 50, o: 0 })); bm.to({ y: 20, o: 0 }); } }, reduce ? 0 : 350);
    restoreFocus && burger.focus();
  };
  burger.addEventListener("click", () => window.openMenu());
  $("#menu-close").addEventListener("click", () => window.closeMenu());
}

const modal = $("#modal"), panel = $("#panel"), form = $("#contact-form"), sent = $("#sent");
let modalOpen = false, modalTrigger = null;
{
  const mp = motion(panel, { y: 28, s: .96, o: 0 });
  const mb = motion(modal, { o: 0 });
  const openModal = trigger => {
    if (modalOpen) return;
    modalOpen = true; modalTrigger = trigger; lock("modal");
    modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
    mb.to({ o: 1 }, { tension: 260, friction: 30 }); mp.to({ y: 0, s: 1, o: 1 }, { tension: 200, friction: 24 });
    setTimeout(() => $("#f-name").focus(), 60);
  };
  const closeModal = () => {
    if (!modalOpen) return;
    modalOpen = false; unlock("modal");
    mp.to({ y: 28, s: .96, o: 0 }, { tension: 260, friction: 30 }); mb.to({ o: 0 }, { tension: 260, friction: 30 });
    setTimeout(() => {
      if (modalOpen) return;
      modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true");
      form.reset(); form.style.display = ""; sent.classList.remove("show");
    }, reduce ? 0 : 300);
    modalTrigger && modalTrigger.focus && modalTrigger.focus();
  };
  window.__closeModal = closeModal;
  $$("[data-open-modal]").forEach(b => b.addEventListener("click", () => openModal(b)));
  $("#modal-close").addEventListener("click", closeModal);
  $("#sent-close").addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
  form.addEventListener("submit", e => {
    e.preventDefault();
    form.style.display = "none"; sent.classList.add("show"); $("#sent-close").focus();
  });
  /* Keep Tab focus inside the dialog */
  modal.addEventListener("keydown", e => {
    if (e.key !== "Tab") return;
    const f = $$("button, a[href], input, textarea", panel).filter(n => n.offsetParent !== null);
    if (!f.length) return;
    const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  });
}
addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (modalOpen) window.__closeModal(); else if (menuOpen) window.closeMenu();
});

/* "Coming soon" card: disabled, shows its tooltip on hover, focus or tap */
{
  const wrap = $(".soon-wrap"); let hide;
  $("#soon").addEventListener("click", () => {
    wrap.classList.add("tip"); clearTimeout(hide);
    hide = setTimeout(() => wrap.classList.remove("tip"), 2800);
  });
}

/* In-page links: close overlays, then smooth-scroll to the target */
document.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute("href") === "#") return;
  const target = document.querySelector(a.getAttribute("href"));
  if (!target) return;
  e.preventDefault();
  const wasOpen = menuOpen;
  if (wasOpen) window.closeMenu(false);
  setTimeout(() => scrollToEl(target), wasOpen ? 60 : 0);
});

/* 10 SCROLL EFFECTS ------------------------------------------------------- */
{
  const links = $$(".jump"), secs = links.map(a => document.querySelector(a.getAttribute("href")));
  const spy = () => {
    const hit = secs.findIndex(s => { const r = s.getBoundingClientRect(); return r.top <= innerHeight * .35 && r.bottom > innerHeight * .35; });
    links.forEach((a, i) => { a.classList.toggle("active", i === hit); i === hit ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"); });
  };
  addEventListener("scroll", spy, { passive: true }); spy();
}
{
  const hero = $(".hero"), wrap = $("#ghost-wrap"), gws = window.__gws;
  const dirs = [-1, 1, -1, 1];
  tickers.add(() => {
    if (reduce) return true;
    const hr = hero.getBoundingClientRect();
    if (hr.bottom > 0) {
      const p = clamp(-hr.top / hr.height, 0, 1);
      heroImg.style.transform = `translateY(${12 * p}%)`;
    }
    const wr = wrap.getBoundingClientRect();
    if (wr.bottom > 0 && wr.top < innerHeight) {
      const p = clamp((wr.top + wr.height / 2 - innerHeight / 2) / innerHeight, -1, 1);
      gws.forEach((g, i) => (g.style.transform = `translateX(${dirs[i] * p * innerWidth * .025}px)`));
    }
    return true;
  });
}
