// ظهور ثلاثي الأبعاد عند التمرير لبطاقات الموقع (فعاليات، زيارات،
// فورم التسجيل...). يستخدم Web Animations API عشان ما يتعارض
// أبدًا مع أي transition مخصص موجود أصلًا على نفس العنصر (مثل
// hover الأصلي لبطاقات الفعاليات) — الحركتين تشتغلان بشكل مستقل
// تمامًا. يحترم prefers-reduced-motion بالكامل.
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (REDUCED || !("IntersectionObserver" in window) || !("animate" in document.createElement("div"))) return;

  var SELECTOR = [
    ".event-card",
    ".mini-card",
    ".past-card",
    ".visit-card",
    ".option-card",
    ".register-card",
    ".card",
    ".stat-pill",
    ".goal-item"
  ].join(",");

  var seen = new WeakSet();
  var batchIndex = 0;

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        var delay = Math.min(batchIndex % 6, 5) * 70;
        batchIndex++;
        entry.target.classList.remove("reveal-pending");
        entry.target.animate(
          [
            { opacity: 0, transform: "perspective(1000px) translateY(34px) rotateX(10deg) scale(.94)" },
            { opacity: 1, transform: "perspective(1000px) translateY(0) rotateX(0deg) scale(1)" }
          ],
          { duration: 650, delay: delay, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" }
        );
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  function tag(el) {
    if (seen.has(el) || el.closest("[data-reveal]")) return;
    seen.add(el);
    el.classList.add("reveal-pending");
    io.observe(el);
  }

  function scan(root) {
    (root || document).querySelectorAll(SELECTOR).forEach(tag);
  }

  scan();

  var mo = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.matches && node.matches(SELECTOR)) tag(node);
        if (node.querySelectorAll) scan(node);
      });
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });
})();
