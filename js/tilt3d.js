// ميلان ثلاثي الأبعاد خفيف للبطاقات يتبع حركة الماوس + إضاءة
// لامعة تتبع المؤشر (عبر متغيرات --tilt-x/--tilt-y بـ polish.css).
// يعمل بس على أجهزة فيها ماوس حقيقي، ويحترم prefers-reduced-motion
// بالكامل. ما يلمس أي لون أو نص أو تخطيط — بس تحويل (transform).
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  var SELECTOR = [
    ".event-card",
    ".mini-card",
    ".past-card",
    ".visit-card",
    ".option-card",
    ".register-card",
    ".card",
    ".stat-pill"
  ].join(",");

  var MAX_TILT = 7; // درجات
  var SCALE = 1.035;

  var seen = new WeakSet();

  function bind(el) {
    if (seen.has(el)) return;
    seen.add(el);
    el.classList.add("tilt-ready");

    var frame = null;

    function onMove(e) {
      var rect = el.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width;
      var py = (e.clientY - rect.top) / rect.height;
      var rotateY = (px - 0.5) * MAX_TILT * 2;
      var rotateX = (0.5 - py) * MAX_TILT * 2;

      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function () {
        el.style.transition = "transform .08s linear";
        el.style.transform =
          "perspective(1000px) rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" +
          rotateY.toFixed(2) + "deg) scale(" + SCALE + ")";
        el.style.setProperty("--tilt-x", (px * 100).toFixed(1) + "%");
        el.style.setProperty("--tilt-y", (py * 100).toFixed(1) + "%");
      });
    }

    function onLeave() {
      if (frame) cancelAnimationFrame(frame);
      el.style.transition = "transform .5s cubic-bezier(.22,1,.36,1)";
      el.style.transform = "";
    }

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
  }

  function scan(root) {
    (root || document).querySelectorAll(SELECTOR).forEach(bind);
  }

  scan();

  // ===== أزرار "مغناطيسية" — تنجذب بخفة نحو المؤشر =====
  var MAGNET_SELECTOR = ".btn, .register-btn, .btn-start";
  var MAGNET_RANGE = 26; // أقصى انزياح بالبكسل
  var magnetSeen = new WeakSet();

  function bindMagnet(el) {
    if (magnetSeen.has(el)) return;
    magnetSeen.add(el);
    var frame = null;

    el.addEventListener("mousemove", function (e) {
      var rect = el.getBoundingClientRect();
      var dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      var dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function () {
        el.style.transition = "transform .12s linear";
        el.style.transform =
          "translate(" + (dx * MAGNET_RANGE * 0.3).toFixed(1) + "px," +
          (dy * MAGNET_RANGE * 0.3).toFixed(1) + "px)";
      });
    });
    el.addEventListener("mouseleave", function () {
      if (frame) cancelAnimationFrame(frame);
      el.style.transition = "transform .45s cubic-bezier(.22,1,.36,1)";
      el.style.transform = "";
    });
  }

  function scanMagnet(root) {
    (root || document).querySelectorAll(MAGNET_SELECTOR).forEach(bindMagnet);
  }

  scanMagnet();

  var mo = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.matches && node.matches(SELECTOR)) bind(node);
        if (node.matches && node.matches(MAGNET_SELECTOR)) bindMagnet(node);
        if (node.querySelectorAll) {
          scan(node);
          scanMagnet(node);
        }
      });
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });
})();
