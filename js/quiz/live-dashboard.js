import { PERSONALITIES as FIELDS, KEYS as FIELD_KEYS } from "./quiz-data.js";
import { signInAdmin, signOutAdmin, subscribeToSubmissions, watchAdminSession } from "./quiz-service.js";

const $ = (id) => document.getElementById(id);
const views = { login: $("loginView"), state: $("stateView"), dashboard: $("dashboardView") };
const LABEL_TO_KEY = Object.fromEntries(FIELD_KEYS.map((k) => [FIELDS[k].label, k]));

let unsubscribe = null;
let todayOnly = true;
let firstSnapshot = true;
let lastTotal = 0;
let retryTimer = null;
const FEED_LIMIT = 60;

function showView(name) {
  Object.entries(views).forEach(([key, el]) => { el.hidden = key !== name; });
  $("liveStatus").hidden = name !== "dashboard";
}

function showState(text, { spinner = false, signOut = false } = {}) {
  const view = views.state;
  view.replaceChildren();
  if (spinner) {
    const s = document.createElement("div");
    s.className = "quiz-spinner";
    view.appendChild(s);
  }
  const p = document.createElement("p");
  p.textContent = text;
  view.appendChild(p);
  if (signOut) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "live-btn";
    btn.style.marginTop = "18px";
    btn.textContent = "تسجيل الخروج";
    btn.addEventListener("click", () => signOutAdmin());
    view.appendChild(btn);
  }
  showView("state");
}

function setConnection(kind, text) {
  const pill = $("connectionPill");
  pill.className = "live-pill live-pill--" + kind;
  $("connectionText").textContent = text;
}

/* ---------- الإحصائيات ---------- */
function renderStats(submissions) {
  const counts = Object.fromEntries(FIELD_KEYS.map((k) => [k, 0]));
  submissions.forEach((s) => {
    const key = LABEL_TO_KEY[s.personality];
    if (key) counts[key] += 1;
  });

  const total = submissions.length;
  const totalEl = $("totalCount");
  totalEl.textContent = total;
  if (total > lastTotal && !firstSnapshot) {
    totalEl.classList.remove("bump");
    void totalEl.offsetWidth;
    totalEl.classList.add("bump");
  }
  lastTotal = total;

  const max = Math.max(0, ...Object.values(counts));
  const leaders = FIELD_KEYS.filter((k) => max > 0 && counts[k] === max).map((k) => FIELDS[k].label);
  $("topField").textContent = leaders.length ? leaders.join(" و") : "لا يوجد بعد";

  const shown = FIELD_KEYS.filter((k) => counts[k] > 0).sort((a, b) => counts[b] - counts[a]);
  $("distribution").replaceChildren(...shown.map((key) => {
    const row = document.createElement("div");
    row.className = "live-dist-row";
    const name = document.createElement("span");
    name.className = "live-dist-name";
    name.textContent = FIELDS[key].label;
    const count = document.createElement("span");
    count.className = "live-dist-count";
    const pct = total ? Math.round((counts[key] / total) * 100) : 0;
    count.textContent = `${counts[key]} · ${pct}%`;
    const track = document.createElement("div");
    track.className = "live-dist-track";
    const fill = document.createElement("div");
    fill.className = "live-dist-fill";
    fill.style.background = FIELDS[key].color;
    fill.style.width = (max ? (counts[key] / max) * 100 : 0) + "%";
    track.appendChild(fill);
    row.append(name, count, track);
    return row;
  }));
}

/* ---------- بطاقات المشاركين ---------- */
function formatTime(date) {
  if (!date) return "الآن";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function buildParticipantCard(s, isNew) {
  const card = document.createElement("article");
  card.className = "p-card" + (isNew ? " is-new" : "");
  const key = LABEL_TO_KEY[s.personality];
  if (key) card.style.setProperty("--field-color", FIELDS[key].color);

  const name = document.createElement("div");
  name.className = "p-name";
  name.textContent = s.participantName;

  const typeLabel = document.createElement("div");
  typeLabel.className = "p-label";
  typeLabel.textContent = "شخصيتك المحاسبية:";
  const type = document.createElement("div");
  type.className = "p-field";
  type.textContent = s.personality;

  const fieldLabel = document.createElement("div");
  fieldLabel.className = "p-label";
  fieldLabel.textContent = "المجال المناسب لك:";
  const field = document.createElement("div");
  field.className = "p-sub";
  field.textContent = s.recommendedField;

  const timeLabel = document.createElement("div");
  timeLabel.className = "p-label";
  timeLabel.textContent = "وقت المشاركة:";
  const time = document.createElement("div");
  time.className = "p-time";
  time.dir = "ltr";
  time.textContent = formatTime(s.submittedAt);

  card.append(name, typeLabel, type, fieldLabel, field, timeLabel, time);
  return card;
}

function renderFeed(submissions, addedIds) {
  const added = new Set(firstSnapshot ? [] : addedIds);
  // نعرض آخر ٦٠ مشارك فقط عشان الشاشة تظل سريعة، والإحصائيات تحسب الكل.
  $("feed").replaceChildren(...submissions.slice(0, FEED_LIMIT).map((s) => buildParticipantCard(s, added.has(s.id))));
  $("feedEmpty").hidden = submissions.length > 0;
}

/* ---------- الاشتراك اللحظي ---------- */
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function stopFeed() {
  clearTimeout(retryTimer);
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

async function startFeed() {
  stopFeed();
  firstSnapshot = true;
  lastTotal = 0;
  setConnection("warn", "جارٍ الاتصال");
  try {
    unsubscribe = await subscribeToSubmissions({
      since: todayOnly ? startOfToday() : null,
      onChange: ({ submissions, addedIds, fromCache }) => {
        renderStats(submissions);
        renderFeed(submissions, addedIds);
        if (!fromCache) firstSnapshot = false;
        if (navigator.onLine === false) setConnection("bad", "غير متصل");
        else if (fromCache) setConnection("warn", "جارٍ المزامنة");
        else setConnection("ok", "متصل");
      },
      onError: (err) => {
        console.error("Live feed error:", err);
        if (err && err.code === "permission-denied") {
          stopFeed();
          showState("هذا الحساب لا يملك صلاحية عرض الشاشة.", { signOut: true });
          return;
        }
        setConnection("bad", "انقطع الاتصال");
        retryTimer = setTimeout(startFeed, 5000);
      },
    });
  } catch (err) {
    console.error("Live feed failed to start:", err);
    setConnection("bad", "انقطع الاتصال");
    retryTimer = setTimeout(startFeed, 5000);
  }
}

window.addEventListener("offline", () => setConnection("bad", "غير متصل"));
window.addEventListener("online", () => setConnection("warn", "جارٍ المزامنة"));
window.addEventListener("pagehide", stopFeed);

$("todayToggle").addEventListener("click", () => {
  todayOnly = !todayOnly;
  $("todayToggle").setAttribute("aria-pressed", String(todayOnly));
  $("todayToggle").textContent = todayOnly ? "اليوم فقط" : "كل الأيام";
  startFeed();
});

$("signOutBtn").addEventListener("click", () => signOutAdmin());

/* ---------- تسجيل الدخول ---------- */
const LOGIN_ERRORS = {
  "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "auth/wrong-password": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "auth/user-not-found": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "auth/invalid-email": "البريد الإلكتروني غير صحيح.",
  "auth/user-disabled": "هذا الحساب موقوف.",
  "auth/too-many-requests": "محاولات كثيرة، حاول بعد قليل.",
  "auth/network-request-failed": "تعذّر الاتصال، تأكد من الإنترنت.",
};

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("adminEmail").value.trim();
  const password = $("adminPassword").value;
  const errorEl = $("loginError");
  if (!email || !password) {
    errorEl.textContent = "اكتب البريد الإلكتروني وكلمة المرور.";
    errorEl.hidden = false;
    return;
  }
  const btn = $("loginBtn");
  btn.disabled = true;
  btn.textContent = "جارٍ الدخول...";
  errorEl.hidden = true;
  try {
    await signInAdmin(email, password);
    $("adminPassword").value = "";
  } catch (err) {
    errorEl.textContent = LOGIN_ERRORS[err && err.code] || "تعذّر تسجيل الدخول، حاول مرة ثانية.";
    errorEl.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = "دخول";
  }
});

/* ---------- البداية ---------- */
showState("جارٍ التحميل...", { spinner: true });

watchAdminSession(({ user, isAdmin }) => {
  if (!user) {
    stopFeed();
    showView("login");
    return;
  }
  if (!isAdmin) {
    stopFeed();
    showState("هذا الحساب غير مصرّح له بعرض شاشة المستويات.", { signOut: true });
    return;
  }
  showView("dashboard");
  startFeed();
}).catch((err) => {
  console.error("Dashboard init failed:", err);
  if (err && err.name === "FirebaseNotConfiguredError") {
    showState("شاشة المستويات غير مفعّلة بعد: لم يتم ربط قاعدة البيانات.");
  } else {
    showState("تعذّر تحميل الشاشة، حدّث الصفحة وحاول مرة ثانية.");
  }
});
