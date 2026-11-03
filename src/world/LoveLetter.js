import { loveLetter } from "../data/loveLetter";
import "./LoveLetter.css";
// The world dialog owns dismissal/focus. This view only presents the unlocked
// letter, keeping its copy separate from collision and animation rules.
export default function LoveLetter() {
  return (
    <article className="love-letter">
      <span className="love-letter-heart" aria-hidden="true">
        ♥
      </span>
      <p className="love-letter-greeting">{loveLetter.greeting}</p>
      {loveLetter.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <footer>{loveLetter.signature}</footer>
    </article>
  );
}
