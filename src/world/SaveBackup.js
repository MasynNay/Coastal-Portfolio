import { useState } from "react";
import {
  createIslandBackup,
  parseIslandBackup,
  restoreIslandBackup,
  backupSummary,
  downloadIslandBackup,
} from "./IslandSave";
import "./IslandLife.css";

// Import is staged and previewed first. The visitor can keep a fresh download
// before replacing this device's save; the world reloads only after success.
export default function SaveBackup({
  onBack,
  onRestored = () => window.location.reload(),
}) {
  const [pending, setPending] = useState(null),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const summary = pending && backupSummary(pending);
  function download() {
    try {
      downloadIslandBackup(createIslandBackup());
      setNotice(
        "Backup downloaded. Keep the file somewhere you can find it on your other device.",
      );
    } catch (e) {
      setNotice(e.message);
    }
  }
  async function choose(file) {
    if (!file) return;
    setPending(null);
    setBusy(true);
    try {
      if (file.size > 2 * 1024 * 1024)
        throw Error("Choose an island backup smaller than 2 MB.");
      setPending(parseIslandBackup(await file.text()));
      setNotice("");
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="island-backup">
      <button onClick={onBack}>Inventory</button>
      <h3>Take Your Island With You</h3>
      <p>
        Download a copy of your visits, discoveries, catches, cards, unopened
        packs, display room, and favorites. Import that file on another device
        to continue there.
      </p>
      <p>
        This is a manual backup. Your devices do not sync automatically.
        Emulator game saves are separate.
      </p>
      <div className="island-life-actions">
        <button className="world-primary" onClick={download}>
          Download Current Save
        </button>
        <label className="backup-file">
          Choose Backup File
          <input
            type="file"
            accept=".json,application/json"
            disabled={busy}
            onChange={(e) => {
              choose(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {pending && (
        <section className="backup-preview" aria-label="Backup preview">
          <h3>Review This Backup</h3>
          <dl>
            <div>
              <dt>Homes Visited</dt>
              <dd>{summary.homes}</dd>
            </div>
            <div>
              <dt>Bug Types</dt>
              <dd>{summary.bugs}</dd>
            </div>
            <div>
              <dt>Aquatic Types</dt>
              <dd>{summary.fish}</dd>
            </div>
            <div>
              <dt>Card Variants</dt>
              <dd>{summary.cards}</dd>
            </div>
          </dl>
          <p>
            Restoring replaces the island progress included in this file on this
            device. Download your current save first if you want to keep both.
          </p>
          <div className="island-life-actions">
            <button onClick={() => setPending(null)}>Cancel</button>
            <button onClick={download}>Back Up Current Save</button>
            <button
              className="world-primary"
              onClick={() => {
                try {
                  restoreIslandBackup(pending);
                  setPending(null);
                  setNotice("Save restored. Reopening your island…");
                  onRestored();
                } catch (e) {
                  setNotice(e.message);
                }
              }}
            >
              Restore & Reopen Island
            </button>
          </div>
        </section>
      )}
      <p role="status" aria-live="polite">
        {busy ? "Reading your backup…" : notice}
      </p>
    </div>
  );
}
