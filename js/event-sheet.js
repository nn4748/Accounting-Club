/* =========================================================
   التحكم بالفعاليات من شيت الفعاليات (Events)
   أعمدة اختيارية في الشيت:
     status    : قريبًا (أو مغلق حاليًا) | مفتوح | مقفل | مؤجلة   (فاضي = السلوك القديم)
     limit     : حد المسجلين (رقم) — يحتاج عمود responses
     form      : رابط نموذج Google الخاص بالفعالية
     responses : رابط شيت ردود النموذج (لعدّ المسجلين)
   وأي فعالية يعدّي تاريخها تختفي تلقائيًا (إلا المؤجلة).
   ========================================================= */
(function () {
  const STATUS = [
    ["postponed", /مؤجل/],
    // "مغلق حاليًا" أو "مؤقتًا" أو "لم يبدأ" = التسجيل ما بدأ للحين (مو منتهي).
    ["soon", /قريب|حالي|مؤقت|لم يبدأ|ما بدأ|لم يتم/],
    ["closed", /مقفل|مغلق|انتهى|مكتمل/],
    ["open", /مفتوح|متاح/],
  ];

  function status(event) {
    const raw = String((event && event.status) || "").trim();
    if (!raw) return "";
    for (const [key, re] of STATUS) if (re.test(raw)) return key;
    return "";
  }

  function limit(event) {
    const n = parseInt(String((event && event.limit) || "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)), 10);
    return n > 0 ? n : null;
  }

  function sheetId(url) {
    const m = String(url || "").match(/spreadsheets\/d\/([\w-]+)/);
    return m ? m[1] : null;
  }

  function formId(url) {
    const m = String(url || "").match(/forms\/d\/e\/([\w-]+)/);
    return m ? m[1] : null;
  }

  /* ---------- التاريخ ---------- */
  const EN_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  function withYear(month, day, year) {
    if (year) return new Date(year, month, day);
    const now = new Date();
    let d = new Date(now.getFullYear(), month, day);
    // تاريخ بدون سنة وفات عليه أكثر من ٦ شهور = غالبًا السنة الجاية.
    if (now - d > 180 * 864e5) d = new Date(now.getFullYear() + 1, month, day);
    return d;
  }

  function parseDate(text) {
    const s = String(text || "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/إ|آ/g, "أ");
    let m = s.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    m = s.match(/(\d{1,2})\s*([A-Za-z]{3,})/);
    if (m) {
      const idx = EN_MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
      if (idx >= 0) return withYear(idx, +m[1]);
    }
    m = s.match(/(\d{1,2})\s*(يناير|فبراير|مارس|أبريل|ابريل|مايو|يونيو|يوليو|أغسطس|اغسطس|سبتمبر|أكتوبر|اكتوبر|نوفمبر|ديسمبر)/);
    if (m) {
      const name = m[2].replace(/^ا/, "أ");
      const idx = AR_MONTHS.indexOf(name);
      if (idx >= 0) return withYear(idx, +m[1]);
    }
    return null;
  }

  function isPast(event) {
    if (status(event) === "postponed") return false;
    const d = parseDate(event && event.date);
    if (!d) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }

  /* ---------- عدد المسجلين ---------- */
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

  async function count(event) {
    const id = sheetId(event && event.responses);
    if (!id) return null;
    try {
      const res = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&t=${Date.now()}`);
      if (!res.ok) return null;
      const rows = parseCSV(await res.text()).filter((r) => r.some((v) => v.trim()));
      return Math.max(0, rows.length - 1);
    } catch (e) {
      return null;
    }
  }

  // تحسب حالة كل فعالية من الشيت (مع عدد المسجلين لو فيه حد).
  async function annotate(events) {
    await Promise.all((events || []).map(async (e) => {
      const lim = limit(e);
      e._sheetStatus = status(e);
      if (lim && e.responses) {
        const c = await count(e);
        if (c !== null && c >= lim && e._sheetStatus !== "postponed" && e._sheetStatus !== "soon") e._sheetStatus = "closed";
      }
    }));
    return events;
  }

  // صور Google Drive: نطلب نسخة بعرض مناسب بدل الأصلية الكبيرة.
  function driveImage(url, width) {
    if (!url) return url;
    const m = String(url).match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]+)/)
      || String(url).match(/lh3\.googleusercontent\.com\/d\/([\w-]+)/);
    if (!m) return url;
    return `https://lh3.googleusercontent.com/d/${m[1]}=w${width || 900}`;
  }

  // نسخة محفوظة من آخر بيانات، عشان الصفحة تعرضها فورًا وهي تجيب الجديد.
  const cache = {
    get(key, maxAgeMs) {
      try {
        const raw = JSON.parse(localStorage.getItem("cache:" + key));
        if (!raw || Date.now() - raw.t > (maxAgeMs || 7 * 864e5)) return null;
        return raw.d;
      } catch (e) { return null; }
    },
    set(key, data) {
      try { localStorage.setItem("cache:" + key, JSON.stringify({ t: Date.now(), d: data })); } catch (e) { /* ممتلئ أو غير متاح */ }
    },
  };

  window.EventSheet = { status, limit, formId, sheetId, parseDate, isPast, count, annotate, parseCSV, driveImage, cache };
})();
