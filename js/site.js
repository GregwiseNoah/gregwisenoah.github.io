(function () {
  "use strict";
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Day / night switch ---------- */
  var toggles = document.querySelectorAll(".theme-toggle");
  var themeColor = document.querySelector('meta[name="theme-color"]');
  var animTimer;

  function currentTheme() { return root.getAttribute("data-theme") === "light" ? "light" : "dark"; }

  function updateToggle() {
    var t = currentTheme();
    if (themeColor) themeColor.setAttribute("content", t === "light" ? "#F3F6FA" : "#0A1024");
    var label = t === "dark" ? "Switch to day mode" : "Switch to night mode";
    toggles.forEach(function (btn) {
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
    });
  }

  function setTheme(t, animate) {
    var doAnimate = animate && !reduceMotion.matches;
    if (doAnimate) {
      root.classList.add("theme-anim");
      clearTimeout(animTimer);
      animTimer = setTimeout(function () { root.classList.remove("theme-anim"); }, 2000);
    }
    root.setAttribute("data-theme", t);
  }

  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      try { localStorage.setItem("theme", next); } catch (e) {}
      setTheme(next, true);
    });
  });
  new MutationObserver(updateToggle).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  // Follow the device setting until the visitor makes a choice
  var prefersLight = window.matchMedia("(prefers-color-scheme: light)");
  function onSystemChange(e) {
    var stored = null;
    try { stored = localStorage.getItem("theme"); } catch (err) {}
    if (stored === "light" || stored === "dark") return;
    setTheme(e.matches ? "light" : "dark", true);
  }
  if (prefersLight.addEventListener) prefersLight.addEventListener("change", onSystemChange);
  updateToggle();

  /* ---------- Video links: YouTube link or "coming soon" ---------- */
  document.querySelectorAll("[data-video]").forEach(function (link) {
    var href = (link.getAttribute("href") || "").trim();
    if (!href || href === "#") {
      link.classList.add("is-pending");
      link.setAttribute("aria-disabled", "true");
      link.removeAttribute("href");
      link.setAttribute("role", "img");
    } else {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener");
    }
  });

  /* ---------- Copy email ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    var original = btn.textContent;
    var status = document.getElementById(btn.getAttribute("aria-controls") || "");
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      function done(ok) {
        btn.textContent = ok ? "Email copied" : "Copy failed";
        if (status) status.textContent = ok ? "Email address copied to clipboard." : "Couldn't copy. Select the address and copy it instead.";
        setTimeout(function () { btn.textContent = original; if (status) status.textContent = ""; }, 2200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else { done(false); }
    });
  });

  /* ---------- Cold clouds: step through time ---------- */
  document.querySelectorAll("[data-compare]").forEach(function (widget) {
    var buttons = Array.prototype.slice.call(widget.querySelectorAll("[data-step-button]"));
    var play = widget.querySelector("[data-play]");
    var status = widget.querySelector("[data-compare-status]");
    var steps = buttons.length;
    var current = 0, timer = null;

    function show(i) {
      current = i;
      buttons.forEach(function (b, j) { b.setAttribute("aria-pressed", j === i ? "true" : "false"); });
      widget.querySelectorAll(".stack").forEach(function (stack) {
        stack.querySelectorAll("img").forEach(function (img, j) { img.classList.toggle("is-active", j === i); });
      });
      if (status) status.textContent = "Showing t / t eddy = " + buttons[i].textContent.trim();
    }
    function stop() {
      clearInterval(timer); timer = null;
      if (play) play.textContent = "Play";
    }
    buttons.forEach(function (b, i) { b.addEventListener("click", function () { stop(); show(i); }); });
    if (play) {
      play.addEventListener("click", function () {
        if (timer) { stop(); return; }
        play.textContent = "Pause";
        if (current === steps - 1) show(0);
        timer = setInterval(function () {
          if (current >= steps - 1) { stop(); return; }
          show(current + 1);
        }, reduceMotion.matches ? 1800 : 1400);
      });
    }
    show(0);
  });
})();
