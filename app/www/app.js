/* تطبيق نادي المحاسبة */
(function () {
  "use strict";
  const D = window.CLUB;
  const ES = window.EventSheet;
  const Cap = window.Capacitor;
  const isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  const P = (Cap && Cap.Plugins) || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const I = {
    cal: '<svg class="ic" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    pin: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    clock: '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  };
  const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const AR_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  /* ---------- أدوات النظام ---------- */
  const tap = (style = "LIGHT") => { try { P.Haptics && P.Haptics.impact({ style }); } catch (e) { /* */ } };
  const notify = (type = "SUCCESS") => { try { P.Haptics && P.Haptics.notification({ type }); } catch (e) { /* */ } };

  function openUrl(url) {
    if (P.Browser && P.Browser.open) {
      P.Browser.open({ url, presentationStyle: "popover", toolbarColor: "#000878" }).catch(() => window.open(url, "_blank"));
    } else {
      window.open(url, "_blank");
    }
  }
  const openSite = (path) => openUrl(D.site + path);

  let toastT;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600);
  }

  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* */ } },
  };

  /* ---------- التواريخ ---------- */
  const toLatin = (s) => String(s || "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
  function parseYMD(raw) {
    const parts = toLatin(raw).trim().split(/[\/\-.]/).map((p) => parseInt(p, 10));
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const [y, m, d] = String(parts[0]).length === 4 ? parts : [parts[2], parts[1], parts[0]];
    const dt = new Date(y, m - 1, d);
    return dt.getMonth() === m - 1 ? dt : null;
  }
  const fmtDate = (dt) => `${dt.getDate()} ${AR_MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
  const fmtShort = (raw) => { const d = parseYMD(raw); return d ? fmtDate(d) : raw; };

  /* ---------- CSV ---------- */
  function parseCSV(text) {
    if (ES && ES.parseCSV) return ES.parseCSV(text);
    const rows = []; let row = [], cur = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
      else cur += c;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }

  /* =========================================================
     التنقل بين التبويبات
     ========================================================= */
  let current = "home";
  function go(tab) {
    if (tab === current) {
      $("#tab-" + tab).scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    current = tab;
    $$(".screen").forEach((s) => s.classList.toggle("is-active", s.id === "tab-" + tab));
    $$(".tab").forEach((t) => t.classList.toggle("is-on", t.dataset.tab === tab));
  }
  $$(".tab").forEach((t) => t.addEventListener("click", () => { tap(); go(t.dataset.tab); }));
  $$("[data-go]").forEach((b) => b.addEventListener("click", () => { tap(); go(b.dataset.go); }));
  $$(".screen").forEach((s) => s.addEventListener("scroll", () => s.classList.toggle("scrolled", s.scrollTop > 4), { passive: true }));

  // الشرائح بصفحة الفعاليات
  $$(".seg").forEach((b) => b.addEventListener("click", () => {
    tap();
    $$(".seg").forEach((x) => x.classList.toggle("is-on", x === b));
    $$(".seg-pane").forEach((p) => p.classList.toggle("is-on", p.dataset.pane === b.dataset.seg));
  }));

  /* =========================================================
     الورقة السفلية + عارض الصور
     ========================================================= */
  const sheet = $("#sheet");
  function openSheet(html) {
    $("#sheetBody").innerHTML = html;
    $("#sheetBody").scrollTop = 0;
    sheet.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add("open")));
    tap("MEDIUM");
  }
  function closeSheet() {
    sheet.classList.remove("open");
    setTimeout(() => { sheet.hidden = true; }, 380);
  }
  sheet.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeSheet(); });

  // سحب الورقة لتحت لإغلاقها
  (function dragToClose() {
    const panel = $(".sheet", sheet); const body = $("#sheetBody");
    let y0 = null, dy = 0;
    panel.addEventListener("touchstart", (e) => { if (body.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; panel.style.transition = "none"; } }, { passive: true });
    panel.addEventListener("touchmove", (e) => {
      if (y0 == null) return;
      dy = Math.max(0, e.touches[0].clientY - y0);
      if (dy > 0) panel.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    panel.addEventListener("touchend", () => {
      if (y0 == null) return;
      panel.style.transition = ""; panel.style.transform = "";
      if (dy > 110) closeSheet();
      y0 = null;
    });
  })();

  const viewer = $("#viewer");
  function openViewer(src) { $("#viewerImg").src = src; viewer.hidden = false; tap(); }
  viewer.addEventListener("click", (e) => { if (e.target.closest("[data-vclose]") || e.target === viewer) viewer.hidden = true; });

  /* =========================================================
     المحتوى الثابت
     ========================================================= */
  const ICONS = {
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>',
    build: '<svg viewBox="0 0 24 24"><path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6M3 20h18"/></svg>',
  };
  const SOCIAL_ICONS = {
    x: '<svg viewBox="0 0 24 24"><path d="M17.7 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.5 4.7H5.7z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24"><path d="M16.6 3c.4 2.3 1.9 3.9 4.4 4.1v3.2c-1.6.1-3-.4-4.4-1.3v6.1c0 7.6-8.3 9.9-11.6 4.5-2.1-3.5-.8-9.6 6.1-9.8v3.4c-.5.1-1.1.2-1.6.4-1.5.5-2.4 1.5-2.2 3.2.5 3.3 6.5 4.3 6-2.2V3z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4z"/></svg>',
  };

  $("#pillars").innerHTML = D.pillars.map((p) => `<span>${esc(p)}</span>`).join("");
  $("#aboutText").textContent = D.about;
  $("#visionText").textContent = D.vision;
  $("#goals").innerHTML = D.goals.map((g) => `<li>${esc(g)}</li>`).join("");
  $("#orgTitle").textContent = D.orgChartTitle;
  $("#homeStats").innerHTML = D.stats.map(([n, l]) => `<div class="stat"><b>${esc(n)}</b><small>${esc(l)}</small></div>`).join("");

  $("#tools").innerHTML = D.tools.map((t, i) => `
    <button class="card tool press" data-tool="${i}">
      <span class="tool-ic">${ICONS[t.icon]}</span>
      <span class="tool-main"><b>${esc(t.title)}</b><small>${esc(t.sub)}</small></span>
      <span class="chev">‹</span>
    </button>`).join("");
  $("#tools").addEventListener("click", (e) => { const b = e.target.closest("[data-tool]"); if (b) { tap(); openSite(D.tools[b.dataset.tool].path); } });

  $("#socials").innerHTML = D.socials.map((s) => `
    <button class="row" data-url="${esc(s.url)}">
      <span class="row-ic">${SOCIAL_ICONS[s.key]}</span>
      <span class="row-main">${esc(s.label)}<small>${esc(s.handle)}</small></span>
      <span class="chev">‹</span>
    </button>`).join("");
  $("#socials").addEventListener("click", (e) => { const b = e.target.closest("[data-url]"); if (b) { tap(); openUrl(b.dataset.url); } });
  $$("[data-open]").forEach((b) => b.addEventListener("click", () => { tap(); openSite(b.dataset.open); }));
  $("#mailRow").addEventListener("click", () => { tap(); window.location.href = "mailto:" + D.email; });
  $("#orgBtn").addEventListener("click", () => openViewer("assets/org-chart.webp"));

  // الصور (الأرشيف والزيارات)
  const thumb = (it, kind, i) => `
    <button class="thumb press" data-kind="${kind}" data-i="${i}">
      <div class="ph"><img src="${esc(it.img)}" alt="" loading="lazy"></div>
      <h4>${esc(it.title)}</h4><small>${esc(fmtShort(it.date))}</small>
    </button>`;
  $("#eventsArchive").innerHTML = D.archive.map((it, i) => thumb(it, "archive", i)).join("");
  $("#visitsGrid").innerHTML = D.visits.map((it, i) => thumb(it, "visits", i)).join("");
  $("#homeVisits").innerHTML = D.visits.slice(0, 8).map((it, i) => thumb(it, "visits", i)).join("");

  document.addEventListener("click", (e) => {
    const b = e.target.closest(".thumb[data-kind]");
    if (!b) return;
    const it = D[b.dataset.kind][+b.dataset.i];
    openSheet(`
      <div class="sheet-hero"><img src="${esc(it.img)}" alt="" data-zoom></div>
      <div class="sheet-content">
        <h2>${esc(it.title)}</h2>
        <div class="info"><div class="info-row"><span class="i">${I.cal}</span><div>${esc(fmtShort(it.date))}<small>${b.dataset.kind === "visits" ? "زيارة ميدانية" : "من فعاليات النادي"}</small></div></div></div>
      </div>`);
  });
  $("#sheetBody").addEventListener("click", (e) => { const z = e.target.closest("[data-zoom]"); if (z) openViewer(z.src); });

  /* =========================================================
     الفعاليات القادمة (التقويم)
     ========================================================= */
  function renderUpcoming(list) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const items = list
      .map((r) => ({ name: (r[0] || "").trim(), date: parseYMD(r[1]), place: (r[2] || "").trim(), time: (r[3] || "").trim() }))
      .filter((x) => x.name && x.date && x.date >= today)
      .sort((a, b) => a.date - b.date);
    const card = (x, i) => `
      <button class="card date-card press" data-up="${i}">
        <span class="date-badge"><b>${x.date.getDate()}</b><small>${AR_MONTHS[x.date.getMonth()]}</small></span>
        <span class="date-info">
          <h4>${esc(x.name)}</h4>
          ${x.place ? `<span class="meta">${I.pin}${esc(x.place)}</span>` : ""}
          ${x.time ? `<span class="meta">${I.clock}${esc(x.time)}</span>` : ""}
        </span>
      </button>`;
    $("#homeUpcomingBlock").hidden = !items.length;
    $("#homeUpcoming").innerHTML = items.map(card).join("");
    $("#eventsUpcoming").innerHTML = items.length
      ? items.map(card).join("")
      : `<div class="empty"><b>🗓️</b>ما فيه فعاليات قادمة مجدولة حاليًا، ترقّبونا ✨</div>`;
    renderUpcoming.items = items;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-up]");
    if (!b) return;
    const x = renderUpcoming.items[+b.dataset.up];
    const ev = { name: x.name, date: `${x.date.getFullYear()}/${x.date.getMonth() + 1}/${x.date.getDate()} ${x.time}`, location: x.place };
    openSheet(`
      <div class="sheet-hero" style="aspect-ratio:16/7"><div class="ph"><img src="assets/club-mark-white.webp" alt=""></div></div>
      <div class="sheet-content">
        <h2>${esc(x.name)}</h2>
        <div class="info">
          <div class="info-row"><span class="i">${I.cal}</span><div>${AR_DAYS[x.date.getDay()]}، ${fmtDate(x.date)}</div></div>
          ${x.time ? `<div class="info-row"><span class="i">${I.clock}</span><div>${esc(x.time)}</div></div>` : ""}
          ${x.place ? `<div class="info-row"><span class="i">${I.pin}</span><div>${esc(x.place)}</div></div>` : ""}
        </div>
        <div class="actions">${remindBtn(ev)}</div>
      </div>`);
    bindRemind(ev);
  });

  async function loadUpcoming() {
    const cached = store.get("upcoming", null);
    if (cached) renderUpcoming(cached);
    try {
      const res = await fetch(D.upcomingCsv + "&t=" + Date.now());
      if (!res.ok) throw 0;
      const rows = parseCSV(await res.text()).slice(1);
      store.set("upcoming", rows);
      renderUpcoming(rows);
    } catch (e) {
      if (!cached) renderUpcoming([]);
    }
  }

  /* =========================================================
     الفعاليات المتاحة للتسجيل
     ========================================================= */
  let events = [];
  const STATE_LABEL = { open: "التسجيل مفتوح", soon: "قريبًا", closed: "انتهى التسجيل", postponed: "مؤجلة" };
  const img = (url) => (ES && ES.driveImage ? ES.driveImage(url, 900) : url);
  const stateOf = (ev) => {
    const s = ev._sheetStatus || (ES ? ES.status(ev) : "");
    if (s) return s;
    return /قريب/.test(ev.name + " " + (ev.description || "")) ? "soon" : "open";
  };
  const cleanLoc = (s) => String(s || "").replace(/📍/g, "").trim();

  function eventCard(ev, i) {
    const st = stateOf(ev);
    const pic = ev.image ? `<img src="${esc(img(ev.image))}" alt="" loading="lazy" onerror="this.remove()">` : "";
    return `
      <button class="card event press" data-ev="${i}">
        <div class="event-img"><div class="ph"><img src="assets/club-mark-white.webp" alt=""></div>${pic}</div>
        <div class="event-body">
          <h3>${esc(ev.name)}</h3>
          <div class="event-meta">
            ${ev.date ? `<span>${I.cal}${esc(ev.date)}</span>` : ""}
            ${cleanLoc(ev.location) ? `<span>${I.pin}${esc(cleanLoc(ev.location).split("\n")[0])}</span>` : ""}
          </div>
          <div class="event-foot">
            <span class="chip ${st}">${STATE_LABEL[st] || STATE_LABEL.open}</span>
            <span class="go">التفاصيل ‹</span>
          </div>
        </div>
      </button>`;
  }

  function renderEvents(list, failed) {
    events = list;
    const empty = failed
      ? `<div class="card empty"><b>📡</b>تعذّر تحميل الفعاليات. تأكد من اتصالك بالإنترنت.<br><br><button class="btn ghost" data-retry>إعادة المحاولة</button></div>`
      : `<div class="card empty"><b>✨</b>لا توجد فعاليات متاحة حاليًا، ترقّبوا فعالياتنا القادمة</div>`;
    $("#eventsOpen").innerHTML = list.length ? list.map(eventCard).join("") : empty;
    $("#homeOpen").innerHTML = list.length ? list.slice(0, 2).map(eventCard).join("") : empty;
  }
  document.addEventListener("click", (e) => { if (e.target.closest("[data-retry]")) { tap(); loadEvents(); } });

  async function loadEvents() {
    const cached = store.get("events", null);
    if (cached && cached.length) renderEvents(cached.filter((e) => !ES || ES.visible(e)));
    try {
      const res = await fetch(D.eventsApi + "?t=" + Date.now());
      let list = await res.json();
      if (!Array.isArray(list)) throw 0;
      store.set("events", list);
      if (ES) { list = list.filter((e) => ES.visible(e)); await ES.annotate(list); }
      renderEvents(list);
    } catch (e) {
      if (!cached || !cached.length) renderEvents([], true);
    }
  }

  function registerUrl(ev) {
    const q = new URLSearchParams({
      id: ev.id || ev.event_id || "", name: ev.name || "", date: ev.date || "",
      location: ev.location || "", description: ev.description || "", image: img(ev.image) || "",
    });
    return D.site + "/register.html?" + q.toString();
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ev]");
    if (!b) return;
    const ev = events[+b.dataset.ev];
    const st = stateOf(ev);
    const action = st === "open"
      ? `<button class="btn primary" data-reg>سجّل الآن</button>`
      : `<button class="btn" disabled style="background:#e9ebf2;color:#6b6f86">${STATE_LABEL[st]}</button>`;
    openSheet(`
      <div class="sheet-hero contain"><div class="ph"><img src="assets/club-mark-white.webp" alt=""></div>${ev.image ? `<img src="${esc(img(ev.image))}" alt="" data-zoom onerror="this.remove()">` : ""}</div>
      <div class="sheet-content">
        <span><span class="chip ${st}">${STATE_LABEL[st] || STATE_LABEL.open}</span></span>
        <h2>${esc(ev.name)}</h2>
        <div class="info">
          ${ev.date ? `<div class="info-row"><span class="i">${I.cal}</span><div>${esc(ev.date)}</div></div>` : ""}
          ${cleanLoc(ev.location) ? `<div class="info-row"><span class="i">${I.pin}</span><div>${esc(cleanLoc(ev.location))}</div></div>` : ""}
        </div>
        ${ev.description ? `<p class="desc">${esc(ev.description)}</p>` : ""}
        <div class="actions">
          ${action}
          ${remindBtn(ev)}
          ${ev.map || ev.whatsapp ? `<div class="actions-2">
            ${ev.map ? `<button class="btn ghost" data-url="${esc(ev.map)}">موقع الفعالية</button>` : ""}
            ${ev.whatsapp ? `<button class="btn ghost" data-url="${esc(ev.whatsapp)}">قروب الواتساب</button>` : ""}
          </div>` : ""}
        </div>
      </div>`);
    const reg = $("[data-reg]", sheet);
    if (reg) reg.addEventListener("click", () => { tap(); openUrl(registerUrl(ev)); });
    $$(".actions [data-url]", sheet).forEach((x) => x.addEventListener("click", () => { tap(); openUrl(x.dataset.url); }));
    bindRemind(ev);
  });

  /* =========================================================
     التذكير بالفعالية (إشعار محلي)
     ========================================================= */
  const idOf = (s) => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) % 1e8; };
  const reminded = () => store.get("reminders", []);

  function eventTime(ev) {
    const d = ES ? ES.parseDate(ev.date) : parseYMD(ev.date);
    if (!d) return null;
    const t = toLatin(ev.date);
    const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM|ص|م|صباحًا|مساءً|مساء|صباحا)/i);
    let h = 9, min = 0;
    if (m) { h = +m[1] % 12; min = +(m[2] || 0); if (/PM|م|مساء/i.test(m[3])) h += 12; }
    const when = new Date(d); when.setHours(h, min, 0, 0);
    return { when, hasTime: !!m };
  }

  function remindBtn(ev) {
    if (!isNative || !eventTime(ev)) return "";
    const on = reminded().includes(ev.name);
    return `<button class="btn ${on ? "done" : "sky"}" data-remind ${on ? "disabled" : ""}>${on ? "✓ بنذكّرك بالفعالية" : "ذكّرني بالفعالية"}</button>`;
  }

  function bindRemind(ev) {
    const b = $("[data-remind]", sheet);
    if (!b) return;
    b.addEventListener("click", async () => {
      tap();
      const LN = P.LocalNotifications;
      const t = eventTime(ev);
      if (!LN || !t) return;
      try {
        const perm = await LN.requestPermissions();
        if (perm.display !== "granted") { toast("فعّل الإشعارات للتطبيق من الإعدادات"); return; }
        const base = idOf(ev.name);
        const eve = new Date(t.when); eve.setDate(eve.getDate() - 1); eve.setHours(20, 0, 0, 0);
        const soon = new Date(t.when.getTime() - (t.hasTime ? 3600e3 : 0));
        if (!t.hasTime) soon.setHours(8, 0, 0, 0);
        const place = cleanLoc(ev.location) ? " · " + cleanLoc(ev.location).split("\n")[0] : "";
        const list = [
          { id: base, title: "بكرة فعاليتك 📅", body: `«${ev.name}»${place}`, schedule: { at: eve } },
          { id: base + 1, title: t.hasTime ? "باقي ساعة على الفعالية ⏰" : "اليوم فعاليتك ⏰", body: `«${ev.name}»${place}`, schedule: { at: soon } },
        ].filter((n) => n.schedule.at > new Date());
        if (!list.length) { toast("موعد الفعالية قريب جدًا أو فات"); return; }
        await LN.schedule({ notifications: list });
        store.set("reminders", reminded().concat(ev.name));
        b.className = "btn done"; b.disabled = true; b.textContent = "✓ بنذكّرك بالفعالية";
        notify();
        toast("تم! بنذكّرك قبلها بيوم وقبلها بساعة");
      } catch (err) {
        toast("ما قدرنا نضبط التذكير، حاول مرة ثانية");
      }
    });
  }

  /* =========================================================
     نموذج التواصل
     ========================================================= */
  $("#contactForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#cName").value.trim(), email = $("#cEmail").value.trim();
    const purpose = $("#cPurpose").value, details = $("#cDetails").value.trim();
    const err = $("#cErr");
    let msg = "";
    if (!name) msg = "اكتب اسمك";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) msg = "تأكد من البريد الإلكتروني";
    else if (!purpose) msg = "اختر الغرض من التواصل";
    else if (!details) msg = "اكتب التفاصيل";
    err.hidden = !msg; err.textContent = msg;
    if (msg) { notify("WARNING"); return; }
    const btn = $("#cSend"); btn.disabled = true; btn.textContent = "جارِ الإرسال...";
    const F = D.contactForm;
    const body = new URLSearchParams();
    body.set(F.name, name); body.set(F.email, email); body.set(F.purpose, purpose); body.set(F.details, details);
    try {
      await fetch(`https://docs.google.com/forms/d/e/${F.id}/formResponse`, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString(),
      });
      $("#contactForm").hidden = true; $("#contactDone").hidden = false; notify();
    } catch (x) {
      err.hidden = false; err.textContent = "تعذّر الإرسال، تأكد من اتصالك وحاول مرة ثانية";
      btn.disabled = false; btn.textContent = "إرسال";
    }
  });

  /* =========================================================
     التشغيل
     ========================================================= */
  try { P.StatusBar && P.StatusBar.setStyle({ style: "LIGHT" }); } catch (e) { /* */ }
  try { P.SplashScreen && P.SplashScreen.hide(); } catch (e) { /* */ }

  loadEvents();
  loadUpcoming();

  // تحديث البيانات لما يرجع المستخدم للتطبيق
  let lastLoad = Date.now();
  const refresh = () => { if (Date.now() - lastLoad > 60e3) { lastLoad = Date.now(); loadEvents(); loadUpcoming(); } };
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
  try { P.App && P.App.addListener("appStateChange", (s) => { if (s.isActive) refresh(); }); } catch (e) { /* */ }

  // إشعار التذكير يفتح صفحة الفعاليات
  try { P.LocalNotifications && P.LocalNotifications.addListener("localNotificationActionPerformed", () => go("events")); } catch (e) { /* */ }
})();
