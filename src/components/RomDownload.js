import { useEffect, useRef, useState } from "react";
import "./RomDownload.css";

// Reuse the bundled ZIP decoder in a disposable worker. Large cartridges never
// decompress on the UI thread, and closing/changing a player cancels its work.
export function unpackRom(buffer, filename, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted)
      return reject(new DOMException("Cancelled", "AbortError"));
    const worker = new Worker("/emulator/4.2.3/compression/extractzip.js");
    let rom = null;
    const finish = (error) => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", cancel);
      worker.terminate();
      if (error) reject(error);
      else resolve(rom);
    };
    const cancel = () => finish(new DOMException("Cancelled", "AbortError"));
    const timeout = setTimeout(
      () => finish(new Error("The cartridge could not be unpacked.")),
      60000,
    );
    signal.addEventListener("abort", cancel, { once: true });
    worker.onerror = () =>
      finish(new Error("The cartridge could not be unpacked."));
    worker.onmessage = ({ data }) => {
      // This pinned decoder emits file messages (2), then completion (1).
      // Accept only the catalog's exact GBA filename, never an archive path.
      if (data?.t === 2 && data.file === filename)
        rom = new Uint8Array(data.data);
      if (data?.t === 1)
        finish(
          rom ? null : new Error("This archive has no matching GBA file."),
        );
    };
    try {
      worker.postMessage(new Uint8Array(buffer), [buffer]);
    } catch {
      finish(new Error("The cartridge could not be unpacked."));
    }
  });
}

export async function saveRom(file, signal) {
  const response = await fetch(file.url, { signal });
  if (!response.ok) throw new Error("The ROM could not be downloaded.");
  const bytes = await unpackRom(
    await response.arrayBuffer(),
    file.filename,
    signal,
  );
  const hash = await window.crypto.subtle.digest("SHA-256", bytes);
  const checksum = [...new Uint8Array(hash)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  if (checksum !== file.sha256)
    throw new Error("The ROM verification failed. Please try again.");
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
  // The site hosts compressed archives to fit its asset limits. Visitors get
  // the original verified .gba bytes, with no recompression or ROM modification.
  const url = URL.createObjectURL(
    new Blob([bytes], { type: "application/octet-stream" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = file.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Let the browser adopt the download before releasing the temporary blob.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function RomDownload({ file }) {
  const active = useRef(null);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    setBusy(false);
    setMessage("");
    return () => active.current?.abort();
  }, [file?.url]);
  if (!file) return null;
  async function download() {
    if (busy) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setMessage("");
    try {
      await saveRom(file, controller.signal);
      if (!controller.signal.aborted) setMessage("Download started.");
    } catch (error) {
      if (!controller.signal.aborted)
        setMessage(error.message || "Download failed. Please try again.");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return (
    <div className="rom-download">
      <button
        type="button"
        className="rom-download-button"
        disabled={busy}
        onClick={download}
      >
        {busy ? "Preparing ROM…" : "Download ROM (.gba)"}
      </button>
      <span className="rom-download-status" role="status">
        {message}
      </span>
    </div>
  );
}
