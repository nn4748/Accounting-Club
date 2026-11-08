// Serves the Firebase web config from Netlify environment variables, so no
// project config is hardcoded in the repository. These values are a public
// web config (they identify the project); access is enforced by firestore.rules.
exports.handler = async () => {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  };

  const missing = ["apiKey", "authDomain", "projectId", "appId"].filter((key) => !config[key]);
  if (missing.length) {
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ configured: false, missing }),
    };
  }

  const body = { configured: true, config };
  if (process.env.FIREBASE_USE_EMULATORS === "1") {
    body.emulators = {
      firestoreHost: process.env.FIREBASE_FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080",
      authHost: process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099",
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    body: JSON.stringify(body),
  };
};
