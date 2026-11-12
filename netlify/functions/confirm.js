// تأكيد الحضور لفعالية "ما وراء الأرقام":
//  check   : يتأكد إن الإيميل مسجل بشيت المسجلين، ويحفظ تأكيد الحضور.
//  partner : الطالب يرفع صورة تسجيله عند منشآت ← نحفظها ونرجّع رابط قروب الواتساب.
//  export  : (للإدارة بكلمة المرور) ملف CSV بكل التأكيدات.
//  proofs  : (للإدارة) قائمة المؤكدين ومين رفع صورة.
//  proof   : (للإدارة) صورة تسجيل شخص معيّن.
// الروابط محفوظة هنا بالخادم، وما تنكشف للصفحة إلا بعد الخطوات.
const { getStore, connectLambda } = require("@netlify/blobs");

const EVENT = {
  name: "ما وراء الأرقام",
  responsesSheetId: "1HztJpguUJqsqUlxa-WZEVs62abHzXtucnmP56zGrlsI",
  // رابط التسجيل عند منشآت (الجهة المستضيفة).
  partnerLink: "https://www.monshaat.gov.sa/ar/node/526412",
  // قروب الواتساب اللي يطلع بعد التسجيل عند منشآت.
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

async function findRegistrant(email) {
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${EVENT.responsesSheetId}/export?format=csv&t=${Date.now()}`);
  if (!res.ok) throw new Error("sheet " + res.status);
  const rows = parseCSV(await res.text());
  const header = (rows[0] || []).map((h) => h.trim());
  const col = (re) => header.findIndex((h) => re.test(h));
  const emailCol = col(/بريد|ايميل|إيميل|email/i);
  const nameCol = col(/اسم/);
  const phoneCol = col(/جوال|هاتف|رقم/);
  if (emailCol < 0) throw new Error("no email column");
  // آخر تسجيل بنفس الإيميل هو المعتمد.
  for (let i = rows.length - 1; i >= 1; i--) {
    if (normEmail(rows[i][emailCol]) === email) {
      return { name: (rows[i][nameCol] || "").trim(), phone: (rows[i][phoneCol] || "").trim() };
    }
  }
  return null;
}

function json(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  connectLambda(event);

  // للشيت: قائمة المؤكدين (IMPORTDATA) وصورهم (IMAGE).
  if (event.httpMethod === "GET") {
    const qs = event.queryStringParameters || {};
    const store = getStore("confirmations");
    if (qs.feed) {
      const { blobs } = await store.list();
      const records = (await Promise.all(blobs.map(({ key }) => store.get(key, { type: "json" })))).filter((r) => r && r.partnerAt && r.proofId);
      const base = "https://" + (event.headers.host || "accclubimamu.com") + "/.netlify/functions/confirm?proof=";
      const csv = records.map((r) => [r.email, "مؤكد", base + r.proofId].join(",")).join("\n") || "none@none,غير مؤكد,";
      return { statusCode: 200, headers: { "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "no-store" }, body: csv };
    }
    if (qs.proof && /^[a-z0-9]{16,40}$/.test(qs.proof)) {
      const index = getStore("confirmation-proof-ids");
      const key = await index.get(qs.proof);
      const image = key && (await getStore("confirmation-proofs").get(key));
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

  const store = getStore("confirmations");
  const proofs = getStore("confirmation-proofs");
  const action = body.action;
  const isAdmin = () => process.env.ADMIN_PUSH_PASSWORD && body.password === process.env.ADMIN_PUSH_PASSWORD;

  if (action === "proofs" || action === "proof") {
    if (!isAdmin()) return json(401, { error: "كلمة المرور غير صحيحة" });
    if (action === "proof") {
      const k = normEmail(body.email).replace(/[^a-z0-9@._+-]/g, "_");
      const img = await proofs.get(k);
      return img ? json(200, { image: img }) : json(404, { error: "no proof" });
    }
    const { blobs } = await store.list();
    const records = (await Promise.all(blobs.map(({ key }) => store.get(key, { type: "json" })))).filter(Boolean);
    records.sort((a, b) => (b.partnerAt || 0) - (a.partnerAt || 0));
    return json(200, { items: records.map((r) => ({ name: r.name, email: r.email, phone: r.phone, confirmedAt: r.confirmedAt, proofAt: r.partnerAt || null })) });
  }

  if (action === "export") {
    if (!process.env.ADMIN_PUSH_PASSWORD || body.password !== process.env.ADMIN_PUSH_PASSWORD) {
      return json(401, { error: "كلمة المرور غير صحيحة" });
    }
    const { blobs } = await store.list();
    const records = await Promise.all(blobs.map(({ key }) => store.get(key, { type: "json" })));
    const esc = (v) => `"${String(v || "").replace(/"/g, '""')}"`;
    const fmt = (t) => (t ? new Date(t + 3 * 3600e3).toISOString().replace("T", " ").slice(0, 16) : "");
    const lines = [["الاسم", "البريد", "الجوال", "وقت تأكيد الحضور", "رفع صورة تسجيل منشآت", "وقت رفع الصورة"].map(esc).join(",")];
    records.filter(Boolean).sort((a, b) => a.confirmedAt - b.confirmedAt).forEach((r) => {
      lines.push([r.name, r.email, r.phone, fmt(r.confirmedAt), r.partnerAt ? "نعم" : "لا", fmt(r.partnerAt)].map(esc).join(","));
    });
    return json(200, { csv: "﻿" + lines.join("\n"), count: records.filter(Boolean).length });
  }

  const email = normEmail(body.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "invalid_email" });
  const key = email.replace(/[^a-z0-9@._+-]/g, "_");

  if (action === "check") {
    let found;
    try { found = await findRegistrant(email); } catch (e) { return json(502, { error: "sheet_unavailable" }); }
    if (!found) return json(404, { error: "not_registered" });
    const existing = (await store.get(key, { type: "json" })) || null;
    const record = existing || { email, name: found.name, phone: found.phone, confirmedAt: Date.now(), partnerAt: null };
    if (!existing) await store.setJSON(key, record);
    return json(200, {
      ok: true,
      firstName: (record.name || "").split(/\s+/)[0] || "",
      partnerLink: EVENT.partnerLink || null,
      partnerDone: !!record.partnerAt,
      groupLink: record.partnerAt ? EVENT.groupLink : null,
    });
  }

  if (action === "partner") {
    const record = await store.get(key, { type: "json" });
    if (!record) return json(404, { error: "not_confirmed" });
    const image = String(body.image || "");
    // صورة مضغوطة من المتصفح (حد أقصى تقريبًا ٣ ميقا).
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > 4.2e6) {
      return json(400, { error: "invalid_image" });
    }
    await proofs.set(key, image);
    // معرّف عشوائي للصورة (يستخدمه الشيت لعرضها) بدل الإيميل.
    if (!record.proofId) {
      record.proofId = require("crypto").randomBytes(12).toString("hex");
      await getStore("confirmation-proof-ids").set(record.proofId, key);
    }
    record.partnerAt = Date.now();
    await store.setJSON(key, record);
    return json(200, { ok: true, groupLink: EVENT.groupLink });
  }

  return json(400, { error: "unknown action" });
};
