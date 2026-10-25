// مؤشر مخصص (نقطة + حلقة تتبع المؤشر بنعومة) — توقيع بصري
// راقي يميّز الموقع، بدون أي لون جديد (يستخدم --sky الموجودة).
// يعمل بس على أجهزة فيها ماوس حقيقي، ويحترم prefers-reduced-motion.
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  var dot = document.createElement("div");
  dot.id = "cc-dot";
  var ring = document.createElement("div");
  ring.id = "cc-ring";
  document.body.appendChild(dot);
  document.body.appendChild(ring);
  document.documentElement.classList.add("custom-cursor-active");

  var mouseX = -100, mouseY = -100;
  var ringX = -100, ringY = -100;
  var started = false;

  window.addEventListener(
    "mousemove",
    function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = "translate(" + mouseX + "px," + mouseY + "px) translate(-50%,-50%)";
      if (!started) {
        started = true;
        ringX = mouseX;
        ringY = mouseY;
        ring.style.opacity = "1";
        dot.style.opacity = "1";
      }
    },
    { passive: true }
  );

  window.addEventListener("mouseleave", function () {
    dot.style.opacity = "0";
    ring.style.opacity = "0";
  });
  window.addEventListener("mouseenter", function () {
    dot.style.opacity = "1";
    ring.style.opacity = "1";
  });

  function loop() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = "translate(" + ringX + "px," + ringY + "px) translate(-50%,-50%)";
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  var HOVER_SELECTOR = "a, button, .btn, .register-btn, .btn-start, .btn-ghost, .event-card, .mini-card, .past-card, .visit-card, .option-card, .register-card, .card, .stat-pill, .social-pill, .speaker-btn, .game-answer-btn";

  document.addEventListener("mouseover", function (e) {
    if (e.target.closest(HOVER_SELECTOR)) ring.classList.add("cc-hover");
  });
  document.addEventListener("mouseout", function (e) {
    if (e.target.closest(HOVER_SELECTOR)) ring.classList.remove("cc-hover");
  });

  var TEXT_SELECTOR = "input, textarea, select, [contenteditable]";
  document.addEventListener("mouseover", function (e) {
    if (e.target.closest(TEXT_SELECTOR)) {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    }
  });
  document.addEventListener("mouseout", function (e) {
    if (e.target.closest(TEXT_SELECTOR)) {
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    }
  });
})();
