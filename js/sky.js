/* Twinkling star field.
   - Seeded, so every page shows the same sky.
   - Brightness follows Euclidean star counts, N(>S) ∝ S^-3/2: many faint, few bright.
   - Twinkle uses wall-clock time, so it continues seamlessly between pages.
   - Fades out for day mode; pauses when the tab is hidden; static if reduced motion is on. */
(function () {
  "use strict";
  var canvas = document.getElementById("sky");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- Settings you might want to tweak ---- */
  var SEED = 20260925;          // change to get a different (but still fixed) sky
  var DENSITY = 0.00019;        // stars per CSS pixel² (~250 on a 1440×900 screen)
  var MIN_STARS = 90;
  var MAX_STARS = 900;
  var FPS = 30;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var TAU = Math.PI * 2;
  var rand = mulberry32(SEED);
  var stars = [];
  for (var i = 0; i < MAX_STARS; i++) {
    var u = Math.max(rand(), 1e-4);
    var flux = Math.min(Math.pow(u, -2 / 3), 60);
    var lg = Math.log10(flux);
    var c = rand();
    stars.push({
      x: rand(), y: rand(),
      r: 0.55 + 0.42 * lg,
      a: Math.min(1, 0.42 + 0.36 * lg),
      glow: flux > 6,
      fill: c < 0.14 ? "rgb(202,216,255)" : c < 0.26 ? "rgb(255,229,199)" : "rgb(255,255,255)",
      p1: 2 + rand() * 5, p2: 3 + rand() * 6,
      f1: rand() * TAU, f2: rand() * TAU,
      amp: 0.3 + rand() * 0.45,
      d: rand()                       // delay used when fading in and out
    });
  }

  // Soft glow sprite for the brightest few percent
  var sprite = document.createElement("canvas");
  sprite.width = sprite.height = 64;
  var sctx = sprite.getContext("2d");
  var grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(220,230,255,1)");
  grad.addColorStop(0.25, "rgba(200,215,255,0.35)");
  grad.addColorStop(1, "rgba(200,215,255,0)");
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 64, 64);

  var W = 0, H = 0, dpr = 1, count = 0;
  function resize() {
    var cw = canvas.clientWidth, ch = canvas.clientHeight;
    var nd = Math.min(window.devicePixelRatio || 1, 2);
    if (cw * nd === W && ch * nd === H) return;
    dpr = nd; W = Math.round(cw * dpr); H = Math.round(ch * dpr);
    canvas.width = W; canvas.height = H;
    count = Math.max(MIN_STARS, Math.min(MAX_STARS, Math.round(cw * ch * DENSITY)));
    draw(performance.now());
  }

  // Visibility of the whole sky: 1 at night, 0 by day, animated in between
  function isDark() { return root.getAttribute("data-theme") !== "light"; }
  var fade = { from: isDark() ? 1 : 0, to: isDark() ? 1 : 0, start: 0, dur: 1500 };

  function starVisibility(s, now) {
    if (fade.from === fade.to) return fade.to;
    var p = (now - fade.start) / fade.dur;
    if (p >= 1) return fade.to;
    var q = Math.min(1, Math.max(0, p * 1.5 - s.d * 0.5));
    q = q * q * (3 - 2 * q);
    return fade.from + (fade.to - fade.from) * q;
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    if (fade.from === 0 && fade.to === 0) return;
    var t = Date.now() / 1000;
    var still = reduceMotion.matches;
    for (var i = 0; i < count; i++) {
      var s = stars[i];
      var v = starVisibility(s, now);
      if (v <= 0.003) continue;
      var tw = still ? 1 - s.amp * 0.4 :
        1 - s.amp + s.amp * (0.5 + 0.5 * (0.62 * Math.sin(TAU * t / s.p1 + s.f1) + 0.38 * Math.sin(TAU * t / s.p2 + s.f2)));
      var alpha = s.a * tw * v;
      var x = s.x * W, y = s.y * H, r = s.r * dpr;
      if (s.glow) {
        var g = r * 11;
        ctx.globalAlpha = alpha * 0.4;
        ctx.drawImage(sprite, x - g / 2, y - g / 2, g, g);
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.fill;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var running = false, last = 0, frameGap = 1000 / FPS;
  function loop(now) {
    if (!running) return;
    if (now - last >= frameGap - 2) {
      last = now;
      draw(now);
      if (fade.from !== fade.to && now - fade.start >= fade.dur) {
        fade.from = fade.to;
        draw(now);
      }
    }
    if (shouldRun()) requestAnimationFrame(loop);
    else running = false;
  }
  function shouldRun() {
    if (document.hidden) return false;
    if (fade.from !== fade.to) return true;           // fading
    if (reduceMotion.matches) return false;           // still sky
    return fade.to === 1;                             // night: twinkle
  }
  function start() {
    if (running || !shouldRun()) { if (!running) draw(performance.now()); return; }
    running = true;
    requestAnimationFrame(loop);
  }

  // Follow the day/night attribute; animate only when the switch asked for it
  new MutationObserver(function () {
    var target = isDark() ? 1 : 0;
    if (target === fade.to) return;
    var now = performance.now();
    if (root.classList.contains("theme-anim") && !reduceMotion.matches) {
      fade = { from: fade.to, to: target, start: now, dur: target === 1 ? 1600 : 1100 };
    } else {
      fade = { from: target, to: target, start: now, dur: 0 };
    }
    start();
  }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  document.addEventListener("visibilitychange", start);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", start);

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });

  resize();
  start();
})();
