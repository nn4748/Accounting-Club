import { KEYS, QUESTIONS } from "./quiz-data.js";

// answers: رقم الخيار المختار لكل سؤال.
// كل إجابة تعطي نقطة لشخصية واحدة. عند التعادل تُختار وحدة من المتعادلات
// عشوائيًا بالتساوي (النتيجة تنحفظ مرة وحدة)، والمتعادلة الثانية تظهر كـ"قريبة منك".
export function computeResult(answers, questions = QUESTIONS, random = Math.random) {
  const counts = Object.fromEntries(KEYS.map((k) => [k, 0]));
  answers.forEach((choiceIndex, qIndex) => {
    counts[questions[qIndex].choices[choiceIndex].type] += 1;
  });

  const tieOrder = Object.fromEntries(KEYS.map((k) => [k, random()]));
  const ranked = [...KEYS].sort((a, b) => counts[b] - counts[a] || tieOrder[a] - tieOrder[b]);

  const top = ranked[0];
  const second = ranked[1];
  return {
    field: top,
    closeSecond: counts[second] > 0 && counts[second] === counts[top] ? second : null,
    ranked,
    scores: counts,
  };
}
