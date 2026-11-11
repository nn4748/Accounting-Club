// تسجيل زيارة أو حدث بسيط (بدون أي بيانات شخصية) في Netlify Blobs.
// كل زيارة مفتاح مستقل عشان ما يضيع شي لو وصلت زيارات بنفس اللحظة.
const { getStore, connectLambda } = require("@netlify/blobs");

const EVENTS = new Set([
  "view:home", "view:events", "view:register", "view:quiz", "view:visits",
  "view:volunteer", "view:company", "view:other",
  "quiz_start", "quiz_done", "card_share", "register_done",
]);

function riyadhDay(d = new Date()) {
  return new Date(d.getTime() + 3 * 3600e3).toISOString().slice(0, 10);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "" };
  connectLambda(event);
  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (e) { return { statusCode: 400, body: "" }; }
  const name = String(body.e || "");
  if (!EVENTS.has(name)) return { statusCode: 204, body: "" };
  const visitor = /^[a-z0-9]{8,40}$/i.test(String(body.v || "")) ? body.v : null;

  const store = getStore("analytics");
  const day = riyadhDay();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const writes = [store.set(`${day}/e/${name}/${id}`, "1")];
  // زائر فريد باليوم: نفس المفتاح يتكرر لنفس الجهاز فينحسب مرة وحدة.
  if (visitor && name.startsWith("view:")) writes.push(store.set(`${day}/u/${visitor}`, "1"));
  await Promise.all(writes);
  return { statusCode: 204, body: "" };
};
