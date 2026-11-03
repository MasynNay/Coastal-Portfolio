import { projectById } from "../data/projects";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRepeat, Trophy } from "react-bootstrap-icons";
import { makeWords } from "./Words";
import { measure, readScores, saveScore, removeScore } from "./Score";
import "./typing.css";

// The Mac window owns visibility; this app owns only its round and local scores.
// A native textarea supplies real keyboard/touch input, including backspace.
export default function TypingTest({ active = true }) {
  const [duration, setDuration] = useState(30),
    [mode, setMode] = useState("words");
  const [words, setWords] = useState(() => makeWords());
  const [input, setInput] = useState(""),
    [phase, setPhase] = useState("ready");
  const [elapsed, setElapsed] = useState(0),
    [focused, setFocused] = useState(false);
  const [scores, setScores] = useState(readScores),
    [showScores, setShowScores] = useState(false);
  const [result, setResult] = useState(null);
  const [removedScores, setRemovedScores] = useState([]);
  const field = useRef(null),
    currentWord = useRef(null),
    wordsBox = useRef(null);
  const clock = useRef({
    running: false,
    started: 0,
    elapsed: 0,
    input: "",
    words,
    duration,
    mode,
  });

  const finish = useCallback((time) => {
    const c = clock.current;
    if (!c.running) return;
    c.running = false;
    c.elapsed = Math.min(time, c.duration * 1000);
    const score = {
      ...measure(c.words, c.input, c.elapsed),
      duration: c.duration,
      mode: c.mode,
      date: Date.now(),
    };
    setElapsed(c.elapsed);
    setResult(score);
    setPhase("done");
    if (c.input.trim()) setScores(saveScore(score));
  }, []);
  const pause = useCallback(() => {
    const c = clock.current;
    if (!c.running) return;
    const time = c.elapsed + performance.now() - c.started;
    if (time >= c.duration * 1000) {
      finish(time);
      return;
    }
    c.running = false;
    c.elapsed = time;
    setElapsed(time);
    setPhase("paused");
  }, [finish]);
  useEffect(() => {
    if (!active) pause();
  }, [active, pause]);
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [pause]);
  useEffect(() => {
    if (phase !== "running") return;
    const timer = setInterval(() => {
      const c = clock.current;
      if (!c.running) return;
      const time = c.elapsed + performance.now() - c.started;
      if (time >= c.duration * 1000) finish(time);
      else setElapsed(time);
    }, 100);
    return () => clearInterval(timer);
  }, [phase, finish]);

  const tokens = input.split(" "),
    wordIndex = Math.min(tokens.length - 1, words.length - 1);
  useEffect(() => {
    // Scroll only the word viewport, never the entire Mac window or page.
    const node = currentWord.current,
      box = wordsBox.current;
    if (node && box) {
      const line = parseFloat(getComputedStyle(box).lineHeight) || 42;
      box.scrollTop = Math.max(0, node.offsetTop - line);
    }
  }, [wordIndex]);

  function reset(nextDuration = duration, nextMode = mode) {
    const next = makeWords(nextMode);
    clock.current = {
      running: false,
      started: 0,
      elapsed: 0,
      input: "",
      words: next,
      duration: nextDuration,
      mode: nextMode,
    };
    setDuration(nextDuration);
    setMode(nextMode);
    setWords(next);
    setInput("");
    setElapsed(0);
    setPhase("ready");
    setResult(null);
    field.current?.focus({ preventScroll: true });
  }
  function change(value) {
    const c = clock.current;
    if (!active || phase === "done") return;
    const time = c.running
      ? c.elapsed + performance.now() - c.started
      : c.elapsed;
    if (time >= c.duration * 1000) {
      finish(time);
      return;
    }
    value = value.replace(/[\r\n\t]/g, " ");
    if (!c.running && value.length) {
      c.running = true;
      c.started = performance.now();
      setPhase("running");
    }
    c.input = value;
    setInput(value);
    if (value.split(" ").length > words.length) finish(time);
  }
  const live = result || measure(words, input, elapsed);
  const best = Math.max(
    0,
    ...scores
      .filter((s) => s.mode === mode && s.duration === duration)
      .map((s) => s.wpm),
  );
  const ranked = scores
    .filter((s) => s.mode === mode && s.duration === duration)
    .sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy)
    .slice(0, 10);
  return (
    <div className="typing-app">
      <header className="typing-header">
        <img
          src="/typing/TypeNinja.png"
          alt="TypeNinja’s keyboard-wielding ninja"
          width="76"
          height="76"
        />
        <div>
          <span>TYPING TEST</span>
          <h1>TypeNinja</h1>
          <p>A little practice. A quicker keyboard.</p>
        </div>
        <button
          className="typing-scores-toggle"
          onClick={() => setShowScores(!showScores)}
          aria-expanded={showScores}
        >
          <Trophy aria-hidden="true" /> Scores
        </button>
      </header>
      <div className="typing-settings">
        <div role="group" aria-label="Test duration">
          {[15, 30, 60].map((seconds) => (
            <button
              key={seconds}
              aria-pressed={duration === seconds}
              disabled={phase === "running"}
              onClick={() => reset(seconds, mode)}
            >
              {seconds}s
            </button>
          ))}
        </div>
        <div role="group" aria-label="Word selection">
          {[
            ["words", "Words"],
            ["developer", "Developer"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={mode === id}
              disabled={phase === "running"}
              onClick={() => reset(duration, id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="typing-metrics" aria-label="Typing statistics">
        <div>
          <strong>
            {Math.max(0, Math.ceil(duration - elapsed / 1000))}
            <small>s</small>
          </strong>
          <span>Remaining</span>
        </div>
        <div>
          <strong>{live.wpm}</strong>
          <span>WPM</span>
        </div>
        <div>
          <strong>
            {live.accuracy}
            <small>%</small>
          </strong>
          <span>Accuracy</span>
        </div>
        <div>
          <strong>{best || "—"}</strong>
          <span>Personal best</span>
        </div>
      </div>
      <div className="typing-time-track" aria-hidden="true">
        <span
          style={{
            transform: `scaleX(${Math.max(0, 1 - elapsed / (duration * 1000))})`,
          }}
        />
      </div>
      {phase !== "done" ? (
        <>
          <div className={`typing-board ${focused ? "is-focused" : ""}`}>
            <div className="typing-words" ref={wordsBox} aria-hidden="true">
              {words.map((word, index) => (
                <span
                  className={`typing-word ${index === wordIndex ? "is-current" : ""}`}
                  key={index}
                  ref={index === wordIndex ? currentWord : null}
                >
                  {word.split("").map((letter, j) => (
                    <span
                      key={j}
                      className={
                        (index < tokens.length - 1
                          ? tokens[index]?.[j] === letter
                            ? "is-correct"
                            : "is-wrong"
                          : index === wordIndex && j < tokens[index].length
                            ? tokens[index][j] === letter
                              ? "is-correct"
                              : "is-wrong"
                            : "") +
                        (index === wordIndex && j === tokens[index].length
                          ? " is-caret"
                          : "")
                      }
                    >
                      {letter}
                    </span>
                  ))}
                  {index < tokens.length &&
                    tokens[index].length > word.length && (
                      <span className="is-wrong">
                        {tokens[index].slice(word.length)}
                      </span>
                    )}
                  {index === wordIndex &&
                    tokens[index].length >= word.length && (
                      <span className="is-caret"> </span>
                    )}
                </span>
              ))}
            </div>
            <textarea
              ref={field}
              value={input}
              onChange={(e) => change(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                pause();
              }}
              onPaste={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              aria-label="Type the highlighted words"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
            />
            {!focused && (
              <div className="typing-focus-hint">
                {phase === "paused"
                  ? "Paused · click or tap to continue"
                  : "Click or tap here to start typing"}
              </div>
            )}
          </div>
          <p className="typing-hint">
            {phase === "paused"
              ? "Your time is paused. Keep typing when you’re ready."
              : "The clock starts with your first character. Space moves to the next word; Backspace lets you correct it."}
          </p>
        </>
      ) : (
        <section className="typing-result" role="status">
          <span>ROUND COMPLETE</span>
          <h2>
            {result.wpm} <small>WPM</small>
          </h2>
          <p>
            {result.accuracy}% accuracy · {result.correctWords} correct words ·{" "}
            {result.rawWpm} raw WPM
          </p>
          <p>
            {input.trim()
              ? "Your score is saved on this device."
              : "Try another round and type a few words to save a score."}
          </p>
        </section>
      )}
      <div className="typing-actions">
        <button onClick={() => reset()}>
          <ArrowRepeat aria-hidden="true" />{" "}
          {phase === "done" ? "Play again" : "New test"}
        </button>
        {phase === "ready" && !focused && (
          <button
            className="typing-start"
            onClick={() => field.current?.focus()}
          >
            Start typing →
          </button>
        )}
      </div>
      {showScores && (
        <section className="typing-scoreboard">
          <h2>
            Your scoreboard{" "}
            <small>
              {duration}s · {mode === "words" ? "Words" : "Developer"}
            </small>
          </h2>
          {ranked.length ? (
            <ol>
              {ranked.map((score, i) => (
                <li key={`${score.date}-${i}`}>
                  <span>
                    {i + 1}. <strong>{score.wpm} WPM</strong>
                  </span>
                  <span>
                    {score.accuracy}% ·{" "}
                    {new Date(score.date).toLocaleDateString()}
                  </span>
                  <button
                    aria-label={`Remove ${score.wpm} WPM score`}
                    onClick={() => {
                      setScores(removeScore(score.date));
                      setRemovedScores((current) => [...current, score]);
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p>Finish a round to set your first score.</p>
          )}
        </section>
      )}
      {removedScores.length > 0 && (
        <p className="typing-score-undo" role="status">
          Score removed.{" "}
          <button
            onClick={() => {
              const score = removedScores.at(-1);
              setScores(saveScore(score));
              setRemovedScores((current) => current.slice(0, -1));
            }}
          >
            Undo
          </button>
        </p>
      )}
      <footer className="typing-footer">
        <span>Five correct characters = one WPM word.</span>
        <a href={projectById.typeninja.github} target="_blank" rel="noreferrer">
          The original TypeNinja project ↗
        </a>
      </footer>
    </div>
  );
}
