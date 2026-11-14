/* =========================================================
   تحققات نموذج التسجيل قبل الإرسال:
   ١) تنبيه لأخطاء الإيميل الشائعة (gmail.con ← gmail.com)
   ٢) توحيد رقم الجوال بصيغة 05XXXXXXXX
   ٣) منع التسجيل المكرر بنفس الإيميل
   ========================================================= */
(function () {
  const DOMAINS = [
    "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com",
    "live.com", "outlook.sa", "hotmail.co.uk", "sm.imamu.edu.sa", "imamu.edu.sa",
  ];

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

  const toLatinDigits = (s) => String(s || "")
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));

  function cleanEmail(raw) {
    return String(raw || "").trim().replace(/\s+/g, "").replace(/[‎‏]/g, "").toLowerCase();
  }

  // يرجّع الإيميل المقترح لو فيه خطأ شائع بالنطاق، أو null.
  function suggestEmail(raw) {
    const email = cleanEmail(raw);
    const at = email.lastIndexOf("@");
    if (at < 1) return null;
    const local = email.slice(0, at);
    const domain = email.slice(at + 1);
    if (!domain || DOMAINS.includes(domain)) return null;
    let best = null, bestD = 3;
    for (const d of DOMAINS) {
      const dist = levenshtein(domain, d);
      if (dist < bestD) { best = d; bestD = dist; }
    }
    if (best && bestD <= 2) return local + "@" + best;
    // نهايات غلط مثل .con أو .cmo
    const fixed = domain.replace(/\.(con|cmo|comm|cm|om|vom|xom|co)$/, ".com");
    return fixed !== domain ? local + "@" + fixed : null;
  }

  function isValidEmail(raw) {
    return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(cleanEmail(raw));
  }

  // توحيد الجوال السعودي: 05XXXXXXXX. الأرقام الدولية (غير السعودية) تبقى مثل ما هي.
  function normalizePhone(raw) {
    let p = toLatinDigits(raw).replace(/[\s\-().]/g, "");
    if (/^(\+|00)(?!966)\d{6,15}$/.test(p)) return { ok: true, value: p.replace(/^00/, "+") };
    p = p.replace(/^(\+|00)?966/, "");
    if (/^5\d{8}$/.test(p)) p = "0" + p;
    return /^05\d{8}$/.test(p) ? { ok: true, value: p } : { ok: false, value: p };
  }

  function parseCSV(text) {
    const rows = [];
    let row = [], value = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i], n = text[i + 1];
      if (c === '"' && q && n === '"') { value += '"'; i++; }
      else if (c === '"') q = !q;
      else if (c === "," && !q) { row.push(value); value = ""; }
      else if ((c === "\n" || c === "\r") && !q) {
        if (c === "\r" && n === "\n") i++;
        row.push(value); rows.push(row); row = []; value = "";
      } else value += c;
    }
    if (value !== "" || row.length) { row.push(value); rows.push(row); }
    return rows;
  }

  // هل الإيميل مسجل قبل؟ source = { url: رابط CSV, eventName: (اختياري) لو الشيت مشترك بين فعاليات }
  async function isDuplicate(email, source) {
    if (!source || !source.url) return false;
    try {
      const res = await fetch(source.url + (source.url.includes("?") ? "&" : "?") + "t=" + Date.now());
      if (!res.ok) return false;
      const rows = parseCSV(await res.text());
      const header = (rows[0] || []).map((h) => h.trim());
      const emailCol = header.findIndex((h) => /بريد|ايميل|إيميل|email/i.test(h));
      if (emailCol < 0) return false;
      const eventCol = source.eventName ? header.findIndex((h) => /اسم الفعالي/.test(h)) : -1;
      const target = cleanEmail(email);
      const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
      return rows.slice(1).some((r) => cleanEmail(r[emailCol]) === target
        && (eventCol < 0 || norm(r[eventCol]) === norm(source.eventName)));
    } catch (e) {
      return false; // لو ما قدرنا نتحقق ما نوقف التسجيل
    }
  }

  window.RegisterChecks = { suggestEmail, isValidEmail, cleanEmail, normalizePhone, isDuplicate };
})();
