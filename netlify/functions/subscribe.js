const { getStore, connectLambda } = require("@netlify/blobs");

function keyFor(endpoint) {
  return Buffer.from(endpoint).toString("base64url");
}

exports.handler = async (event) => {
  connectLambda(event);

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const subscription = payload.subscription;
  if (!subscription || !subscription.endpoint) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing subscription" }) };
  }

  const store = getStore("push-subscriptions");
  await store.setJSON(keyFor(subscription.endpoint), {
    subscription,
    createdAt: new Date().toISOString(),
  });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true }),
  };
};
