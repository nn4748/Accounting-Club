// تأكيد الحضور لفعالية "ما وراء الأرقام":
//  check   : يتأكد إن الإيميل مسجل بشيت المسجلين، ويحفظ تأكيد الحضور.
//  partner : الطالب أكّد إنه سجّل عند منشآت ← نرجّع رابط قروب الواتساب.
//  export  : (للإدارة بكلمة المرور) ملف CSV بكل التأكيدات.
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
  if (event.httpMethod !== "POST") return json(405, { error: "method" });
  let body = {};
  try {
    body = JSON.parse((event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event.body) || "{}");
  } catch (e) { return json(400, { error: "bad json" }); }

  const store = getStore("confirmations");
  const action = body.action;

  if (action === "export") {
    if (!process.env.ADMIN_PUSH_PASSWORD || body.password !== process.env.ADMIN_PUSH_PASSWORD) {
      return json(401, { error: "كلمة المرور غير صحيحة" });
    }
    const { blobs } = await store.list();
    const records = await Promise.all(blobs.map(({ key }) => store.get(key, { type: "json" })));
    const esc = (v) => `"${String(v || "").replace(/"/g, '""')}"`;
    const fmt = (t) => (t ? new Date(t + 3 * 3600e3).toISOString().replace("T", " ").slice(0, 16) : "");
    const lines = [["الاسم", "البريد", "الجوال", "وقت تأكيد الحضور", "سجّل عند منشآت", "وقت التسجيل عند منشآت"].map(esc).join(",")];
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
    if (!record.partnerAt) {
      record.partnerAt = Date.now();
      await store.setJSON(key, record);
    }
    return json(200, { ok: true, groupLink: EVENT.groupLink });
  }

  return json(400, { error: "unknown action" });
};
