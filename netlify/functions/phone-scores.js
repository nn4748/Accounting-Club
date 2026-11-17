// لوحة المتصدرين للعبة «جوال المدير المالي» (/phone).
//  GET  : أفضل ١٠ (اللي كشف القضية أول، بعدين الأكثر إجابات صحيحة، بعدين الأسرع).
//  POST : { name, score (0-25), ms, solved } يحفظ نتيجة جديدة ويرجع ترتيبها.
const { getStore, connectLambda } = require("@netlify/blobs");

function json(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) };
}
const rank = (a, b) => (b.solved - a.solved) || (b.score - a.score) || (a.ms - b.ms);

async function all(store) {
  const { blobs } = await store.list();
  return (await Promise.all(blobs.map(({ key }) => store.get(key, { type: "json" })))).filter(Boolean);
}

exports.handler = async (event) => {
  connectLambda(event);
  const store = getStore("phone-scores");

  if (event.httpMethod === "GET") {
    const rows = await all(store);
    const pick = ({ name, score, ms, solved, at }) => ({ name, score, ms, solved, at });
    const out = { top: rows.slice().sort(rank).slice(0, 10).map(pick) };
    // لشاشة العرض: العدد الكلي، اللي كشفوا القضية، وآخر اللاعبين.
    if ((event.queryStringParameters || {}).live) {
      out.total = rows.length;
      out.solved = rows.filter((r) => r.solved).length;
      out.latest = rows.slice().sort((a, b) => b.at - a.at).slice(0, 30).map(pick);
    }
    return json(200, out);
  }
  if (event.httpMethod !== "POST") return json(405, { error: "method" });

  let b = {};
  try { b = JSON.parse((event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event.body) || "{}"); }
  catch (e) { return json(400, { error: "bad json" }); }
  const name = String(b.name || "").replace(/\s+/g, " ").trim().slice(0, 30);
  const score = Number(b.score), ms = Number(b.ms);
  // وقت أقل من دقيقة لـ٢٥ سؤال = غالبًا غش.
  if (name.length < 2 || !Number.isInteger(score) || score < 0 || score > 25 || !(ms >= 60e3 && ms < 6 * 3600e3)) {
    return json(400, { error: "invalid" });
  }
  const rec = { name, score, ms: Math.round(ms), solved: b.solved === true, at: Date.now() };
  const key = rec.at + "-" + Math.random().toString(36).slice(2, 8);
  await store.setJSON(key, rec);
  const list = (await all(store)).sort(rank);
  const position = list.findIndex((r) => r.at === rec.at && r.name === rec.name) + 1;
  return json(200, { ok: true, position, total: list.length, top: list.slice(0, 10).map(({ name, score, ms, solved }) => ({ name, score, ms, solved })) });
};
