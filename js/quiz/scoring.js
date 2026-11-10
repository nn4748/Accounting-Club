import { KEYS, QUESTIONS } from "./quiz-data.js";

// كم مرة تظهر كل شخصية كخيار، عشان الشخصية اللي تظهر ٣ مرات ما تظلم قدام اللي تظهر ٤.
function appearances(questions) {
  const n = Object.fromEntries(KEYS.map((k) => [k, 0]));
  questions.forEach((q) => q.choices.forEach((c) => { n[c.type] += 1; }));
  return n;
}
const APPEARANCES = appearances(QUESTIONS);

// answers: رقم الخيار المختار لكل سؤال.
// النسبة = عدد اختيارات الشخصية ÷ عدد مرات ظهورها. عند التعادل تُختار وحدة
// من المتعادلات عشوائيًا بالتساوي (النتيجة تنحفظ مرة وحدة)، والثانية تظهر كـ"قريبة منك".
export function computeResult(answers, questions = QUESTIONS, random = Math.random) {
  const appear = questions === QUESTIONS ? APPEARANCES : appearances(questions);
  const counts = Object.fromEntries(KEYS.map((k) => [k, 0]));
  answers.forEach((choiceIndex, qIndex) => {
    counts[questions[qIndex].choices[choiceIndex].type] += 1;
  });

  const ratio = Object.fromEntries(KEYS.map((k) => [k, appear[k] ? counts[k] / appear[k] : 0]));
  const tieOrder = Object.fromEntries(KEYS.map((k) => [k, random()]));
  const ranked = [...KEYS].sort((a, b) => ratio[b] - ratio[a] || tieOrder[a] - tieOrder[b]);

  const top = ranked[0];
  const second = ranked[1];
  return {
    field: top,
    closeSecond: counts[second] > 0 && ratio[second] === ratio[top] ? second : null,
    ranked,
    scores: counts,
    percents: Object.fromEntries(KEYS.map((k) => [k, Math.round(ratio[k] * 100)])),
  };
}
