// Five correct characters (including word separators) count as one WPM word.
// Submitted words include missing letters in accuracy; the unfinished word does not.
export function measure(words, input, elapsedMs) {
  const tokens = input.split(" ");
  let correct = 0,
    attempted = 0,
    correctWords = 0;
  tokens.slice(0, words.length).forEach((typed, index) => {
    const expected = words[index],
      submitted = index < tokens.length - 1;
    for (
      let i = 0;
      i < Math.max(typed.length, submitted ? expected.length : 0);
      i++
    ) {
      attempted++;
      if (typed[i] === expected[i]) correct++;
    }
    if (submitted) {
      attempted++;
      correct++;
    }
    if (typed === expected) correctWords++;
  });
  const minutes = Math.max(0, elapsedMs) / 60000;
  return {
    wpm: minutes ? Math.round(correct / 5 / minutes) : 0,
    rawWpm: minutes ? Math.round(input.length / 5 / minutes) : 0,
    accuracy: attempted ? Math.round((correct / attempted) * 100) : 100,
    correctWords,
  };
}

const key = "masyn-typeninja-scores-v1";
export function readScores(storage = null) {
  try {
    const rows = JSON.parse((storage || window.localStorage).getItem(key));
    return Array.isArray(rows)
      ? rows
          .filter(
            (s) =>
              Number.isFinite(s.wpm) &&
              s.wpm >= 0 &&
              s.wpm <= 1000 &&
              Number.isFinite(s.accuracy) &&
              s.accuracy >= 0 &&
              s.accuracy <= 100 &&
              [15, 30, 60].includes(s.duration) &&
              ["words", "developer"].includes(s.mode) &&
              Number.isFinite(s.date),
          )
          .slice(0, 100)
      : [];
  } catch {
    return [];
  }
}
export function saveScore(result, storage = null) {
  const scores = [result, ...readScores(storage)].slice(0, 100);
  try {
    (storage || window.localStorage).setItem(key, JSON.stringify(scores));
  } catch {
    /* Practice still works without storage. */
  }
  return scores;
}
export function removeScore(date, storage = null) {
  const scores = readScores(storage).filter((score) => score.date !== date);
  try {
    (storage || window.localStorage).setItem(key, JSON.stringify(scores));
  } catch {
    /* Keep the in-memory scoreboard usable. */
  }
  return scores;
}
