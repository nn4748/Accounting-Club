// Firebase initialization. The web config comes from Netlify environment
// variables through /.netlify/functions/firebase-config (nothing hardcoded).
const SDK_BASE = "https://www.gstatic.com/firebasejs/10.12.2";
const CONFIG_URL = "/.netlify/functions/firebase-config";

export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super("Firebase is not configured on this site yet.");
    this.name = "FirebaseNotConfiguredError";
  }
}

let corePromise = null;
let authPromise = null;

async function loadConfig() {
  const res = await fetch(CONFIG_URL, { cache: "no-store" });
  if (res.status === 503) throw new FirebaseNotConfiguredError();
  if (!res.ok) throw new Error("firebase-config HTTP " + res.status);
  return res.json();
}

export function getFirebase() {
  if (!corePromise) {
    corePromise = (async () => {
      const { config, emulators } = await loadConfig();
      const [appApi, fs] = await Promise.all([
        import(`${SDK_BASE}/firebase-app.js`),
        import(`${SDK_BASE}/firebase-firestore.js`),
      ]);
      const app = appApi.initializeApp(config);
      const db = fs.getFirestore(app);
      if (emulators && emulators.firestoreHost) {
        const [host, port] = emulators.firestoreHost.split(":");
        fs.connectFirestoreEmulator(db, host, Number(port));
      }
      return { app, db, fs, emulators: emulators || null };
    })().catch((err) => {
      corePromise = null;
      throw err;
    });
  }
  return corePromise;
}

export function getFirebaseAuth() {
  if (!authPromise) {
    authPromise = (async () => {
      const core = await getFirebase();
      const authApi = await import(`${SDK_BASE}/firebase-auth.js`);
      const auth = authApi.getAuth(core.app);
      if (core.emulators && core.emulators.authHost) {
        authApi.connectAuthEmulator(auth, `http://${core.emulators.authHost}`, { disableWarnings: true });
      }
      return { ...core, auth, authApi };
    })().catch((err) => {
      authPromise = null;
      throw err;
    });
  }
  return authPromise;
}
