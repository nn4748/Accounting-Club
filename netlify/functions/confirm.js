// تأكيد الحضور للفعاليات — الإعدادات من تبويب "تأكيد الحضور" بشيت الفعاليات:
//   الفعالية | الرمز | الحالة (مفتوح/مقفل/منتهية/مخفي) | شيت المسجلين | الموعد | المكان
//   | جهة التسجيل | رابط جهة التسجيل | صورة إثبات (نعم/لا) | رابط القروب
//
// للطلاب (بدون كلمة مرور):
//   events  : الفعاليات المفتوح تأكيدها.
//   check   : يتأكد إن الإيميل مسجل بشيت المسجلين، ويحفظ تأكيد الحضور.
//   partner : يرفع صورة تسجيله عند الجهة ← نحفظها ونرجّع رابط القروب.
// للموارد (بكلمة المرور):
//   hr-events, hr-list, review-set, send-email
// روابط القروب محفوظة بالخادم، وما تنكشف للصفحة إلا بعد الخطوات.
const crypto = require("crypto");
const { getStore, connectLambda } = require("@netlify/blobs");

const EVENTS_SHEET = "1M0VZlDs8J5FWIFc1OTWRYbMfpCX82hzaQpk4jTr2QuU";
const CONFIG_GID = "510001";
// أول فعالية (ما وراء الأرقام) بياناتها بالمخازن القديمة، ونستخدمها لو الشيت ما فتح.
const LEGACY = "beyond-numbers";
const LEGACY_EVENT = {
  slug: LEGACY, name: "ما وراء الأرقام", status: "ended",
  responsesSheetId: "1HztJpguUJqsqUlxa-WZEVs62abHzXtucnmP56zGrlsI",
  when: "يوم الأحد ١٥ نوفمبر من ٥ إلى ٧ مساءً", place: "مركز دعم منشآت - الرياض",
  partner: "منشآت", partnerLink: "https://www.monshaat.gov.sa/ar/node/526412", photo: true,
  groupLink: "https://chat.whatsapp.com/Hbf0DNMEIMm5wB9GpNsLwd?s=cl&p=i&mlu=4&ilr=4&iam=2",
};

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

const normEmail = (s) => String(s || "").trim().toLowerCase();
const keyOf = (email) => normEmail(email).replace(/[^a-z0-9@._+-]/g, "_");
const sheetIdOf = (url) => (String(url || "").match(/spreadsheets\/d\/([\w-]+)/) || [])[1] || "";

function statusOf(raw) {
  const s = String(raw || "").trim();
  if (/مخفي|hidden/i.test(s)) return "hidden";
  if (/منته|انته|ended/i.test(s)) return "ended";
  if (/مقفل|مغلق|closed/i.test(s)) return "closed";
  return "open";
}

/* ---------- إعدادات الفعاليات من الشيت ---------- */
let cache = { at: 0, list: null };
async function loadEvents() {
  if (cache.list && Date.now() - cache.at < 30e3) return cache.list;
  let list = [];
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${EVENTS_SHEET}/export?format=csv&gid=${CONFIG_GID}&t=${Date.now()}`);
    if (!res.ok) throw new Error("config " + res.status);
    const rows = parseCSV(await res.text());
    const header = (rows[0] || []).map((h) => h.trim());
    const col = (re) => header.findIndex((h) => re.test(h));
    const c = {
      name: col(/^الفعالية|^الاسم/), slug: col(/الرمز/), status: col(/الحالة/), responses: col(/شيت/),
      when: col(/الموعد|التاريخ/), place: col(/المكان/), partnerLink: col(/رابط جهة/), partner: col(/^جهة/),
      photo: col(/صورة/), group: col(/قروب/),
    };
    const cell = (r, i) => (i >= 0 ? String(r[i] || "").trim() : "");
    list = rows.slice(1).map((r) => {
      const name = cell(r, c.name);
      if (!name) return null;
      let slug = cell(r, c.slug).toLowerCase();
      if (!/^[a-z0-9-]{1,40}$/.test(slug)) slug = "e" + crypto.createHash("md5").update(name).digest("hex").slice(0, 8);
      const partnerLink = cell(r, c.partnerLink);
      return {
        slug, name, status: statusOf(cell(r, c.status)),
        responsesSheetId: sheetIdOf(cell(r, c.responses)),
        when: cell(r, c.when), place: cell(r, c.place),
        partner: cell(r, c.partner), partnerLink,
        photo: !!partnerLink && !/^(لا|no)$/i.test(cell(r, c.photo)),
        groupLink: cell(r, c.group),
      };
    }).filter((e) => e && e.responsesSheetId);
  } catch (e) {
    list = cache.list || [];
  }
  if (!list.some((e) => e.slug === LEGACY)) list.push(LEGACY_EVENT);
  cache = { at: Date.now(), list };
  return list;
}

// مخازن كل فعالية — "ما وراء الأرقام" باقية على المخازن القديمة.
function storesOf(slug) {
  const sfx = slug === LEGACY ? "" : "-" + slug;
  return {
    conf: getStore("confirmations" + sfx),
    proofs: getStore("confirmation-proofs" + sfx),
    log: getStore("email-reminders" + sfx),
  };
}

const publicEvent = (e) => ({ slug: e.slug, name: e.name, when: e.when, place: e.place, partner: e.partner, photo: e.photo, group: !!e.groupLink, status: e.status });

/* ---------- المسجلين ---------- */
async function registrants(ev) {
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${ev.responsesSheetId}/export?format=csv&t=${Date.now()}`);
  if (!res.ok) throw new Error("sheet " + res.status);
  const rows = parseCSV(await res.text());
  const header = (rows[0] || []).map((h) => h.trim());
  const col = (re) => header.findIndex((h) => re.test(h));
  const emailCol = col(/بريد|ايميل|إيميل|email/i);
  const nameCol = col(/اسم/);
  const phoneCol = col(/جوال|هاتف|رقم/);
  const majorCol = col(/تخصص/);
  const timeCol = col(/طابع|timestamp/i);
  if (emailCol < 0) throw new Error("no email column");
  const cell = (r, c) => (c >= 0 ? String(r[c] || "").trim() : "");
  return rows.slice(1).filter((r) => r.some((v) => String(v).trim())).map((r, i) => ({
    row: i + 2, name: cell(r, nameCol), email: cell(r, emailCol), phone: cell(r, phoneCol),
    major: cell(r, majorCol), registeredAt: cell(r, timeCol),
  }));
}

async function findRegistrant(ev, email) {
  const list = await registrants(ev);
  // آخر تسجيل بنفس الإيميل هو المعتمد.
  for (let i = list.length - 1; i >= 0; i--) {
    if (normEmail(list[i].email) === email) return { name: list[i].name, phone: list[i].phone };
  }
  return null;
}

async function allRecords(store) {
  const { blobs } = await store.list();
  return (await Promise.all(blobs.map(({ key }) => store.get(key, { type: "json" })))).filter(Boolean);
}

async function reminderLog(store) {
  const { blobs } = await store.list();
  const out = {};
  await Promise.all(blobs.map(async ({ key }) => { out[key] = await store.get(key, { type: "json" }); }));
  return out;
}

// حالة المراجعة: الفعاليات اللي ما تحتاج صورة، أي تأكيد = مقبول.
function reviewOf(ev, r) {
  if (!ev.photo) return "approved";
  return r.partnerAt && r.proofId ? (r.review || "pending") : "no_photo";
}

const escHTML = (t) => String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function emailHTML(text) {
  const body = escHTML(text)
    .replace(/(https:\/\/[^\s<]+)/g, '<a href="$1" style="color:#000878;font-weight:bold">$1</a>')
    .replace(/\n/g, "<br>");
  return `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:15px;line-height:1.9;color:#1a1d3a;text-align:right;max-width:560px;margin:auto">${body}</div>`;
}

function json(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  connectLambda(event);
  const events = await loadEvents();
  const bySlug = (s) => events.find((e) => e.slug === String(s || "").trim().toLowerCase());

  if (event.httpMethod === "GET") {
    const qs = event.queryStringParameters || {};
    // للشيت (IMPORTDATA): الإيميل، الحالة، رابط الصورة.
    if (qs.feed) {
      const ev = bySlug(qs.e) || bySlug(LEGACY);
      const records = await allRecords(storesOf(ev.slug).conf);
      const base = "https://" + (event.headers.host || "accclubimamu.com") + "/.netlify/functions/confirm?proof=";
      const label = (r) => {
        const s = reviewOf(ev, r);
        return !ev.photo ? "مؤكد" : s === "approved" ? "مقبول" : s === "rejected" ? "مرفوض" : s === "pending" ? "بانتظار المراجعة" : "أكّد بدون صورة";
      };
      const csv = records.map((r) => [r.email, label(r), r.partnerAt && r.proofId ? base + r.proofId : ""].join(",")).join("\n") || "none@none,غير مؤكد,";
      return { statusCode: 200, headers: { "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "no-store" }, body: csv };
    }
    if (qs.proof && /^[a-z0-9]{16,40}$/.test(qs.proof)) {
      const ref = await getStore("confirmation-proof-ids").get(qs.proof);
      if (!ref) return { statusCode: 404, body: "" };
      const [slug, key] = ref.includes("|") ? ref.split("|") : [LEGACY, ref];
      const image = await storesOf(slug).proofs.get(key);
      const m = image && image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
      if (!m) return { statusCode: 404, body: "" };
      return { statusCode: 200, headers: { "Content-Type": m[1], "Cache-Control": "private, max-age=3600" }, body: m[2], isBase64Encoded: true };
    }
    return { statusCode: 404, body: "" };
  }

  if (event.httpMethod !== "POST") return json(405, { error: "method" });
  let body = {};
  try {
    body = JSON.parse((event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event.body) || "{}");
  } catch (e) { return json(400, { error: "bad json" }); }

  const action = body.action;
  // كلمة مرور الموارد (بصمتها بس) أو REVIEW_PASSWORD أو كلمة الأدمن، مع تجاهل المسافات.
  const isReviewer = () => {
    const given = String(body.password || "").trim();
    if (!given) return false;
    const hash = crypto.createHash("sha256").update(given).digest("hex");
    if (hash === "3f3f87010a960eed02a37345d4e8cc61c841db4d0fbb93cdca59aa8e118f2951") return true;
    return [process.env.REVIEW_PASSWORD, process.env.ADMIN_PUSH_PASSWORD]
      .some((pw) => pw && String(pw).trim() === given);
  };

  /* ---------- للطلاب ---------- */
  if (action === "events") {
    return json(200, { events: events.filter((e) => e.status === "open").map(publicEvent) });
  }

  /* ---------- للموارد ---------- */
  if (action && action.startsWith("hr-") || ["review-list", "review-set", "send-email"].includes(action)) {
    if (!isReviewer()) return json(401, { error: "كلمة المرور غير صحيحة" });
  }

  if (action === "hr-events") {
    return json(200, { events: events.filter((e) => e.status !== "hidden").map(publicEvent) });
  }

  // الفعالية المطلوبة (لو ما انحددت = ما وراء الأرقام، عشان الروابط القديمة).
  const ev = bySlug(body.event) || (body.event ? null : bySlug(LEGACY));

  if (action === "review-list" || action === "hr-list") {
    if (!ev) return json(404, { error: "no_event" });
    const { conf, log } = storesOf(ev.slug);
    let regs = null;
    if (action === "hr-list") {
      try { regs = await registrants(ev); } catch (e) { return json(502, { error: "sheet_unavailable" }); }
    }
    const records = await allRecords(conf);
    const base = "/.netlify/functions/confirm?proof=";
    records.sort((a, b) => (b.partnerAt || b.confirmedAt || 0) - (a.partnerAt || a.confirmedAt || 0));
    return json(200, {
      event: publicEvent(ev),
      items: records.map((r) => ({
        name: r.name, email: r.email, phone: r.phone,
        confirmedAt: r.confirmedAt, proofAt: r.partnerAt || null,
        image: r.partnerAt && r.proofId ? base + r.proofId : null,
        review: reviewOf(ev, r),
        note: r.reviewNote || "", reviewedAt: r.reviewedAt || null,
      })),
      registrants: regs || undefined,
      emailEnabled: !!process.env.RESEND_API_KEY,
      reminders: regs ? await reminderLog(log) : undefined,
    });
  }

  if (action === "send-email") {
    if (!ev) return json(404, { error: "no_event" });
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return json(400, { error: "email_not_configured" });
    const messages = Array.isArray(body.messages) ? body.messages.slice(0, 100) : [];
    if (!messages.length) return json(400, { error: "no messages" });
    const { conf, log } = storesOf(ev.slug);
    // نرسل بس للمسجلين بالفعالية واللي أكّدوا (عشان ما تنستخدم للإرسال لأي أحد).
    let allowed;
    try { allowed = new Set((await registrants(ev)).map((r) => normEmail(r.email))); } catch (e) { return json(502, { error: "sheet_unavailable" }); }
    (await conf.list()).blobs.forEach(({ key }) => allowed.add(normEmail(key)));
    const valid = messages.filter((m) => allowed.has(normEmail(m.to)) && String(m.text || "").trim());
    if (!valid.length) return json(400, { error: "no valid recipients" });
    const from = process.env.EMAIL_FROM || "الموارد البشرية - نادي المحاسبة <hr@accclubimamu.com>";
    const replyTo = process.env.EMAIL_REPLY_TO || "hracc.imamu@gmail.com";
    const payload = valid.map((m) => ({
      from, to: [normEmail(m.to)], reply_to: replyTo,
      subject: String(m.subject || "نادي المحاسبة").slice(0, 150),
      text: String(m.text).slice(0, 5000), html: emailHTML(String(m.text).slice(0, 5000)),
    }));
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST", headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) return json(502, { error: "send_failed", detail: out.message || out.name || res.status });
    const at = Date.now();
    await Promise.all(valid.map((m) => log.setJSON(keyOf(m.to), { at, kind: String(m.kind || "") })));
    return json(200, { ok: true, sent: valid.length, skipped: messages.length - valid.length });
  }

  if (action === "review-set") {
    if (!ev) return json(404, { error: "no_event" });
    const { conf } = storesOf(ev.slug);
    const k = keyOf(body.email);
    const rec = await conf.get(k, { type: "json" });
    if (!rec) return json(404, { error: "not_found" });
    if (!["approved", "rejected", "pending"].includes(body.decision)) return json(400, { error: "bad decision" });
    rec.review = body.decision;
    rec.reviewNote = String(body.note || "").slice(0, 200);
    rec.reviewedAt = Date.now();
    await conf.setJSON(k, rec);
    return json(200, { ok: true });
  }

  // (للأدمن من صفحة الإشعارات) ملف CSV بالتأكيدات.
  if (action === "export") {
    if (!process.env.ADMIN_PUSH_PASSWORD || body.password !== process.env.ADMIN_PUSH_PASSWORD) {
      return json(401, { error: "كلمة المرور غير صحيحة" });
    }
    if (!ev) return json(404, { error: "no_event" });
    const records = await allRecords(storesOf(ev.slug).conf);
    const esc = (v) => `"${String(v || "").replace(/"/g, '""')}"`;
    const fmt = (t) => (t ? new Date(t + 3 * 3600e3).toISOString().replace("T", " ").slice(0, 16) : "");
    const label = { approved: "مقبول", rejected: "مرفوض", pending: "بانتظار المراجعة", no_photo: "بدون صورة" };
    const lines = [["الاسم", "البريد", "الجوال", "وقت تأكيد الحضور", "وقت رفع الصورة", "الحالة"].map(esc).join(",")];
    records.sort((a, b) => a.confirmedAt - b.confirmedAt).forEach((r) => {
      lines.push([r.name, r.email, r.phone, fmt(r.confirmedAt), fmt(r.partnerAt), label[reviewOf(ev, r)]].map(esc).join(","));
    });
    return json(200, { csv: "﻿" + lines.join("\n"), count: records.length });
  }

  /* ---------- تأكيد الطالب ---------- */
  if (action === "check" || action === "partner") {
    // بدون فعالية محددة: لو فيه وحدة مفتوحة بس نستخدمها.
    let target = body.event ? bySlug(body.event) : null;
    if (!body.event) {
      const open = events.filter((e) => e.status === "open");
      if (open.length === 1) target = open[0];
      else return json(400, { error: open.length ? "choose_event" : "no_open_event" });
    }
    if (!target || target.status === "hidden") return json(404, { error: "no_event" });

    const email = normEmail(body.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "invalid_email" });
    const key = keyOf(email);
    const { conf, proofs } = storesOf(target.slug);
    const existing = (await conf.get(key, { type: "json" })) || null;
    const isOpen = target.status === "open";

    const reply = (record) => {
      const rejected = target.photo && record.review === "rejected";
      const done = !target.photo || (!!record.partnerAt && !rejected);
      return {
        ok: true, event: publicEvent(target),
        firstName: (record.name || "").split(/\s+/)[0] || "",
        partnerLink: target.photo ? target.partnerLink : null,
        partnerDone: done, rejected,
        rejectNote: rejected ? (record.reviewNote || "") : "",
        groupLink: done ? (target.groupLink || null) : null,
      };
    };

    if (action === "check") {
      // بعد ما يقفل التأكيد: اللي أكّد قبل يقدر يرجع يشوف حالته، والجديد لا.
      if (!existing && !isOpen) return json(403, { error: "closed", event: publicEvent(target) });
      if (existing) return json(200, reply(existing));
      let found;
      try { found = await findRegistrant(target, email); } catch (e) { return json(502, { error: "sheet_unavailable" }); }
      if (!found) return json(404, { error: "not_registered", event: publicEvent(target) });
      const record = { email, name: found.name, phone: found.phone, confirmedAt: Date.now(), partnerAt: null };
      await conf.setJSON(key, record);
      return json(200, reply(record));
    }

    // partner: رفع صورة الإثبات.
    if (!existing) return json(404, { error: "not_confirmed" });
    if (!isOpen) return json(403, { error: "closed" });
    if (!target.photo) return json(200, reply(existing));
    const image = String(body.image || "");
    if (!/^data:image\/(jpeg|png|webp|heic|heif|gif);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > 5.5e6) {
      return json(400, { error: "invalid_image" });
    }
    await proofs.set(key, image);
    // معرّف عشوائي للصورة (يستخدمه الشيت لعرضها) بدل الإيميل.
    if (!existing.proofId) {
      existing.proofId = crypto.randomBytes(12).toString("hex");
      await getStore("confirmation-proof-ids").set(existing.proofId, target.slug === LEGACY ? key : `${target.slug}|${key}`);
    }
    existing.partnerAt = Date.now();
    existing.review = "pending";
    existing.reviewNote = "";
    await conf.setJSON(key, existing);
    return json(200, reply(existing));
  }

  return json(400, { error: "unknown action" });
};
