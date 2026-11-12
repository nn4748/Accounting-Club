// عدّاد زيارات بسيط للموقع: يرسل نوع الصفحة فقط، بدون أي بيانات شخصية.
(function () {
  if (navigator.webdriver || location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    window.track = function () {};
    return;
  }
  let visitor = "";
  try {
    visitor = localStorage.getItem("accVisitor") || "";
    if (!visitor) {
      visitor = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("accVisitor", visitor);
    }
  } catch (e) { /* التخزين غير متاح */ }

  function send(name) {
    const data = JSON.stringify({ e: name, v: visitor });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon("/.netlify/functions/track", new Blob([data], { type: "application/json" }))) return;
    } catch (e) { /* نجرب fetch */ }
    fetch("/.netlify/functions/track", { method: "POST", body: data, keepalive: true }).catch(() => {});
  }
  window.track = send;

  const path = location.pathname.toLowerCase();
  const page =
    path === "/" || path.startsWith("/index") ? "home" :
    path.startsWith("/events") ? "events" :
    path.startsWith("/register") ? "register" :
    path.startsWith("/quiz") ? "quiz" :
    path.startsWith("/visits") ? "visits" :
    path.startsWith("/volunteer") ? "volunteer" :
    path.startsWith("/company") ? "company" :
    path.startsWith("/confirm") ? "confirm" : "other";
  send("view:" + page);
})();
