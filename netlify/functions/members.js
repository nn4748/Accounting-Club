// بطاقات العضوية: البيانات من «قاعدة بيانات الترم» (تبويب لوحة الادارة).
//  GET  ?t=رمز            : بيانات العضو للصفحة اللي تفتح من الـQR (بدون إيميل أو جوال).
//  GET  ?pass=رمز         : بطاقة Apple Wallet (.pkpass) — يحتاج شهادات التوقيع في Netlify.
//  POST list / send / set-active : للموارد بكلمة المرور.
// الرمز = رقم العضوية + توقيع سري، عشان ما أحد يقدر يخمّن بطاقة غيره.
// المفتاح الخاص للتوقيع: متغير PASS_KEY_PEM_B64 في Netlify (أو ملف مرفوع من /hr-members).
const crypto = require("crypto");
const { getStore, connectLambda } = require("@netlify/blobs");

const SHEET = "1rsmJRtDDdZHWwssFYTG6wmKiOSdVw0irFXE8i3gjC90";
const GID = "1724281511";
const SITE = "https://accclubimamu.com";
const LEADER = /رئيس|نائب|مستشار|قائد/;

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
const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();

let cache = { at: 0, list: null };
async function loadMembers() {
  if (cache.list && Date.now() - cache.at < 60e3) return cache.list;
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET}/export?format=csv&gid=${GID}&t=${Date.now()}`);
  if (!res.ok) throw new Error("sheet " + res.status);
  const rows = parseCSV(await res.text());
  // الأعمدة من صف العناوين.
  const hi = rows.findIndex((r) => r.some((c) => /الاسم الثلاثي بالعربي|الأسم الثلاثي بالعربي/.test(c)));
  const h = (rows[hi] || []).map(clean);
  const col = (re, d) => { const i = h.findIndex((x) => re.test(x)); return i >= 0 ? i : d; };
  const C = { name: col(/بالعربي/, 1), en: col(/بالانجليزي|بالإنجليزي/, 2), id: col(/الرقم الجامعي/, 4), role: col(/دورك/, 6), email: col(/الايميل|الإيميل|البريد/, 7), no: col(/رقم العضوية/, 11) };
  let dept = "", committee = "";
  const list = [];
  for (const r of rows.slice(hi + 1)) {
    const a = clean(r[0]), b = clean(r[C.name]);
    if (!b) continue;
    const no = clean(r[C.no]);
    // صف عنوان قسم (إدارة أو لجنة).
    if (!a && !no) {
      if (/^لجنة/.test(b)) committee = b;
      else { dept = b; committee = ""; }
      continue;
    }
    if (!/^\d{3,6}$/.test(no)) continue;
    const role = clean(r[C.role]);
    list.push({
      no, name: b, nameEn: clean(r[C.en]), email: clean(r[C.email]).toLowerCase(),
      dept, committee, role, leader: LEADER.test(role),
    });
  }
  cache = { at: Date.now(), list };
  return list;
}

const SECRET = () => process.env.MEMBER_SECRET
  || crypto.createHash("sha256").update("acc-members|" + (process.env.ADMIN_PUSH_PASSWORD || "")).digest("hex");
const sign = (no) => crypto.createHmac("sha256", SECRET()).update(String(no)).digest("hex").slice(0, 10);
const tokenOf = (no) => `${no}-${sign(no)}`;
function fromToken(t) {
  const m = String(t || "").match(/^(\d{3,6})-([a-f0-9]{10})$/);
  if (!m) return null;
  const a = Buffer.from(sign(m[1])), b = Buffer.from(m[2]);
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? m[1] : null;
}
const line1 = (m) => [m.dept, m.committee].filter(Boolean).join(" - ");
const publicOf = (m, active) => ({ no: m.no, name: m.name, nameEn: m.nameEn, dept: m.dept, committee: m.committee, line1: line1(m), role: m.role, leader: m.leader, active });

function json(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) };
}

/* ---------- Apple Wallet ---------- */
const b64 = (name) => (process.env[name] ? Buffer.from(process.env[name], "base64") : null);
// الشهادات العامة والمعرّفات بالكود، والمفتاح الخاص بس من Netlify.
const CERTS = require("./pass-certs");
const passTypeId = () => process.env.PASS_TYPE_ID || CERTS.passTypeId;
const teamId = () => process.env.PASS_TEAM_ID || CERTS.teamId;
// المفتاح الخاص: من متغير Netlify، أو من الملف اللي ترفعه الإدارة (محفوظ في Blobs).
let uploadedKey = null;
async function loadKey() {
  if (uploadedKey !== null) return;
  try { uploadedKey = (await getStore("wallet-secrets").get("signer-key")) || ""; } catch (e) { uploadedKey = ""; }
}
function signerKey() {
  const v = process.env.PASS_KEY_PEM_B64 || process.env.PASS_KEY_PEM || "";
  if (v) return /BEGIN/.test(v) ? Buffer.from(v.replace(/\\n/g, "\n")) : Buffer.from(v, "base64");
  return uploadedKey ? Buffer.from(uploadedKey) : null;
}
const passReady = () => !!signerKey();

// يقرأ ملف .p12 أو .pem/.key ويتأكد إن المفتاح يطابق شهادة البطاقة.
function extractKey(fileB64, passphrase) {
  const forge = require("node-forge");
  const raw = Buffer.from(fileB64, "base64");
  let key = null;
  const text = raw.toString("utf8");
  if (/BEGIN (RSA |ENCRYPTED )?PRIVATE KEY/.test(text)) {
    key = /ENCRYPTED/.test(text) ? forge.pki.decryptRsaPrivateKey(text, passphrase || "") : forge.pki.privateKeyFromPem(text);
  } else {
    const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(raw.toString("binary")), passphrase || "");
    const bags = Object.assign({}, p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag }), p12.getBags({ bagType: forge.pki.oids.keyBag }));
    const all = [].concat(bags[forge.pki.oids.pkcs8ShroudedKeyBag] || [], bags[forge.pki.oids.keyBag] || []);
    key = all.length ? all[0].key : null;
  }
  if (!key) throw new Error("no_key");
  const cert = forge.pki.certificateFromPem(CERTS.cert);
  if (cert.publicKey.n.compareTo(key.n) !== 0) throw new Error("key_mismatch");
  return forge.pki.privateKeyToPem(key);
}

async function makePass(m, active) {
  const { PKPass } = require("passkit-generator");
  const A = require("./pass-assets");
  const look = m.leader ? A.dark : A.light;
  const files = {};
  Object.entries(Object.assign({}, A.common, look)).forEach(([k, v]) => { files[k] = Buffer.from(v, "base64"); });
  const url = `${SITE}/m/${tokenOf(m.no)}`;
  files["pass.json"] = Buffer.from(JSON.stringify({
    formatVersion: 1,
    passTypeIdentifier: passTypeId(),
    teamIdentifier: teamId(),
    serialNumber: "acc-member-" + m.no,
    organizationName: "نادي المحاسبة",
    description: "بطاقة عضوية نادي المحاسبة",
    backgroundColor: m.leader ? "rgb(4,12,168)" : "rgb(76,180,228)",
    foregroundColor: "rgb(255,255,255)",
    labelColor: m.leader ? "rgb(40,190,255)" : "rgb(14,32,140)",
    sharingProhibited: true,
    storeCard: {
      primaryFields: [{ key: "name", label: "", value: m.name }],
      secondaryFields: [{ key: "unit", label: "الإدارة - اللجنة", value: line1(m) || "نادي المحاسبة", textAlignment: "PKTextAlignmentRight" }],
      auxiliaryFields: [
        { key: "role", label: "المنصب", value: m.role || "عضو", textAlignment: "PKTextAlignmentRight" },
        { key: "no", label: "رقم العضوية", value: m.no },
      ],
      backFields: [
        { key: "status", label: "حالة العضوية", value: active ? "فعّالة" : "غير فعّالة" },
        { key: "nameEn", label: "Name", value: m.nameEn || m.name },
        { key: "term", label: "الفصل", value: "الترم الأول ١٤٤٨هـ" },
        { key: "link", label: "صفحة العضو", value: url },
        { key: "club", label: "نادي المحاسبة", value: "جامعة الإمام محمد بن سعود الإسلامية — accclubimamu.com" },
      ],
    },
    barcodes: [{ format: "PKBarcodeFormatQR", message: url, messageEncoding: "iso-8859-1", altText: m.no }],
  }));
  const pass = new PKPass(files, {
    wwdr: b64("PASS_WWDR_PEM_B64") || Buffer.from(CERTS.wwdr),
    signerCert: b64("PASS_CERT_PEM_B64") || Buffer.from(CERTS.cert),
    signerKey: signerKey(),
    signerKeyPassphrase: process.env.PASS_KEY_PASSPHRASE || undefined,
  });
  return pass.getAsBuffer();
}

/* ---------- الإيميل ---------- */
const escHTML = (t) => String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function cardEmail(m) {
  const t = tokenOf(m.no);
  const page = `${SITE}/m/${t}`, pass = `${SITE}/.netlify/functions/members?pass=${t}`;
  const text = `مرحبًا ${m.name.split(" ")[0]}،\n\nبطاقة عضويتك في نادي المحاسبة جاهزة.\n\nأضفها إلى Apple Wallet:\n${pass}\n\nأو افتح بطاقتك:\n${page}\n\nالموارد البشرية — نادي المحاسبة\nجامعة الإمام محمد بن سعود الإسلامية`;
  const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:520px;margin:auto;color:#121638;text-align:right">
  <div style="background:${m.leader ? "#040ca8" : "#4cb4e4"};border-radius:18px;padding:22px;color:#fff">
    <div style="font-size:13px;opacity:.85">نادي المحاسبة · بطاقة العضوية</div>
    <div style="font-size:24px;font-weight:bold;margin-top:10px">${escHTML(m.name)}</div>
    <div style="font-size:14px;margin-top:6px">${escHTML(line1(m))}</div>
    <div style="font-size:14px;margin-top:2px">${escHTML(m.role)} · رقم العضوية ${escHTML(m.no)}</div>
  </div>
  <p style="font-size:15px;line-height:1.9">مرحبًا ${escHTML(m.name.split(" ")[0])}، بطاقة عضويتك جاهزة. اضغط الزر من جوال آيفون وتنضاف لمحفظتك.</p>
  <p><a href="${pass}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:bold"> أضف إلى Apple Wallet</a></p>
  <p style="font-size:14px">أو افتح بطاقتك من هنا: <a href="${page}" style="color:#000878;font-weight:bold">بطاقتي</a></p>
  <p style="font-size:13px;color:#6a6f97">الموارد البشرية — نادي المحاسبة<br>جامعة الإمام محمد بن سعود الإسلامية</p></div>`;
  return { text, html };
}

exports.handler = async (event) => {
  connectLambda(event);
  await loadKey();
  const status = getStore("members-status"); // الأعضاء الموقوفة عضويتهم
  const isActive = async (no) => !(await status.get(no));

  if (event.httpMethod === "GET") {
    const qs = event.queryStringParameters || {};
    const no = fromToken(qs.t || qs.pass);
    if (!no) return json(404, { error: "not_found" });
    let m;
    try { m = (await loadMembers()).find((x) => x.no === no); } catch (e) { return json(502, { error: "sheet_unavailable" }); }
    if (!m) return json(200, { found: false, active: false, no });
    const active = await isActive(no);
    if (qs.pass) {
      if (!passReady()) return json(503, { error: "wallet_not_configured" });
      try {
        const buf = await makePass(m, active);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/vnd.apple.pkpass", "Content-Disposition": `attachment; filename="acc-${no}.pkpass"`, "Cache-Control": "no-store" },
          body: buf.toString("base64"), isBase64Encoded: true,
        };
      } catch (e) { return json(500, { error: "pass_failed", detail: String(e.message || e).slice(0, 200) }); }
    }
    return json(200, Object.assign({ found: true, wallet: passReady() }, publicOf(m, active)));
  }

  if (event.httpMethod !== "POST") return json(405, { error: "method" });
  let body = {};
  try { body = JSON.parse((event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event.body) || "{}"); }
  catch (e) { return json(400, { error: "bad json" }); }
  // نفس كلمات مرور لوحة الموارد.
  const given = String(body.password || "").trim();
  const ok = given && (crypto.createHash("sha256").update(given).digest("hex") === "3f3f87010a960eed02a37345d4e8cc61c841db4d0fbb93cdca59aa8e118f2951"
    || [process.env.REVIEW_PASSWORD, process.env.ADMIN_PUSH_PASSWORD].some((p) => p && String(p).trim() === given));
  if (!ok) return json(401, { error: "كلمة المرور غير صحيحة" });

  let members;
  try { members = await loadMembers(); } catch (e) { return json(502, { error: "sheet_unavailable" }); }
  const sent = getStore("members-sent");

  if (body.action === "list") {
    const out = await Promise.all(members.map(async (m) => Object.assign(publicOf(m, await isActive(m.no)), {
      email: m.email, token: tokenOf(m.no), sentAt: Number(await sent.get(m.no)) || null,
    })));
    return json(200, { members: out, wallet: passReady(), email: !!process.env.RESEND_API_KEY });
  }

  if (body.action === "upload-key") {
    try {
      const pem = extractKey(String(body.file || ""), String(body.passphrase || ""));
      await getStore("wallet-secrets").set("signer-key", pem);
      uploadedKey = pem;
      return json(200, { ok: true });
    } catch (e) {
      const m = String(e.message || e);
      return json(400, { error: m === "key_mismatch" ? "key_mismatch" : /password|Invalid|MAC|decrypt/i.test(m) ? "bad_password" : "bad_file" });
    }
  }

  if (body.action === "set-active") {
    const m = members.find((x) => x.no === String(body.no));
    if (!m) return json(404, { error: "not_found" });
    if (body.active) await status.delete(m.no); else await status.set(m.no, "1");
    return json(200, { ok: true });
  }

  if (body.action === "send") {
    const key = process.env.RESEND_API_KEY;
    if (!key) return json(400, { error: "email_not_configured" });
    const nos = new Set((Array.isArray(body.nos) ? body.nos : []).map(String));
    const targets = members.filter((m) => nos.has(m.no) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)).slice(0, 100);
    if (!targets.length) return json(400, { error: "no_recipients" });
    const from = process.env.EMAIL_FROM || "الموارد البشرية - نادي المحاسبة <hr@accclubimamu.com>";
    const payload = targets.map((m) => Object.assign({ from, to: [m.email], reply_to: process.env.EMAIL_REPLY_TO || "hracc.imamu@gmail.com", subject: "بطاقة عضويتك في نادي المحاسبة 🪪" }, cardEmail(m)));
    const res = await fetch("https://api.resend.com/emails/batch", { method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) return json(502, { error: "send_failed", detail: out.message || res.status });
    const at = String(Date.now());
    await Promise.all(targets.map((m) => sent.set(m.no, at)));
    return json(200, { ok: true, sent: targets.length });
  }

  return json(400, { error: "unknown action" });
};
