# Typing Test / TypeNinja

The Mac dock app adapts the random-word typing game from
[MasynNay/TypeNinja](https://github.com/MasynNay/TypeNinja), reviewed at commit
`308f4a1ec783998b4edfcf74e5059f209c84c052`.

It retains the original mascot, slate/sage palette, default 30-second round,
200 random words, per-letter feedback, correction with Backspace and scoreboards.
The original game was a group project by Brandt Cox, Charlie Garvin, Devon E.,
Greg K. and Masyn Nay. Its MIT notice is retained in `docs/licenses/TypeNinja.txt`.

The browser-only adaptation replaces the Express/MySQL login and score routes
with a device-local personal scoreboard. It requires no account or extra server.
The original repository is linked from the app. Original artwork is stored in
`public/typing/TypeNinja.png`.

`Words.js` provides offline word selection. `Score.js` measures matching
characters at five per WPM word; skipped letters affect accuracy. This differs
from the old app's whole-correct-word counter and supports words of varied length.
`TypingTest.js` handles actual elapsed time, first-input start, pausing on blur,
window minimization and page hiding, touch keyboard input, and saved results.

Rounds use 15, 30 or 60 seconds and separate Words/Developer scoreboards.
