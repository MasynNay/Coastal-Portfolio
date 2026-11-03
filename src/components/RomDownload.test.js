import { unpackRom, saveRom } from "./RomDownload";
import { createHash, webcrypto } from "crypto";

// Test the pinned decoder's message boundary and real SHA-256 verification.
// Browser QA separately exercises its actual worker with a complete cartridge.
let workers,
  originalWorker,
  originalFetch,
  originalCrypto,
  originalCreate,
  originalRevoke;
class Decoder {
  constructor() {
    workers.push(this);
  }
  postMessage = jest.fn();
  terminate = jest.fn();
  emit(data) {
    this.onmessage({ data });
  }
}
beforeEach(() => {
  jest.useFakeTimers();
  workers = [];
  originalWorker = global.Worker;
  originalFetch = global.fetch;
  originalCrypto = Object.getOwnPropertyDescriptor(window, "crypto");
  originalCreate = URL.createObjectURL;
  originalRevoke = URL.revokeObjectURL;
  global.Worker = Decoder;
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: {
      subtle: {
        digest: (algorithm, bytes) =>
          webcrypto.subtle.digest(algorithm, Buffer.from(bytes)),
      },
    },
  });
  URL.createObjectURL = jest.fn(() => "blob:verified-rom");
  URL.revokeObjectURL = jest.fn();
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  global.Worker = originalWorker;
  global.fetch = originalFetch;
  if (originalCrypto) Object.defineProperty(window, "crypto", originalCrypto);
  else delete window.crypto;
  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
});
test("unpacking accepts only the requested GBA and releases its worker", async () => {
  const controller = new AbortController();
  const result = unpackRom(new ArrayBuffer(4), "chosen.gba", controller.signal);
  workers[0].emit({ t: 2, file: "another.gba", data: [99] });
  workers[0].emit({ t: 2, file: "chosen.gba", data: [1, 2, 3] });
  workers[0].emit({ t: 1 });
  expect([...(await result)]).toEqual([1, 2, 3]);
  expect(workers[0].terminate).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});
test("missing files, cancelled work and a stalled decoder fail cleanly", async () => {
  const first = new AbortController();
  const missing = unpackRom(new ArrayBuffer(1), "chosen.gba", first.signal);
  workers[0].emit({ t: 1 });
  await expect(missing).rejects.toThrow("no matching GBA");
  const second = new AbortController();
  const cancelled = unpackRom(new ArrayBuffer(1), "chosen.gba", second.signal);
  second.abort();
  await expect(cancelled).rejects.toMatchObject({ name: "AbortError" });
  const stalled = unpackRom(
    new ArrayBuffer(1),
    "chosen.gba",
    new AbortController().signal,
  );
  jest.advanceTimersByTime(60000);
  await expect(stalled).rejects.toThrow("could not be unpacked");
  expect(
    workers.every((worker) => worker.terminate.mock.calls.length === 1),
  ).toBe(true);
});
test("only verified original bytes become a .gba download, and failed verification creates none", async () => {
  const bytes = Uint8Array.from([4, 8, 15, 16, 23, 42]);
  const file = {
    url: "/roms/chosen.zip",
    filename: "chosen.gba",
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
  global.fetch = jest.fn(async () => ({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(1),
  }));
  const downloads = [];
  jest
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function () {
      downloads.push({ filename: this.download, url: this.href });
    });
  const result = saveRom(file, new AbortController().signal);
  // Allow fetch and arrayBuffer to reach the worker boundary.
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  workers[0].emit({ t: 2, file: file.filename, data: bytes });
  workers[0].emit({ t: 1 });
  await result;
  expect(downloads).toEqual([
    { filename: "chosen.gba", url: "blob:verified-rom" },
  ]);
  expect(URL.createObjectURL.mock.calls[0][0].size).toBe(bytes.length);
  jest.advanceTimersByTime(1000);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:verified-rom");
  const invalid = saveRom(
    { ...file, sha256: "invalid" },
    new AbortController().signal,
  );
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  workers[1].emit({ t: 2, file: file.filename, data: bytes });
  workers[1].emit({ t: 1 });
  await expect(invalid).rejects.toThrow("verification failed");
  expect(downloads).toHaveLength(1);
});
