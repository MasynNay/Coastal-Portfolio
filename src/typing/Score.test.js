import { measure, readScores, saveScore, removeScore } from "./Score";
import { makeWords } from "./Words";

test("WPM uses five correct characters and the actual elapsed minute fraction", () => {
  expect(measure(["hello", "world"], "hello world", 30000)).toEqual({
    wpm: 4,
    rawWpm: 4,
    accuracy: 100,
    correctWords: 2,
  });
  expect(measure(["hello"], "hello", 0).wpm).toBe(0);
});
test("incorrect, extra and skipped letters affect accuracy; corrections can repair them", () => {
  expect(measure(["hello", "world"], "he world", 30000).accuracy).toBe(73);
  expect(measure(["hello"], "hellox", 30000).accuracy).toBe(83);
  expect(measure(["hello"], "hello", 30000).accuracy).toBe(100);
  expect(measure(["hello"], "he", 30000).accuracy).toBe(100);
});
test("word rounds remain local, randomized and long enough for the original 200-word game", () => {
  const words = makeWords("words", 200, () => 0.5);
  expect(words).toHaveLength(200);
  expect(words.every((word, i) => i === 0 || word !== words[i - 1])).toBe(true);
  expect(makeWords("developer", 1, () => 0)).toEqual(["array"]);
});
test("removing one score leaves other rounds intact, and saving it restores it for Undo", () => {
  let value = null;
  const storage = {
    getItem: () => value,
    setItem: (_, next) => {
      value = next;
    },
  };
  const a = { wpm: 40, accuracy: 98, duration: 30, mode: "words", date: 1 },
    b = { ...a, date: 2, wpm: 50 };
  saveScore(a, storage);
  saveScore(b, storage);
  expect(removeScore(2, storage)).toEqual([a]);
  expect(saveScore(b, storage)).toEqual([b, a]);
});
test("score storage survives corruption, saves whole results and tolerates blocked storage", () => {
  const storage = { getItem: jest.fn(() => "broken"), setItem: jest.fn() };
  expect(readScores(storage)).toEqual([]);
  const result = {
    wpm: 42,
    accuracy: 98,
    duration: 30,
    mode: "words",
    date: 10,
  };
  expect(saveScore(result, storage)).toEqual([result]);
  expect(JSON.parse(storage.setItem.mock.calls[0][1])).toEqual([result]);
  storage.getItem.mockImplementation(() =>
    JSON.stringify([
      result,
      { ...result, wpm: NaN },
      { ...result, duration: 0 },
    ]),
  );
  expect(readScores(storage)).toEqual([result]);
  storage.getItem.mockImplementation(() => {
    throw new Error("blocked");
  });
  storage.setItem.mockImplementation(() => {
    throw new Error("blocked");
  });
  expect(saveScore(result, storage)).toEqual([result]);
});
