import fs from "fs";
import path from "path";
import vm from "vm";
// Exercise the actual browser-demo scripts against their shipped HTML. These
// tests use fixture storage; they never touch the visitor's browser data.
function openDemo(name) {
  document.body.innerHTML = fs.readFileSync(
    path.join(process.cwd(), "public/demos", name, "index.html"),
    "utf8",
  );
  const source = fs.readFileSync(
    path.join(process.cwd(), "public/demos", name, "app.js"),
    "utf8",
  );
  return new vm.Script(
    `(function () { ${source}; return typeof searchOption === 'function' ? {searchOption} : {}; })()`,
    { filename: `${name}/app.js` },
  ).runInNewContext({
    document,
    localStorage,
    window,
    console,
    URL,
    URLSearchParams,
    DOMParser,
    AbortController,
    Blob,
    setTimeout,
    clearTimeout,
    fetch: (...args) => global.fetch(...args),
  });
}
beforeEach(() => localStorage.clear());
test("MixStream searches real movie results, saves favorites and updates region links", async () => {
  const old = global.fetch;
  global.fetch = jest.fn(async (url) => ({
    ok: true,
    json: async () =>
      String(url).includes("tvmaze")
        ? []
        : {
            query: {
              pages: {
                42: {
                  pageid: 42,
                  title: "The Matrix",
                  extract: "The Matrix is a 1999 science fiction film.",
                  fullurl: "https://en.wikipedia.org/wiki/The_Matrix",
                  index: 1,
                },
              },
            },
          },
  }));
  try {
    const app = openDemo("mixstream"),
      input = document.querySelector("#textInput");
    input.value = "The Matrix";
    await app.searchOption();
    expect(document.querySelector(".favorites h3").textContent).toBe(
      "The Matrix",
    );
    expect(document.querySelector("#imdb-poster").textContent).toContain(
      "1999 science fiction",
    );
    document.querySelector(".button-like").click();
    expect(
      JSON.parse(localStorage.getItem("mixstream-demo-favorites"))[0].id,
    ).toBe("wiki:42");
    expect(document.querySelector(".search-history button").textContent).toBe(
      "The Matrix",
    );
    const region = document.querySelector("#search-region");
    region.value = "gb";
    region.dispatchEvent(new Event("change"));
    expect(document.querySelector(".watch-link").href).toContain(
      "/gb/search?q=The%20Matrix",
    );
    document.querySelector(".button-like").click();
    expect(
      JSON.parse(localStorage.getItem("mixstream-demo-favorites")),
    ).toEqual([]);
  } finally {
    global.fetch = old;
  }
});
test("MixStream searches beyond the samples and safely renders TV details and cast", async () => {
  const old = global.fetch;
  global.fetch = jest.fn(async (url) => ({
    ok: true,
    json: async () =>
      String(url).endsWith("/cast")
        ? [{ person: { name: "Demo Actor" } }]
        : String(url).includes("tvmaze")
          ? [
              {
                show: {
                  id: 99,
                  name: "A new show",
                  premiered: "2025-01-01",
                  genres: ["Drama"],
                  summary: "<p>A new story.</p>",
                  url: "https://www.tvmaze.com/shows/99/a-new-show",
                  webChannel: {
                    name: "Example Network",
                    officialSite: "https://example.com",
                  },
                  externals: { imdb: "tt123" },
                },
              },
            ]
          : { query: { pages: {} } },
  }));
  try {
    const app = openDemo("mixstream");
    document.querySelector("#textInput").value = "A new show";
    await app.searchOption();
    await Promise.resolve();
    await Promise.resolve();
    expect(document.querySelector(".favorites h3").textContent).toBe(
      "A new show",
    );
    expect(document.querySelector("#imdb-poster").textContent).toContain(
      "A new story.",
    );
    expect(document.querySelector("#naptime").textContent).toContain(
      "Example Network",
    );
  } finally {
    global.fetch = old;
  }
});
test("MixStream ignores stale search responses and reports offline searches", async () => {
  const old = global.fetch;
  let resolveOld;
  global.fetch = jest.fn((url) =>
    String(url).includes("old")
      ? new Promise((resolve) => {
          resolveOld = resolve;
        })
      : Promise.resolve({ ok: true, json: async () => [] }),
  );
  try {
    const app = openDemo("mixstream");
    document.querySelector("#search-kind").value = "shows";
    document.querySelector("#textInput").value = "old";
    const pending = app.searchOption();
    document.querySelector("#textInput").value = "new";
    await app.searchOption();
    resolveOld({
      ok: true,
      json: async () => [{ show: { id: 1, name: "Old result", genres: [] } }],
    });
    await pending;
    expect(document.querySelector(".favorites").textContent).not.toContain(
      "Old result",
    );
    global.fetch = jest.fn(async () => {
      throw Error("Offline");
    });
    document.querySelector("#textInput").value = "The Matrix";
    await app.searchOption();
    expect(document.querySelector("#search-status").textContent).toContain(
      "could not connect",
    );
  } finally {
    global.fetch = old;
  }
});
test("SemiSnitch coaching changes persist and report deletion can be undone", () => {
  openDemo("semisnitch");
  document.querySelector(".report-card .open").click();
  const select = document.querySelector("select");
  select.value = "coached";
  select.dispatchEvent(new Event("change"));
  expect(
    JSON.parse(localStorage.getItem("semisnitch-demo-reports-v1"))[0]
      .idleEvents[0].coaching,
  ).toBe("coached");
  document.querySelector(".back").click();
  document.querySelector(".report-card button:last-child").click();
  expect(
    JSON.parse(localStorage.getItem("semisnitch-demo-reports-v1")),
  ).toEqual([]);
  document.querySelector("#reports .back").click();
  expect(
    JSON.parse(localStorage.getItem("semisnitch-demo-reports-v1")),
  ).toHaveLength(1);
});
test("SemiSnitch imports valid local JSON as text, and rejects invalid events", async () => {
  openDemo("semisnitch");
  const input = document.querySelector("#upload");
  const malicious = "<img src=x onerror=alert(1)>";
  Object.defineProperty(input, "files", {
    configurable: true,
    value: [
      {
        name: "local.json",
        size: 200,
        text: async () =>
          JSON.stringify([{ driverName: malicious, idleMinutes: 12 }]),
      },
    ],
  });
  await input.onchange({ target: input });
  document.querySelector(".report-card .open").click();
  expect(document.querySelector("tbody").textContent).toContain(malicious);
  expect(document.querySelector("tbody img")).toBeNull();
  Object.defineProperty(input, "files", {
    configurable: true,
    value: [
      {
        name: "bad.json",
        size: 100,
        text: async () =>
          JSON.stringify([{ driverName: "A", idleMinutes: -5 }]),
      },
    ],
  });
  await input.onchange({ target: input });
  expect(document.querySelector("#message").textContent).toContain(
    "nonnegative",
  );
});
