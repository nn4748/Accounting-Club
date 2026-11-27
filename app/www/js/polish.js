/* لمسات الحركة للتصميم الفاخر — تشتغل فوق app.js بدون ما تغيّر وظائفه */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ظهور تدريجي للعناصر لما تدخل الشاشة */
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.08 }) : null;
  function reveal(root) {
    const els = $$(".block, .card, .thumb, .stat, .goals li, .tool, .event, .date-card", root || document)
      .filter((el) => !el.classList.contains("rv"));
    els.forEach((el, i) => {
      el.classList.add("rv");
      el.style.transitionDelay = Math.min(i % 6, 5) * 60 + "ms";
      if (io) io.observe(el); else el.classList.add("in");
    });
  }

  /* عدّاد للأرقام (+15000 ← يعدّ من صفر) */
  function countUp(el) {
    const raw = el.textContent.trim();
    const m = raw.match(/^([+]?)([\d.]+)([kKmM]?)$/);
    if (!m || el.dataset.counted) return;
    el.dataset.counted = "1";
    const target = parseFloat(m[2]), dec = (m[2].split(".")[1] || "").length, t0 = performance.now(), dur = 1400;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = m[1] + v.toFixed(dec) + m[3];
      if (p < 1) requestAnimationFrame(step); else el.textContent = raw;
    };
    requestAnimationFrame(step);
  }
  const statsIO = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { $$(".stat b", e.target).forEach(countUp); statsIO.unobserve(e.target); } });
  }, { threshold: 0.3 }) : null;

  /* مؤشر متحرك لشريط التبويبات والشرائح */
  function slider(container, itemSel, thumbClass) {
    if (!container) return;
    const thumb = document.createElement("span");
    thumb.className = thumbClass; container.prepend(thumb);
    const place = () => {
      const on = $(itemSel + ".is-on", container); if (!on) return;
      const c = container.getBoundingClientRect(), r = on.getBoundingClientRect();
      thumb.style.width = r.width + "px";
      thumb.style.transform = `translateX(${r.left - c.left - parseFloat(getComputedStyle(container).paddingLeft || 0)}px)`;
      thumb.style.left = getComputedStyle(container).paddingLeft;
    };
    new MutationObserver(place).observe(container, { subtree: true, attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", place);
    requestAnimationFrame(place); setTimeout(place, 300);
  }

  /* الرئيسية: الشريط يظهر بعد ما يعدّي البطل، ولون الساعة والبطارية أبيض فوق البطل الكحلي */
  const SB = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar;
  let sbDark = null;
  function statusBar() {
    const home = $("#tab-home");
    const overHero = home && home.classList.contains("is-active") && !home.classList.contains("scrolled-far")
      && !$("#page:not([hidden])") && !$("#sheet:not([hidden])");
    if (overHero === sbDark || !SB) return;
    sbDark = overHero;
    try { SB.setStyle({ style: overHero ? "DARK" : "LIGHT" }); } catch (e) { /* */ }
  }
  const home = $("#tab-home");
  if (home) home.addEventListener("scroll", () => { home.classList.toggle("scrolled-far", home.scrollTop > 300); statusBar(); }, { passive: true });
  new MutationObserver(statusBar).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class", "hidden"] });
  setTimeout(statusBar, 50); setTimeout(statusBar, 800);

  function init() {
    reveal();
    if ($("#homeStats") && statsIO) statsIO.observe($("#homeStats"));
    slider($("#tabbar"), ".tab", "tab-thumb");
    slider($(".segmented"), ".seg", "seg-thumb");
    // المحتوى اللي ينبني بعدين (الفعاليات من الشيت، الصور…)
    new MutationObserver(() => reveal()).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
