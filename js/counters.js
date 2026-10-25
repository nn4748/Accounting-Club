// أرقام متحركة (count-up) لقسم "أرقامنا" — تصعد من صفر لين تصل
// الرقم الأصلي أول ما تدخل الشاشة. ما يغيّر أي نص نهائي، بس
// يحرّك الوصول له. يحترم prefers-reduced-motion بالكامل.
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  var els = document.querySelectorAll(".stat-num");
  if (!els.length) return;

  function parse(text) {
    var m = text.trim().match(/^([+\-]?)(\d+(?:\.\d+)?)([a-zA-Zأ-ي]*)$/);
    if (!m) return null;
    return {
      prefix: m[1] || "",
      value: parseFloat(m[2]),
      decimals: (m[2].split(".")[1] || "").length,
      suffix: m[3] || ""
    };
  }

  function format(n, parsed) {
    var v = parsed.decimals ? n.toFixed(parsed.decimals) : Math.round(n).toString();
    return parsed.prefix + v + parsed.suffix;
  }

  function animate(el, parsed) {
    var start = null;
    var duration = 1400;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = format(parsed.value * eased, parsed);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        var parsed = parse(entry.target.textContent);
        if (parsed) animate(entry.target, parsed);
      });
    },
    { threshold: 0.4 }
  );

  els.forEach(function (el) {
    io.observe(el);
  });
})();
