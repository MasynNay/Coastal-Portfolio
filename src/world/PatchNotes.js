// The Windfall mailbox renders real release entries and links each patch to
// its source comparison. Publication records belong in data/patchNotes.js.
import { links } from "../data/links";
import patchNotes from "../data/patchNotes";

export default function PatchNotes() {
  return (
    <div className="island-patch-notes">
      {patchNotes.map((patch) => (
        <article key={patch.version}>
          <h3>Island update · {patch.version}</h3>
          <p>{patch.date} · Changes since the previous live patch.</p>
          <ul>
            {patch.changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
          <a
            href={`${links.repository}/compare/${patch.previousCommit}...v${patch.version}`}
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
