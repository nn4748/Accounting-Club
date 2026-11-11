// إحصائيات الزيارات لآخر أيام (محمية بكلمة مرور الأدمن نفسها).
const { getStore, connectLambda } = require("@netlify/blobs");

function riyadhDay(d) {
  return new Date(d.getTime() + 3 * 3600e3).toISOString().slice(0, 10);
}

exports.handler = async (event) => {
  connectLambda(event);
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "" };
  let body = {};
  try { body = JSON.parse((event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event.body) || "{}"); } catch (e) { return { statusCode: 400, body: "" }; }
  if (!process.env.ADMIN_PUSH_PASSWORD || body.password !== process.env.ADMIN_PUSH_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: "كلمة المرور غير صحيحة" }) };
  }
  const days = Math.min(Math.max(parseInt(body.days, 10) || 7, 1), 31);
  const store = getStore("analytics");
  const result = [];
  for (let i = 0; i < days; i++) {
    const day = riyadhDay(new Date(Date.now() - i * 864e5));
    const { blobs } = await store.list({ prefix: `${day}/` });
    const counts = {};
    let visitors = 0;
    for (const { key } of blobs) {
      const parts = key.split("/");
      if (parts[1] === "u") visitors++;
      else if (parts[1] === "e") counts[parts[2]] = (counts[parts[2]] || 0) + 1;
    }
    result.push({ day, visitors, counts });
  }
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({ days: result }),
  };
};
