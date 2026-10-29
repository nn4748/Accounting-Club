const { getStore } = require("@netlify/blobs");

function keyFor(endpoint) {
  return Buffer.from(endpoint).toString("base64url");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const endpoint = payload.endpoint;
  if (!endpoint) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing endpoint" }) };
  }

  const store = getStore("push-subscriptions");
  await store.delete(keyFor(endpoint));

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true }),
  };
};
