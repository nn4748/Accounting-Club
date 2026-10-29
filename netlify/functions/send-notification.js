const { getStore } = require("@netlify/blobs");
const webpush = require("web-push");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: "طلب غير صالح" }) };
  }

  const { password, title, body, url } = payload;

  if (!process.env.ADMIN_PUSH_PASSWORD || password !== process.env.ADMIN_PUSH_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: "كلمة المرور غير صحيحة" }) };
  }

  if (!title || !body) {
    return { statusCode: 400, body: JSON.stringify({ error: "العنوان والنص مطلوبان" }) };
  }

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:info@accclubimamu.com";

  if (!vapidPublicKey || !vapidPrivateKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "مفاتيح VAPID غير مضبوطة على الاستضافة" }) };
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const store = getStore("push-subscriptions");
  const { blobs } = await store.list();

  let sent = 0;
  let removed = 0;
  let failed = 0;

  await Promise.all(
    blobs.map(async ({ key }) => {
      const record = await store.get(key, { type: "json" });
      if (!record || !record.subscription) return;

      try {
        await webpush.sendNotification(
          record.subscription,
          JSON.stringify({ title, body, url: url || "/index.html" })
        );
        sent++;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await store.delete(key);
          removed++;
        } else {
          failed++;
        }
      }
    })
  );

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, sent, removed, failed }),
  };
};
