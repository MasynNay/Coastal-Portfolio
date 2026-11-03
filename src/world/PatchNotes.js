import patchNotes from "../data/patchNotes";

export default function PatchNotes() {
  return (
    <div className="island-patch-notes">
      {patchNotes.map((patch) => (
        <article key={patch.version}>
          <h3>Island update · {patch.version}</h3>
          <p>{patch.date} · Changes since the previous live patch.</p>
          <ul>
            {patch.changes.map((change) => <li key={change}>{change}</li>)}
          </ul>
          <a
            href={`https://github.com/MasynNay/Coastal-Portfolio/compare/${patch.previousCommit}...v${patch.version}`}
            target="_blank"
            rel="noreferrer"
          >
            View the actual changes ↗
          </a>
        </article>
      ))}
    </div>
  );
}
