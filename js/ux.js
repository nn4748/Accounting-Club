// شريط تقدّم القراءة أعلى الصفحة — يملأ مع تمرير الزائر للأسفل.
// العنصر يُضاف بالكامل عبر JS (بدون أي تعديل على HTML الموجود).
(function () {
  "use strict";

  var bar = document.createElement("div");
  bar.id = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  var ticking = false;
  function update() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var ratio = height > 0 ? scrollTop / height : 0;
    bar.style.transform = "scaleX(" + Math.min(Math.max(ratio, 0), 1) + ")";
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
  window.addEventListener("resize", update);
  update();
})();
