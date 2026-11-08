import { PERSONALITIES, QUESTIONS } from "./quiz-data.js";
import { computeResult } from "./scoring.js";
import { submitQuizResult } from "./quiz-service.js";

const STORAGE_KEY = "atharnaQuiz";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArabicDigits = (n) => String(n).replace(/[0-9]/g, (d) => AR_DIGITS[d]);

const $ = (id) => document.getElementById(id);
const screens = {
  welcome: $("screenWelcome"),
  question: $("screenQuestion"),
  analyzing: $("screenAnalyzing"),
  result: $("screenResult"),
};

let state = loadState() || newState();
let saving = false;

function newState() {
  return { sessionId: makeSessionId(), name: "", answers: [], current: 0, step: "welcome", result: null, saved: false, attempted: false };
}

function makeSessionId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function loadState() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    return saved && saved.sessionId ? saved : null;
  } catch (e) {
    return null;
  }
}

function persist() {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* التخزين غير متاح */ }
}

function show(name) {
  Object.entries(screens).forEach(([key, el]) => { el.hidden = key !== name; });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- الخطوة ١: الترحيب ---------- */
const nameInput = $("participantName");
const nameError = $("nameError");

function cleanName(raw) {
  return String(raw || "").replace(/\s+/g, " ").trim();
}

function validateName(name) {
  if (!name) return "فضلًا، اكتب اسمك للبدء.";
  if (name.length < 2) return "الاسم قصير جدًا، اكتب اسمك كاملًا.";
  if (!/\p{L}/u.test(name)) return "اكتب اسمك بالحروف.";
  return "";
}

$("welcomeForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = cleanName(nameInput.value);
  const error = validateName(name);
  nameError.textContent = error;
  nameError.hidden = !error;
  if (error) { nameInput.focus(); return; }
  state = { ...newState(), name, step: "question" };
  persist();
  renderQuestion();
  show("question");
});
nameInput.addEventListener("input", () => { nameError.hidden = true; });

/* ---------- الخطوة ٢: الأسئلة ---------- */
const choicesEl = $("choices");
const choiceError = $("choiceError");
const prevBtn = $("prevBtn");
const nextBtn = $("nextBtn");

function renderQuestion() {
  const index = state.current;
  const q = QUESTIONS[index];
  const total = QUESTIONS.length;

  $("questionCounter").textContent = `السؤال ${toArabicDigits(index + 1)} من ${toArabicDigits(total)}`;
  const percent = Math.round((index / total) * 100);
  $("progressBar").style.width = percent + "%";
  $("progressTrack").setAttribute("aria-valuenow", percent);

  const body = $("questionBody");
  body.style.animation = "none";
  void body.offsetWidth;
  body.style.animation = "";

  $("questionText").textContent = q.text;
  choicesEl.replaceChildren(...q.choices.map((choice, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-choice";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", String(state.answers[index] === i));
    const mark = document.createElement("span");
    mark.className = "quiz-choice-mark";
    const text = document.createElement("span");
    text.textContent = choice.text;
    btn.append(mark, text);
    btn.addEventListener("click", () => selectChoice(i));
    return btn;
  }));

  choiceError.hidden = true;
  prevBtn.disabled = index === 0;
  nextBtn.textContent = index === total - 1 ? "اعرض النتيجة" : "التالي";
}

function selectChoice(i) {
  state.answers[state.current] = i;
  persist();
  choicesEl.querySelectorAll(".quiz-choice").forEach((btn, idx) => btn.setAttribute("aria-checked", String(idx === i)));
  choiceError.hidden = true;
}

prevBtn.addEventListener("click", () => {
  if (state.current === 0) return;
  state.current -= 1;
  persist();
  renderQuestion();
});

nextBtn.addEventListener("click", () => {
  if (state.answers[state.current] === undefined || state.answers[state.current] === null) {
    choiceError.hidden = false;
    return;
  }
  if (state.current < QUESTIONS.length - 1) {
    state.current += 1;
    persist();
    renderQuestion();
    return;
  }
  finishQuiz();
});

/* ---------- الخطوة ٣: النتيجة ---------- */
function finishQuiz() {
  if (state.step === "result") return;
  state.result = computeResult(state.answers);
  state.step = "result";
  persist();
  show("analyzing");
  setTimeout(() => {
    renderResult();
    show("result");
    saveResult();
  }, 1400);
}

function renderResult() {
  const { field, closeSecond, ranked, scores } = state.result;
  const info = PERSONALITIES[field];
  screens.result.style.setProperty("--result-color", info.color);

  const headline = $("resultHeadline");
  const strong = document.createElement("strong");
  strong.textContent = info.label;
  headline.replaceChildren(`${state.name}، شخصيتك المحاسبية هي `, strong, "!");

  $("resultReason").textContent = info.meaning;
  $("resultDescription").textContent = info.field;

  const close = $("resultClose");
  if (closeSecond) {
    const b = document.createElement("b");
    b.textContent = PERSONALITIES[closeSecond].label;
    close.replaceChildren("وشخصية ", b, " قريبة منك أيضًا.");
    close.hidden = false;
  } else {
    close.hidden = true;
  }

  const bars = $("resultBars");
  const total = QUESTIONS.length;
  bars.replaceChildren(...ranked.slice(0, 3).filter((key) => scores[key] > 0).map((key) => {
    const row = document.createElement("div");
    row.className = "result-bar-row";
    const label = document.createElement("span");
    label.textContent = PERSONALITIES[key].label;
    const track = document.createElement("div");
    track.className = "result-bar-track";
    const fill = document.createElement("div");
    fill.className = "result-bar-fill";
    fill.style.background = PERSONALITIES[key].color;
    track.appendChild(fill);
    const value = document.createElement("b");
    const pct = Math.round((scores[key] / total) * 100);
    value.textContent = toArabicDigits(pct) + "٪";
    row.append(label, track, value);
    requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = pct + "%"; }));
    return row;
  }));

  updateSaveStatus();
}

function updateSaveStatus(message, kind) {
  const el = $("saveStatus");
  el.classList.remove("is-ok", "is-error");
  if (state.saved) {
    el.textContent = "تم حفظ نتيجتك ✓";
    el.classList.add("is-ok");
    $("retrySaveBtn").hidden = true;
    return;
  }
  el.textContent = message || "";
  if (kind) el.classList.add(kind);
}

async function saveResult() {
  if (state.saved || saving || !state.result) return;
  saving = true;
  $("retrySaveBtn").hidden = true;
  updateSaveStatus("جارٍ حفظ نتيجتك...");
  const firstAttempt = !state.attempted;
  state.attempted = true;
  persist();
  try {
    await submitQuizResult({
      sessionId: state.sessionId,
      participantName: state.name,
      personality: PERSONALITIES[state.result.field].label,
      recommendedField: PERSONALITIES[state.result.field].field,
      scores: state.result.scores,
      answers: state.answers,
    });
    state.saved = true;
  } catch (err) {
    // Rules reject a second write to the same session, so on a retry a
    // permission error means the first attempt already went through.
    if (!firstAttempt && err && err.code === "permission-denied") {
      state.saved = true;
    } else {
      console.error("تعذر حفظ النتيجة:", err);
      const notConfigured = err && err.name === "FirebaseNotConfiguredError";
      updateSaveStatus(
        notConfigured ? "تعذّر حفظ النتيجة: الحفظ غير مفعّل حاليًا." : "تعذّر حفظ النتيجة، تأكد من اتصالك بالإنترنت.",
        "is-error"
      );
      $("retrySaveBtn").hidden = false;
    }
  } finally {
    saving = false;
    persist();
    if (state.saved) updateSaveStatus();
  }
}

$("retrySaveBtn").addEventListener("click", saveResult);

$("restartBtn").addEventListener("click", () => {
  const name = state.name;
  state = newState();
  persist();
  nameInput.value = name;
  show("welcome");
});

/* ---------- الاستئناف بعد تحديث الصفحة ---------- */
if (state.step === "result" && state.result) {
  renderResult();
  show("result");
  saveResult();
} else if (state.step === "question" && state.name) {
  renderQuestion();
  show("question");
} else {
  show("welcome");
}
