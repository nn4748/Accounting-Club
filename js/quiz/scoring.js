import { FIELD_KEYS, QUESTIONS } from "./quiz-data.js";

// Scores within this distance of the top count as a tie.
const TIE_MARGIN = 0.03;
// A runner-up within this distance is shown as a close second field.
const CLOSE_MARGIN = 0.1;

// The most points each field can collect, so fields that appear in fewer
// choices are not disadvantaged.
function maxPointsPerField(questions) {
  const max = Object.fromEntries(FIELD_KEYS.map((k) => [k, 0]));
  for (const q of questions) {
    for (const key of FIELD_KEYS) {
      max[key] += Math.max(0, ...q.choices.map((c) => c.points[key] || 0));
    }
  }
  return max;
}

const MAX_POINTS = maxPointsPerField(QUESTIONS);

// answers: array of selected choice indexes, one per question.
export function computeResult(answers, questions = QUESTIONS) {
  const maxPoints = questions === QUESTIONS ? MAX_POINTS : maxPointsPerField(questions);
  const raw = Object.fromEntries(FIELD_KEYS.map((k) => [k, 0]));
  const strongPicks = Object.fromEntries(FIELD_KEYS.map((k) => [k, 0]));
  const lastStrongPick = Object.fromEntries(FIELD_KEYS.map((k) => [k, -1]));

  answers.forEach((choiceIndex, qIndex) => {
    const choice = questions[qIndex].choices[choiceIndex];
    for (const [key, pts] of Object.entries(choice.points)) {
      raw[key] += pts;
      if (pts >= 3) {
        strongPicks[key] += 1;
        lastStrongPick[key] = qIndex;
      }
    }
  });

  const normalized = Object.fromEntries(
    FIELD_KEYS.map((k) => [k, maxPoints[k] ? raw[k] / maxPoints[k] : 0])
  );

  // Ranking: normalized score; ties (within TIE_MARGIN) are broken by how
  // many times the field was the main choice, then by the most recent main
  // choice, then by the fixed field order.
  const ranked = [...FIELD_KEYS].sort((a, b) => {
    const diff = normalized[b] - normalized[a];
    if (Math.abs(diff) > TIE_MARGIN) return diff;
    if (strongPicks[b] !== strongPicks[a]) return strongPicks[b] - strongPicks[a];
    if (lastStrongPick[b] !== lastStrongPick[a]) return lastStrongPick[b] - lastStrongPick[a];
    return FIELD_KEYS.indexOf(a) - FIELD_KEYS.indexOf(b);
  });

  const top = ranked[0];
  const second = ranked[1];
  const closeSecond = normalized[top] - normalized[second] <= CLOSE_MARGIN ? second : null;

  return {
    field: top,
    closeSecond,
    ranked,
    scores: Object.fromEntries(FIELD_KEYS.map((k) => [k, Math.round(normalized[k] * 100)])),
  };
}
