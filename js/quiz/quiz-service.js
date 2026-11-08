import { getFirebase, getFirebaseAuth } from "./firebase.js";

const COLLECTION = "quiz_submissions";

// The document id is the session id, and firestore.rules forbid updates,
// so the same quiz session can never be saved twice.
export async function submitQuizResult({ sessionId, participantName, recommendedField, fieldScores, answers }) {
  const { db, fs } = await getFirebase();
  await fs.setDoc(fs.doc(db, COLLECTION, sessionId), {
    participantName,
    recommendedField,
    fieldScores,
    answers,
    sessionId,
    submittedAt: fs.serverTimestamp(),
  });
}

// Live feed for the dashboard (admins only, enforced by firestore.rules).
// Returns an unsubscribe function.
export async function subscribeToSubmissions({ since, onChange, onError }) {
  const { db, fs } = await getFirebase();
  const constraints = [];
  if (since) constraints.push(fs.where("submittedAt", ">=", fs.Timestamp.fromDate(since)));
  constraints.push(fs.orderBy("submittedAt", "desc"), fs.limit(500));
  const q = fs.query(fs.collection(db, COLLECTION), ...constraints);
  return fs.onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const submissions = snapshot.docs.map((d) => {
        const data = d.data({ serverTimestamps: "estimate" });
        return {
          id: d.id,
          participantName: data.participantName,
          recommendedField: data.recommendedField,
          submittedAt: data.submittedAt ? data.submittedAt.toDate() : null,
        };
      });
      const addedIds = snapshot.docChanges().filter((c) => c.type === "added").map((c) => c.doc.id);
      onChange({ submissions, addedIds, fromCache: snapshot.metadata.fromCache });
    },
    onError
  );
}

export async function signInAdmin(email, password) {
  const { auth, authApi } = await getFirebaseAuth();
  return authApi.signInWithEmailAndPassword(auth, email, password);
}

export async function signOutAdmin() {
  const { auth, authApi } = await getFirebaseAuth();
  return authApi.signOut(auth);
}

// Calls back with { user, isAdmin } whenever the sign-in state changes.
export async function watchAdminSession(callback) {
  const { auth, authApi, db, fs } = await getFirebaseAuth();
  return authApi.onAuthStateChanged(auth, async (user) => {
    if (!user) return callback({ user: null, isAdmin: false });
    try {
      const adminDoc = await fs.getDoc(fs.doc(db, "admins", user.uid));
      callback({ user, isAdmin: adminDoc.exists() });
    } catch (err) {
      callback({ user, isAdmin: false, error: err });
    }
  });
}
