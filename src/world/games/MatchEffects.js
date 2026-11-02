import { artwork } from "../art";
import { imageSource } from "../ImageSource";
// Visual feedback is separate from matching rules. Each effect uses the cells
// the simulation actually cleared, so rainbow trails point to real targets.
export default function MatchEffects({ effects, turn }) {
  return (
    <div
      className="match-effects"
      aria-hidden="true"
      style={{
        "--bomb-animation": artwork["rocket-explosion"]
          ? `url(${imageSource(artwork["rocket-explosion"])})`
          : "none",
      }}
    >
      {effects.map((effect, index) => {
        const x = (((effect.index % 8) + 0.5) / 8) * 100,
          y = ((Math.floor(effect.index / 8) + 0.5) / 8) * 100;
        return effect.kind === "bomb" ? (
          <div
            key={`${turn}-${index}`}
            className="rocket-explosion"
            style={{ left: x + "%", top: y + "%" }}
          />
        ) : (
          <svg
            key={`${turn}-${index}`}
            className="rainbow-clear"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`rainbow-${turn}-${index}`}>
                <stop stopColor="#eaaaeb" />
                <stop offset=".5" stopColor="#9eedec" />
                <stop offset="1" stopColor="#f5d27b" />
              </linearGradient>
            </defs>
            {effect.cells.map((cell) => (
              <path
                key={cell}
                d={`M ${x} ${y} Q ${50} ${y} ${(((cell % 8) + 0.5) / 8) * 100} ${((Math.floor(cell / 8) + 0.5) / 8) * 100}`}
                fill="none"
                stroke={`url(#rainbow-${turn}-${index})`}
                strokeWidth="1.4"
                pathLength="1"
              />
            ))}
            <circle
              cx={x}
              cy={y}
              r="8"
              fill="none"
              stroke="#fff4cd"
              strokeWidth=".8"
            />
          </svg>
        );
      })}
    </div>
  );
}
