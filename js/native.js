/* =========================================================
   مزايا تطبيق الآيفون (Capacitor) — تشتغل بس داخل التطبيق.
   بالمتصفح العادي هالملف ما يسوي شي.
   - اهتزاز خفيف عند الضغط على الأزرار
   - تذكير بالفعالية (إشعار محلي) بعد التسجيل
   - «فعالياتي»: الفعاليات اللي سجّل فيها الطالب
   ========================================================= */
(function () {
  const C = window.Capacitor;
  if (!C || typeof C.isNativePlatform !== "function" || !C.isNativePlatform()) return;
  const P = C.Plugins || {};
  document.documentElement.classList.add("is-app");

  // إشعارات الويب ما تشتغل داخل التطبيق، فنخفي زرها.
  const style = document.createElement("style");
  style.textContent = ".is-app #notifWidget{display:none!important}" +
    ".app-remind{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:10px;padding:13px 16px;border-radius:14px;border:0;background:#6ccff6;color:#000878;font:800 15px Almarai,system-ui,sans-serif;cursor:pointer}" +
    ".app-remind[disabled]{background:#e3f6ea;color:#157a43}";
  document.head.appendChild(style);

  try { P.StatusBar && P.StatusBar.setStyle({ style: "DARK" }); } catch (e) { /* */ }

  // اهتزاز خفيف مع كل ضغطة زر.
  document.addEventListener("click", (e) => {
    if (e.target.closest && e.target.closest("button, a, .btn")) {
      try { P.Haptics && P.Haptics.impact({ style: "LIGHT" }); } catch (err) { /* */ }
    }
  }, true);

  /* ---------- تاريخ ووقت الفعالية ---------- */
  function eventTime(ev) {
    const d = window.EventSheet ? EventSheet.parseDate(ev.date) : null;
    if (!d) return null;
    const t = String(ev.date || "").replace(/[٠-٩]/g, (x) => "٠١٢٣٤٥٦٧٨٩".indexOf(x));
    const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM|ص|م|صباحًا|مساءً|مساء|صباحا)/i);
    let h = 9, min = 0;
    if (m) {
      h = +m[1] % 12; min = +(m[2] || 0);
      if (/PM|م|مساء/i.test(m[3])) h += 12;
    }
    const when = new Date(d);
    when.setHours(h, min, 0, 0);
    return { when, hasTime: !!m };
  }

  const idOf = (s) => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) % 1e8; };

  const MY = "myEvents";
  const myEvents = () => { try { return JSON.parse(localStorage.getItem(MY)) || []; } catch (e) { return []; } };
  function saveMine(ev) {
    try {
      const list = myEvents().filter((x) => x.name !== ev.name);
      list.push({ name: ev.name, date: ev.date, location: ev.location || "", at: Date.now() });
      localStorage.setItem(MY, JSON.stringify(list));
    } catch (e) { /* */ }
  }

  // يجدول تذكيرين: الليلة اللي قبل الفعالية ٨ مساءً، وقبلها بساعة.
  async function remind(ev) {
    const LN = P.LocalNotifications;
    if (!LN) return { ok: false, reason: "unsupported" };
    const t = eventTime(ev);
    if (!t) return { ok: false, reason: "no_date" };
    const perm = await LN.requestPermissions();
    if (perm.display !== "granted") return { ok: false, reason: "denied" };
    const base = idOf(ev.name);
    const eve = new Date(t.when); eve.setDate(eve.getDate() - 1); eve.setHours(20, 0, 0, 0);
    const soon = new Date(t.when.getTime() - (t.hasTime ? 3600e3 : 0));
    if (!t.hasTime) soon.setHours(8, 0, 0, 0);
    const place = ev.location ? " · " + String(ev.location).replace(/📍/g, "").trim() : "";
    const list = [
      { id: base, title: "بكرة فعاليتك 📅", body: `«${ev.name}»${place}`, schedule: { at: eve } },
      { id: base + 1, title: t.hasTime ? "باقي ساعة على الفعالية ⏰" : "اليوم فعاليتك ⏰", body: `«${ev.name}»${place}`, schedule: { at: soon } },
    ].filter((n) => n.schedule.at > new Date());
    if (!list.length) return { ok: false, reason: "past" };
    await LN.schedule({ notifications: list.map((n) => Object.assign(n, { extra: { url: "/events" } })) });
    saveMine(ev);
    return { ok: true };
  }

  // زر «ذكّرني» تحت رسالة نجاح التسجيل.
  function onRegistered(ev, box) {
    if (!box || box.querySelector(".app-remind")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "app-remind";
    b.textContent = "🔔 ذكّرني بالفعالية";
    b.onclick = async () => {
      b.disabled = true;
      const r = await remind(ev).catch(() => ({ ok: false }));
      if (r.ok) b.textContent = "✓ بنذكّرك قبلها بيوم وقبلها بساعة";
      else {
        b.disabled = r.reason === "past";
        b.textContent = r.reason === "denied" ? "فعّل الإشعارات للتطبيق من الإعدادات" : r.reason === "past" ? "موعد الفعالية قريب جدًا" : "ما قدرنا نضبط التذكير";
      }
    };
    box.appendChild(b);
  }

  // لما يضغط على التذكير يفتح صفحة الفعاليات.
  try {
    P.LocalNotifications && P.LocalNotifications.addListener("localNotificationActionPerformed", (a) => {
      const url = a && a.notification && a.notification.extra && a.notification.extra.url;
      if (url) location.href = url;
    });
  } catch (e) { /* */ }

  window.AccNative = { remind, onRegistered, myEvents };
})();
