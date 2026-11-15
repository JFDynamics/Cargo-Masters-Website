/* Cargo Masters: smooth in-page navigation.
   - Eased scrolling to sections, landing just below the fixed header.
   - Highlights the current section in the desktop menu.
   - Closes the mobile menu when tapping outside it.
   Visitors with "reduce motion" switched on get instant jumps. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var anim = null;

  function header() { return document.querySelector("header"); }
  function headerHeight() { var h = header(); return h ? h.getBoundingClientRect().height : 80; }

  function targetY(el) {
    if (el.id === "top") return 0;
    var margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    var offset = Math.max(headerHeight(), margin);
    var y = el.getBoundingClientRect().top + window.pageYOffset - offset;
    var max = root.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(y, max));
  }

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function stop() {
    if (!anim) return;
    cancelAnimationFrame(anim.raf);
    root.style.scrollBehavior = "";
    anim = null;
  }

  function scrollToY(y, done) {
    stop();
    var start = window.pageYOffset, dist = y - start;
    if (reduce.matches || Math.abs(dist) < 2) {
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, y);
      root.style.scrollBehavior = "";
      if (done) done();
      return;
    }
    var duration = Math.min(1000, Math.max(450, Math.abs(dist) * 0.35));
    var t0 = null;
    root.style.scrollBehavior = "auto"; // stop the CSS fallback fighting the animation
    anim = {};
    function step(now) {
      if (t0 === null) t0 = now;
      var p = Math.min(1, (now - t0) / duration);
      window.scrollTo(0, start + dist * ease(p));
      if (p < 1) { anim.raf = requestAnimationFrame(step); }
      else { stop(); if (done) done(); }
    }
    anim.raf = requestAnimationFrame(step);
  }

  // Let the visitor take over at any time.
  ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) {
    window.addEventListener(ev, function (e) {
      if (ev === "mousedown" && e.target.closest && e.target.closest("a")) return;
      stop();
    }, { passive: true });
  });

  function focusTarget(el) {
    if (!el.matches("a,button,input,select,textarea,[tabindex]")) el.setAttribute("tabindex", "-1");
    try { el.focus({ preventScroll: true }); } catch (e) { /* old browsers */ }
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest && e.target.closest('a[href^="#"]');
    if (!link) return;
    var hash = link.getAttribute("href");
    if (hash.length < 2) return;
    var el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    if (location.hash !== hash) history.pushState(null, "", hash);
    // Wait a frame so the mobile menu can start closing first.
    requestAnimationFrame(function () {
      scrollToY(targetY(el), function () { focusTarget(el); updateActive(); });
    });
  });

  // Back / forward between sections also glides.
  window.addEventListener("popstate", function () {
    var el = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : document.getElementById("top");
    if (el) scrollToY(targetY(el));
  });

  // Close the mobile menu on a tap outside it, and when the screen widens.
  document.addEventListener("click", function (e) {
    var toggle = document.querySelector('.menu-toggle[aria-expanded="true"]');
    if (toggle && !(e.target.closest && e.target.closest("header"))) toggle.click();
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth < 1024) return;
    var toggle = document.querySelector('.menu-toggle[aria-expanded="true"]');
    if (toggle) toggle.click();
  });

  // Desktop menu: underline the section currently on screen.
  var ids = ["top", "about", "services", "contact"];
  var ticking = false;
  function updateActive() {
    ticking = false;
    var line = headerHeight() + window.innerHeight * 0.3, current = "top";
    var atBottom = window.innerHeight + window.pageYOffset >= root.scrollHeight - 4;
    var best = -Infinity;
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var top = el.getBoundingClientRect().top;
      if (top <= line && top > best) { best = top; current = id; }
    });
    if (atBottom) current = "contact";
    var links = document.querySelectorAll('header nav[aria-label="Main"] a[href^="#"]');
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute("href") === "#" + current) links[i].setAttribute("aria-current", "location");
      else links[i].removeAttribute("aria-current");
    }
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updateActive); }
  }, { passive: true });
  window.addEventListener("resize", updateActive, { passive: true });
  // React renders shortly after this script loads; check again once it has.
  var tries = 0;
  (function wait() {
    if (document.querySelector('header nav[aria-label="Main"] a[href^="#"]') && tries > 0) { updateActive(); }
    if (tries++ < 20) setTimeout(wait, 150);
  })();
})();
