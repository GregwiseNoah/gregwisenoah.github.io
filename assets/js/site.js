/* Ashwin V George, personal site */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Day / night mode ---------- */

  var toggle = document.querySelector(".theme-toggle");
  var animTimer = 0;

  function storedTheme() {
    try { return localStorage.getItem("theme"); } catch (e) { return null; }
  }

  function labelToggle(theme) {
    if (!toggle) return;
    var label = theme === "dark" ? "Switch to day mode" : "Switch to night mode";
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("title", label);
  }

  function setTheme(theme, animate) {
    if (animate && !reduceMotion.matches) {
      root.classList.add("theme-anim");
      clearTimeout(animTimer);
      animTimer = setTimeout(function () { root.classList.remove("theme-anim"); }, 1400);
    }
    root.dataset.theme = theme;
    labelToggle(theme);
    document.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
  }

  labelToggle(root.dataset.theme);

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.dataset.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem("theme", next); } catch (e) {}
      setTheme(next, true);
    });
  }

  // Follow the device setting until the visitor picks a mode themselves
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", function (e) {
    if (!storedTheme()) setTheme(e.matches ? "light" : "dark", true);
  });

  /* ---------- Star field ---------- */

  var canvas = document.querySelector(".sky");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var stars = [];
    var width = 0, height = 0;
    var raf = 0, running = false, last = 0, stopTimer = 0;

    // Same seed on every page, so the sky doesn't jump when you navigate
    function mulberry32(a) {
      return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function build() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var rand = mulberry32(20260930);
      var count = Math.min(380, Math.round((width * height) / 4200));
      stars = [];
      for (var i = 0; i < count; i++) {
        var bright = rand() < 0.07;
        var tint = rand();
        stars.push({
          x: rand() * width,
          y: rand() * height,
          r: bright ? 1.05 + rand() * 0.6 : 0.35 + rand() * 0.6,
          base: bright ? 0.75 + rand() * 0.25 : 0.3 + rand() * 0.45,
          period: 2000 + rand() * 5000,
          phase: rand() * Math.PI * 2,
          bright: bright,
          // mostly white, a few faintly blue or warm, like real stellar colours
          color: tint < 0.08 ? "205,220,255" : tint < 0.13 ? "255,232,205" : "240,244,255"
        });
      }
    }

    function draw(time) {
      ctx.clearRect(0, 0, width, height);
      var still = reduceMotion.matches;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var a = still ? s.base * 0.85
          : s.base * (0.58 + 0.42 * Math.sin((time / s.period) * Math.PI * 2 + s.phase));
        if (s.bright) {
          ctx.globalAlpha = a * 0.14;
          ctx.fillStyle = "rgb(" + s.color + ")";
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = a;
        ctx.fillStyle = "rgb(" + s.color + ")";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Uses wall-clock time, so the twinkle carries on seamlessly across pages
    function frame(ts) {
      if (ts - last > 33) { draw(Date.now()); last = ts; }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      clearTimeout(stopTimer);
      if (reduceMotion.matches) { draw(Date.now()); return; }
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    function sync() {
      if (document.hidden) { stop(); return; }
      if (root.dataset.theme === "dark") start();
      else { clearTimeout(stopTimer); stopTimer = setTimeout(stop, 1400); }
    }

    build();
    draw(Date.now());
    sync();

    var lastW = width, lastH = height;
    window.addEventListener("resize", function () {
      // ignore small height changes from mobile browser toolbars
      if (window.innerWidth !== lastW || Math.abs(window.innerHeight - lastH) > 140) {
        lastW = window.innerWidth; lastH = window.innerHeight;
        build();
        draw(Date.now());
      }
    });
    document.addEventListener("visibilitychange", sync);
    document.addEventListener("themechange", sync);
    reduceMotion.addEventListener("change", function () { stop(); sync(); draw(Date.now()); });
  }

  /* ---------- Thesis video link (YouTube, not embedded) ---------- */

  document.querySelectorAll(".video-link").forEach(function (link) {
    var url = (link.dataset.youtube || "").trim();
    var status = link.parentElement.querySelector(".video-status");
    if (url) {
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      if (status) status.textContent = "Watch on YouTube.";
    } else {
      link.removeAttribute("href");
      link.classList.add("pending");
      if (status) status.textContent = "Video coming soon on YouTube.";
    }
  });

  /* ---------- Copy email ---------- */

  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.dataset.copy;
      var done = function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy address"; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { btn.textContent = "Press Ctrl+C to copy"; });
      } else {
        btn.textContent = "Copy not available";
      }
    });
  });

  /* ---------- Cloud survival viewer (internship page) ---------- */

  var viewer = document.querySelector(".cloud-viewer");
  if (viewer) {
    var times = ["0.2", "3.2", "6.7"];
    var caseButtons = viewer.querySelectorAll(".seg button");
    var slider = viewer.querySelector("#cv-time");
    var output = viewer.querySelector("#cv-out");
    var playBtn = viewer.querySelector(".cv-play");
    var frames = viewer.querySelectorAll(".cv-frames img");
    var currentCase = "death";
    var playTimer = 0;

    function show() {
      var t = times[Number(slider.value)];
      frames.forEach(function (img) {
        img.classList.toggle("on", img.dataset.case === currentCase && img.dataset.t === t);
      });
      output.innerHTML = "t / t<sub>eddy</sub> = " + t;
      slider.setAttribute("aria-valuetext", "t over t eddy equals " + t);
    }

    function stopPlay() {
      clearInterval(playTimer);
      playTimer = 0;
      playBtn.querySelector(".label").textContent = "Play";
      playBtn.setAttribute("aria-pressed", "false");
    }

    caseButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentCase = btn.dataset.case;
        caseButtons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        show();
      });
    });

    slider.addEventListener("input", function () { stopPlay(); show(); });

    playBtn.addEventListener("click", function () {
      if (playTimer) { stopPlay(); return; }
      playBtn.querySelector(".label").textContent = "Pause";
      playBtn.setAttribute("aria-pressed", "true");
      if (slider.value === "2") { slider.value = "0"; show(); }
      playTimer = setInterval(function () {
        var next = Number(slider.value) + 1;
        if (next > 2) { stopPlay(); return; }
        slider.value = String(next);
        show();
      }, 1300);
    });

    show();
  }
})();
