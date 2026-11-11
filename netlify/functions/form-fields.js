// يقرأ أسئلة نموذج Google (من رابطه العام) ويرجّع أرقام الحقول (entry.xxx)
// لكل من: الاسم، الجوال، البريد، التخصص — عشان صفحة التسجيل ترسل لأي نموذج
// جديد بدون ما نكتب أرقامه بالكود.
const FIELD_PATTERNS = {
  fullName: /^(?!.*فعالي).*اسم/,
  phone: /جوال|هاتف|موبايل|رقم/,
  email: /بريد|ايميل|إيميل|email|e-mail/i,
  major: /تخصص|قسم|كلية/,
};

exports.handler = async (event) => {
  const id = String((event.queryStringParameters || {}).id || "");
  if (!/^[\w-]{20,}$/.test(id)) {
    return { statusCode: 400, body: JSON.stringify({ error: "bad id" }) };
  }
  try {
    const res = await fetch(`https://docs.google.com/forms/d/e/${id}/viewform`, { redirect: "follow" });
    const html = await res.text();
    const m = html.match(/FB_PUBLIC_LOAD_DATA_ = (.*?);<\/script>/s);
    if (!m) {
      // النموذج يطلب تسجيل دخول أو مقفل.
      return json({ ok: false, requiresLogin: /ServiceLogin|accounts\.google\.com/.test(res.url + html.slice(0, 4000)) }, 60);
    }
    const data = JSON.parse(m[1]);
    const questions = (data[1] && data[1][1]) || [];
    const entries = {};
    for (const q of questions) {
      const title = String(q[1] || "");
      const entryId = q[4] && q[4][0] && q[4][0][0];
      if (!entryId) continue;
      for (const [key, re] of Object.entries(FIELD_PATTERNS)) {
        if (!entries[key] && re.test(title)) { entries[key] = "entry." + entryId; break; }
      }
    }
    const complete = Object.keys(FIELD_PATTERNS).every((k) => entries[k]);
    return json({ ok: complete, entries, acceptingResponses: true }, 600);
  } catch (err) {
    return json({ ok: false, error: String(err && err.message) }, 30);
  }
};

function json(body, maxAge) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${maxAge}` },
    body: JSON.stringify(body),
  };
}
