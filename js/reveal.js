// تأثير ظهور تدريجي خفيف عند التمرير، لعناصر البطاقات الرئيسية
// بكل صفحة. يحترم prefers-reduced-motion تمامًا ولا يغيّر أي
// محتوى أو تخطيط — بس يضيف انتقال opacity/transform بسيط.
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  // نقتصر على البطاقات اللي ما عندها أصلًا انتقال hover خاص بها،
  // عشان ما نتعارض مع transition المعرّف لها (مثل event-card,
  // mini-card, option-card, visit-card) ونفقدها حركتها الأصلية.
  var SELECTOR = [
    ".past-card",
    ".register-card",
    ".card"
  ].join(",");

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  function tag(el) {
    // ما نكرر الأثر على عنصر داخل [data-reveal] أصلًا (نظام الصفحة
    // الرئيسية الحالي) تفاديًا لتكرار الحركة على نفس العنصر.
    if (el.hasAttribute("data-reveal-auto") || el.closest("[data-reveal]")) return;
    el.setAttribute("data-reveal-auto", "");
    io.observe(el);
  }

  function scan(root) {
    (root || document).querySelectorAll(SELECTOR).forEach(tag);
  }

  scan();

  // البطاقات اللي تتولّد ديناميكيًا بعد تحميل الصفحة (الفعاليات
  // مثلًا تجيب من API) — نراقب إضافتها ونطبّق نفس الأثر عليها.
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
