/* =========================================================
   التسجيل بالفعاليات داخل التطبيق (بدل صفحة register.html بالموقع)
   نفس منطق الموقع:
   - حالة الفعالية والحد من شيت الفعاليات (status / limit / responses)
   - نموذج الفعالية من عمود form، وإلا النموذج العام مع اسم الفعالية
   - تصحيح نطاق الإيميل، الجوال 05XXXXXXXX، منع التكرار بنفس الإيميل
   - بعد التسجيل: ذكّرني + موقع الفعالية + قروب الواتساب
   ========================================================= */
(function () {
  "use strict";
  const U = window.AppUI;
  const D = window.CLUB;
  const ES = window.EventSheet;
  const Cap = window.Capacitor;
  const P = (Cap && Cap.Plugins) || {};
  const { $, esc, tap, notify, toast, store } = U;

  /* ---------- تحققات (نسخة من js/register-checks.js) ---------- */
  const DOMAINS = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com", "live.com", "outlook.sa", "hotmail.co.uk", "sm.imamu.edu.sa", "imamu.edu.sa"];
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[m][n];
  }
  const cleanEmail = (raw) => String(raw || "").trim().replace(/\s+/g, "").replace(/[‎‏]/g, "").toLowerCase();
  function suggestEmail(raw) {
    const email = cleanEmail(raw);
    const at = email.lastIndexOf("@");
    if (at < 1) return null;
    const local = email.slice(0, at), domain = email.slice(at + 1);
    if (!domain || DOMAINS.includes(domain)) return null;
    let best = null, bestD = 3;
    for (const dm of DOMAINS) { const dist = levenshtein(domain, dm); if (dist < bestD) { best = dm; bestD = dist; } }
    if (best && bestD <= 2) return local + "@" + best;
    const fixed = domain.replace(/\.(con|cmo|comm|cm|om|vom|xom|co)$/, ".com");
    return fixed !== domain ? local + "@" + fixed : null;
  }
  const isValidEmail = (raw) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(cleanEmail(raw));
  function normalizePhone(raw) {
    let p = U.toLatin(raw).replace(/[\s\-().]/g, "");
    if (/^(\+|00)(?!966)\d{6,15}$/.test(p)) return { ok: true, value: p.replace(/^00/, "+") };
    p = p.replace(/^(\+|00)?966/, "");
    if (/^5\d{8}$/.test(p)) p = "0" + p;
    return /^05\d{8}$/.test(p) ? { ok: true, value: p } : { ok: false, value: p };
  }

  async function isDuplicate(email, source) {
    if (!source || !source.url) return false;
    try {
      const res = await fetch(source.url + (source.url.includes("?") ? "&" : "?") + "t=" + Date.now());
      if (!res.ok) return false;
      const rows = U.parseCSV(await res.text());
      const header = (rows[0] || []).map((h) => h.trim());
      const emailCol = header.findIndex((h) => /بريد|ايميل|إيميل|email/i.test(h));
      if (emailCol < 0) return false;
      const eventCol = source.eventName ? header.findIndex((h) => /اسم الفعالي/.test(h)) : -1;
      const target = cleanEmail(email);
      const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
      return rows.slice(1).some((r) => cleanEmail(r[emailCol]) === target && (eventCol < 0 || norm(r[eventCol]) === norm(source.eventName)));
    } catch (e) {
      return false; // لو ما قدرنا نتحقق ما نوقف التسجيل
    }
  }

  /* ---------- حقول نموذج Google ---------- */
  const FIELD_PATTERNS = {
    fullName: /^(?!.*فعالي).*اسم/,
    phone: /جوال|هاتف|موبايل|رقم/,
    email: /بريد|ايميل|إيميل|email|e-mail/i,
    major: /تخصص|قسم|كلية/,
  };
  function parseFormHtml(html) {
    const m = String(html || "").match(/FB_PUBLIC_LOAD_DATA_ = (.*?);<\/script>/s);
    if (!m) return null;
    const data = JSON.parse(m[1]);
    const entries = {};
    for (const q of (data[1] && data[1][1]) || []) {
      const title = String(q[1] || "");
      const entryId = q[4] && q[4][0] && q[4][0][0];
      if (!entryId) continue;
      for (const [key, re] of Object.entries(FIELD_PATTERNS)) {
        if (!entries[key] && re.test(title)) { entries[key] = "entry." + entryId; break; }
      }
    }
    return Object.keys(FIELD_PATTERNS).every((k) => entries[k]) ? entries : null;
  }

  // نقرأ النموذج من الجوال مباشرة (طلب أصلي بدون CORS)، والاحتياط دالة الموقع.
  async function formEntries(formId) {
    const key = "form:" + formId;
    const cached = store.get(key, null);
    if (cached && Date.now() - cached.t < 6 * 3600e3) return cached.entries;
    let entries = null;
    try {
      if (P.CapacitorHttp) {
        const r = await P.CapacitorHttp.get({ url: `https://docs.google.com/forms/d/e/${formId}/viewform`, responseType: "text" });
        entries = parseFormHtml(r && r.data);
      }
    } catch (e) { /* نجرب الاحتياط */ }
    if (!entries) {
      try {
        const info = await (await fetch(D.formFieldsApi + "?id=" + encodeURIComponent(formId))).json();
        if (info && info.ok) entries = info.entries;
      } catch (e) { /* */ }
    }
    if (entries) store.set(key, { t: Date.now(), entries });
    return entries;
  }

  /* ---------- حفظ محلي ---------- */
  const evKey = (ev) => String(ev.name || "").replace(/قريب[اًا]*ً?/g, "").replace(/\s+/g, " ").trim();
  const isRegistered = (ev) => store.get("registered", []).includes(evKey(ev));
  const markRegistered = (ev) => store.set("registered", store.get("registered", []).filter((x) => x !== evKey(ev)).concat(evKey(ev)));

  /* ---------- الواجهة ---------- */
  const STATE_MSG = {
    closed: ["🔒", "انتهى التسجيل", "اكتمل العدد أو انتهى التسجيل لهذي الفعالية."],
    postponed: ["⏳", "الفعالية مؤجلة", "الفعالية مؤجلة، والتسجيل مقفل حاليًا."],
    soon: ["🗓️", "التسجيل ما بدأ", "لم يتم بدء التسجيل حتى الآن، ترقّبونا."],
    hidden: ["🔒", "انتهى التسجيل", "التسجيل مقفل لهذي الفعالية."],
  };

  function stateOf(ev) {
    const s = ev._sheetStatus || (ES ? ES.status(ev) : "");
    if (s) return s;
    return /قريب/.test(ev.name + " " + (ev.description || "")) ? "soon" : "open";
  }

  function head(ev) {
    return `
      <div class="reg-head">
        <span class="reg-kicker">التسجيل في</span>
        <h2>${esc(ev.name)}</h2>
        ${ev.date ? `<span class="meta">${U.I.cal}${esc(ev.date)}</span>` : ""}
      </div>`;
  }

  function message(ev, st) {
    const [ic, title, text] = STATE_MSG[st] || STATE_MSG.closed;
    U.openSheet(`<div class="sheet-content reg">${head(ev)}<div class="card done"><div class="done-ic warn">${ic}</div><h3>${title}</h3><p>${text}</p></div></div>`);
  }

  async function open(ev) {
    const saved = store.get("profile", {});
    U.openSheet(`
      <div class="sheet-content reg">
        ${head(ev)}
        <form class="card form" id="regForm" novalidate>
          <label class="field"><span>الاسم الثلاثي</span><input id="rName" autocomplete="name" value="${esc(saved.name || "")}" required></label>
          <label class="field"><span>البريد الإلكتروني</span><input id="rEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="off" dir="ltr" value="${esc(saved.email || "")}" required></label>
          <div class="hint" id="rHint" hidden></div>
          <label class="field"><span>رقم الجوال</span><input id="rPhone" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" placeholder="05XXXXXXXX" value="${esc(saved.phone || "")}" required></label>
          <label class="field"><span>التخصص</span><input id="rMajor" value="${esc(saved.major || "")}" required></label>
          <label class="check"><input type="checkbox" id="rAgree"><span>أتعهد بالالتزام بالحضور والمشاركة</span></label>
          <p class="form-err" id="rErr" hidden></p>
          <button class="btn primary" type="submit" id="rSend">إرسال الطلب</button>
          <p class="fine">بياناتك تُرسل لنادي المحاسبة لتنظيم الفعالية فقط.</p>
        </form>
      </div>`);

    const form = $("#regForm"), err = $("#rErr"), btn = $("#rSend");
    const emailIn = $("#rEmail"), phoneIn = $("#rPhone"), hint = $("#rHint");
    let keptEmail = "";
    const showErr = (msg) => { err.textContent = msg; err.hidden = !msg; if (msg) notify("WARNING"); };

    // نجهّز النموذج والحالة بالخلفية وهو يعبّي
    const ready = (async () => {
      if (ES) { try { await ES.annotate([ev]); } catch (e) { /* */ } }
      const fid = ES && ES.formId(ev.form);
      if (fid) {
        const entries = await formEntries(fid);
        return entries ? { formId: fid, entries, own: true } : null;
      }
      return { formId: D.registerForm.id, entries: D.registerForm.entries, own: false };
    })();

    function emailSuggestion() {
      const value = cleanEmail(emailIn.value);
      const sug = value && value !== keptEmail ? suggestEmail(value) : null;
      if (!sug) { hint.hidden = true; return false; }
      if (!hint.hidden && hint.dataset.s === sug) return true;
      hint.dataset.s = sug;
      hint.innerHTML = `تأكد من بريدك، قصدك <b dir="ltr">${esc(sug)}</b>؟<span class="hint-btns"><button type="button" class="on" data-fix>تصحيح</button><button type="button" data-keep>لا، بريدي صحيح</button></span>`;
      $("[data-fix]", hint).onclick = () => { tap(); emailIn.value = sug; hint.hidden = true; };
      $("[data-keep]", hint).onclick = () => { tap(); keptEmail = value; hint.hidden = true; };
      hint.hidden = false;
      return true;
    }
    emailIn.addEventListener("blur", emailSuggestion);
    emailIn.addEventListener("input", () => { hint.hidden = true; err.hidden = true; });
    phoneIn.addEventListener("input", () => { err.hidden = true; });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      tap();
      const name = $("#rName").value.replace(/\s+/g, " ").trim();
      const major = $("#rMajor").value.trim();
      emailIn.value = cleanEmail(emailIn.value);
      if (name.length < 2) return showErr("اكتب اسمك الثلاثي");
      if (!isValidEmail(emailIn.value)) return showErr("اكتب بريدك الإلكتروني بشكل صحيح.");
      if (emailSuggestion()) return showErr("");
      const phone = normalizePhone(phoneIn.value);
      if (!phone.ok) return showErr("رقم الجوال لازم يبدأ بـ 05 ويكون ١٠ أرقام (مثال: 0501234567).");
      phoneIn.value = phone.value;
      if (!major) return showErr("اكتب تخصصك");
      if (!$("#rAgree").checked) return showErr("لازم توافق على التعهد قبل التسجيل.");
      showErr("");

      btn.disabled = true; btn.textContent = "جارِ التحقق...";
      const target = await ready;
      const st = stateOf(ev);
      if (st !== "open") { btn.disabled = false; btn.textContent = "إرسال الطلب"; return message(ev, st); }
      if (!target) {
        btn.disabled = false; btn.textContent = "إرسال الطلب";
        return showErr("نموذج الفعالية مو جاهز حاليًا، حاول بعد شوي.");
      }
      const dupSource = target.own
        ? (ES.sheetId(ev.responses) ? { url: `https://docs.google.com/spreadsheets/d/${ES.sheetId(ev.responses)}/export?format=csv` } : null)
        : { url: D.registerForm.responsesCsv, eventName: ev.name };
      if (await isDuplicate(emailIn.value, dupSource)) {
        btn.disabled = false; btn.textContent = "إرسال الطلب";
        markRegistered(ev);
        return showErr("هذا البريد مسجّل مسبقًا في الفعالية ✅ ما تحتاج تسجل مرة ثانية.");
      }

      btn.textContent = "جارِ الإرسال...";
      const body = new URLSearchParams();
      body.set(target.entries.fullName, name);
      body.set(target.entries.email, emailIn.value);
      body.set(target.entries.phone, phoneIn.value);
      body.set(target.entries.major, major);
      if (!target.own) body.set(target.entries.eventName, ev.name);
      try {
        await fetch(`https://docs.google.com/forms/d/e/${target.formId}/formResponse`, {
          method: "POST", mode: "no-cors",
          headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString(),
        });
      } catch (x) {
        btn.disabled = false; btn.textContent = "إرسال الطلب";
        return showErr("تعذّر الإرسال، تأكد من اتصالك وحاول مرة ثانية.");
      }
      store.set("profile", { name, email: emailIn.value, phone: phoneIn.value, major });
      markRegistered(ev);
      notify();
      success(ev);
    });
  }

  function success(ev) {
    const link = (url, label) => /^https?:\/\//.test(String(url || "").trim()) ? `<button class="btn ghost" data-url="${esc(String(url).trim())}">${label}</button>` : "";
    const links = [link(ev.map, "موقع الفعالية"), link(ev.whatsapp, "قروب الواتساب")].filter(Boolean);
    U.openSheet(`
      <div class="sheet-content reg">
        <div class="card done">
          <div class="done-ic">✓</div>
          <h3>تم التسجيل بنجاح</h3>
          <p>شكراً لك، سجّلناك في «${esc(ev.name)}».</p>
        </div>
        <div class="actions">
          ${U.remindBtn(ev)}
          ${links.length === 2 ? `<div class="actions-2">${links.join("")}</div>` : links.join("")}
          <button class="btn" style="background:#e9ebf2;color:var(--ink)" data-close>تم</button>
        </div>
      </div>`);
    U.sheet.querySelectorAll(".actions [data-url]").forEach((x) => x.addEventListener("click", () => { tap(); U.openUrl(x.dataset.url); }));
    U.bindRemind(ev);
  }

  window.Register = { open, isRegistered, _test: { suggestEmail, normalizePhone, parseFormHtml, isValidEmail } };
})();
