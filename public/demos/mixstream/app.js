// The original search/favorite layout now uses public TVmaze and Wikipedia
// search. Streaming links open the service; they never invent availability.
const catalog = [
  {
    id: "matrix",
    title: "The Matrix",
    year: 1999,
    type: "Movie",
    genre: "Science fiction",
    cast: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"],
    rating: "R",
    summary:
      "A computer programmer discovers that reality is not what it seems.",
  },
  {
    id: "avatar",
    title: "Avatar: The Last Airbender",
    year: 2005,
    type: "Series",
    genre: "Animated adventure",
    cast: ["Zach Tyler Eisen", "Mae Whitman", "Jack De Sena"],
    rating: "TV-Y7",
    summary: "A young airbender and his friends set out to restore balance.",
  },
  {
    id: "lotr",
    title: "The Lord of the Rings: The Fellowship of the Ring",
    year: 2001,
    type: "Movie",
    genre: "Fantasy",
    cast: ["Elijah Wood", "Ian McKellen", "Viggo Mortensen"],
    rating: "PG-13",
    summary: "An unlikely fellowship begins a journey across Middle-earth.",
  },
  {
    id: "nemo",
    title: "Finding Nemo",
    year: 2003,
    type: "Movie",
    genre: "Animated adventure",
    cast: ["Albert Brooks", "Ellen DeGeneres", "Alexander Gould"],
    rating: "G",
    summary: "A father crosses the ocean to find his missing son.",
  },
  {
    id: "sonic",
    title: "Sonic the Hedgehog",
    year: 2020,
    type: "Movie",
    genre: "Family adventure",
    cast: ["Ben Schwartz", "James Marsden", "Jim Carrey"],
    rating: "PG",
    summary: "A speedy hedgehog finds a home on Earth.",
  },
  {
    id: "friends",
    title: "Friends",
    year: 1994,
    type: "Series",
    genre: "Comedy",
    cast: ["Jennifer Aniston", "Courteney Cox", "Matthew Perry"],
    rating: "TV-14",
    summary: "Six friends navigate work, life and coffee in New York.",
  },
];
const $ = (selector) => document.querySelector(selector);
function text(tag, value) {
  const node = document.createElement(tag);
  node.textContent = value;
  return node;
}
function plain(value) {
  const doc = new DOMParser().parseFromString(String(value || ""), "text/html");
  return (doc.body.textContent || "").trim();
}
function safeURL(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}
function link(label, url) {
  const node = text("a", label);
  node.href = safeURL(url) || "#";
  node.target = "_blank";
  node.rel = "noreferrer noopener";
  return node;
}
function button(label, fn, className = "listButtons") {
  const node = text("button", label);
  node.type = "button";
  node.className = className;
  node.onclick = fn;
  return node;
}
let favorites = [];
try {
  const saved = JSON.parse(
    localStorage.getItem("mixstream-demo-favorites") || "[]",
  );
  if (Array.isArray(saved))
    favorites = saved
      .map((item) =>
        typeof item === "string" ? catalog.find((s) => s.id === item) : item,
      )
      .filter(
        (item) =>
          item && typeof item.id === "string" && typeof item.title === "string",
      )
      .slice(0, 100);
} catch {}
let current = null,
  searchVersion = 0,
  selectionVersion = 0,
  searchController = null;
const cache = new Map();
function saveFavorites() {
  try {
    localStorage.setItem("mixstream-demo-favorites", JSON.stringify(favorites));
  } catch {
    $("#search-status").textContent =
      "Favorites are available for this visit; browser storage is unavailable.";
  }
}
function renderFavorites() {
  const area = $(".search-history");
  area.replaceChildren(
    ...favorites.map((show) => button(show.title, () => showDetails(show))),
  );
  if (!favorites.length)
    area.append(text("p", "Save a title to find it here next time."));
}
function normalizeTV(row) {
  const s = row.show || row;
  return {
    id: "tv:" + s.id,
    sourceId: s.id,
    title: s.name,
    year: s.premiered?.slice(0, 4) || "",
    type: "Series",
    genre: (s.genres || []).join(" · "),
    summary: plain(s.summary),
    poster: s.image?.medium || "",
    rating: s.rating?.average ? String(s.rating.average) + "/10 · TVmaze" : "",
    cast: [],
    provider: s.webChannel || s.network,
    source: "TVmaze",
    sourceURL: s.url,
    imdb: s.externals?.imdb || "",
    official: s.officialSite || "",
  };
}
function normalizeMovie(page) {
  const summary = plain(page.extract);
  return {
    id: "wiki:" + page.pageid,
    title: page.title.replace(/ \(\d{4} film\)$/, "").replace(/ \(film\)$/, ""),
    year: summary.match(/\b(?:19|20)\d{2}\b/)?.[0] || "",
    type: "Movie",
    genre: "Film",
    summary,
    poster: page.thumbnail?.source || "",
    cast: [],
    source: "Wikipedia",
    sourceURL: page.fullurl || "https://en.wikipedia.org/?curid=" + page.pageid,
  };
}
async function requestJSON(url, signal) {
  const controller = new AbortController(),
    abort = () => controller.abort(),
    timer = setTimeout(abort, 9000);
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw Error("Search service unavailable");
    return await response.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
function whereToWatch(show) {
  const area = $("#naptime"),
    region = $("#search-region").value;
  area.replaceChildren();
  const availability = link(
    "Check streaming, rental & purchase options ↗",
    "https://www.justwatch.com/" +
      region +
      "/search?q=" +
      encodeURIComponent(show.title),
  );
  availability.className = "watch-link";
  area.append(
    availability,
    text(
      "p",
      "Availability changes by country and subscription. Open the guide to check this title in your selected region.",
    ),
  );
  if (show.provider?.name) {
    const section = text(
      "p",
      "Network / original service: " + show.provider.name,
    );
    area.append(section);
    if (safeURL(show.provider.officialSite))
      area.append(
        link("Visit " + show.provider.name + " ↗", show.provider.officialSite),
      );
  }
  if (safeURL(show.official))
    area.append(link("Official title website ↗", show.official));
  if (show.imdb && /^tt\d+$/.test(show.imdb))
    area.append(
      link("View on IMDb ↗", "https://www.imdb.com/title/" + show.imdb + "/"),
    );
}
function showDetails(show) {
  current = show;
  const selected = ++selectionVersion;
  const heading = $(".favorites");
  heading.replaceChildren(text("h3", show.title));
  const favorite = button(
    favorites.some((f) => f.id === show.id) ? "★ Saved · Remove" : "☆ Favorite",
    () => {
      favorites = favorites.some((f) => f.id === show.id)
        ? favorites.filter((f) => f.id !== show.id)
        : [...favorites, { ...show }];
      saveFavorites();
      renderFavorites();
      showDetails(show);
    },
    "button-like",
  );
  heading.append(favorite);
  whereToWatch(show);
  const box = $("#imdb-poster");
  box.replaceChildren();
  if (safeURL(show.poster)) {
    const image = document.createElement("img");
    image.src = safeURL(show.poster);
    image.alt = show.title + " poster";
    image.className = "title-poster";
    image.loading = "lazy";
    image.onerror = () => image.remove();
    box.append(image);
  } else {
    const poster = text("div", show.title);
    poster.className = "sample-poster";
    box.append(poster);
  }
  box.append(
    text("p", show.summary || "No synopsis is available for this title."),
  );
  if (show.sourceURL)
    box.append(link("Details: " + show.source + " ↗", show.sourceURL));
  $("#imdb-ratings").textContent = [
    show.year,
    show.type,
    show.genre,
    show.rating,
  ]
    .filter(Boolean)
    .join(" · ");
  const cast = $("#imdb-cast");
  cast.replaceChildren(
    text(
      "li",
      show.cast?.length
        ? "Cast: " + show.cast.join(", ")
        : show.source === "TVmaze"
          ? "Loading cast…"
          : "Cast information is available through the title source.",
    ),
  );
  if (show.source === "TVmaze" && !show.cast?.length)
    requestJSON("https://api.tvmaze.com/shows/" + show.sourceId + "/cast")
      .then((rows) => {
        if (selected !== selectionVersion) return;
        show.cast = rows
          .slice(0, 8)
          .map((row) => row.person?.name)
          .filter(Boolean);
        cast.replaceChildren(
          text(
            "li",
            show.cast.length
              ? "Cast: " + show.cast.join(", ")
              : "No cast information available.",
          ),
        );
      })
      .catch(() => {
        if (selected === selectionVersion)
          cast.replaceChildren(
            text(
              "li",
              "Cast could not load. The title details are still available.",
            ),
          );
      });
}
function renderResults(results) {
  const root = $("#search-results");
  root.replaceChildren(
    ...results.map((show) => {
      const item = button("", () => showDetails(show), "search-result");
      const title = text("strong", show.title),
        detail = text(
          "small",
          [show.type, show.year].filter(Boolean).join(" · "),
        );
      item.append(title, detail);
      return item;
    }),
  );
}
async function searchOption() {
  const query = $("#textInput").value.trim(),
    kind = $("#search-kind").value;
  searchController?.abort();
  const version = ++searchVersion;
  ++selectionVersion;
  searchController = new AbortController();
  if (!query) {
    $("#search-status").textContent =
      "Choose a sample below or enter a movie or show title.";
    renderResults(catalog);
    return;
  }
  $("#search-status").textContent = "Searching movies and shows…";
  $("#search-results").setAttribute("aria-busy", "true");
  const cacheKey = kind + ":" + query.toLowerCase();
  let results = cache.get(cacheKey),
    failures = 0;
  if (!results) {
    const jobs = [];
    if (kind !== "movies")
      jobs.push(
        requestJSON(
          "https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(query),
          searchController.signal,
        ).then((rows) => rows.map(normalizeTV)),
      );
    if (kind !== "shows")
      jobs.push(
        requestJSON(
          "https://en.wikipedia.org/w/api.php?" +
            new URLSearchParams({
              action: "query",
              format: "json",
              origin: "*",
              generator: "search",
              gsrsearch: query + " film",
              gsrlimit: "12",
              prop: "extracts|pageimages|info",
              exintro: "1",
              explaintext: "1",
              pithumbsize: "300",
              inprop: "url",
            }),
          searchController.signal,
        ).then((data) =>
          Object.values(data.query?.pages || {})
            .filter(
              (page) =>
                /\bfilm\b/i.test(page.extract || "") &&
                !/\bfranchise\b/i.test(page.title),
            )
            .sort((a, b) => (a.index || 0) - (b.index || 0))
            .map(normalizeMovie),
        ),
      );
    const settled = await Promise.allSettled(jobs);
    if (version !== searchVersion) return;
    failures = settled.filter((r) => r.status === "rejected").length;
    results = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    const seen = new Set();
    results = results
      .filter((item) => {
        const id = item.type + ":" + item.title.toLowerCase() + ":" + item.year;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .slice(0, 24);
    if (!failures && results.length) {
      if (cache.size >= 20) cache.delete(cache.keys().next().value);
      cache.set(cacheKey, results);
    }
  }
  if (version !== searchVersion) return;
  if (!results.length && failures) {
    results = catalog.filter(
      (s) =>
        s.title.toLowerCase().includes(query.toLowerCase()) &&
        (kind === "all" || (kind === "movies") === (s.type === "Movie")),
    );
    $("#search-status").textContent = results.length
      ? "Live search could not connect. Showing matching sample titles."
      : "Search services could not connect. Try again, or use the streaming guide below.";
  } else
    $("#search-status").textContent = results.length
      ? results.length +
        " titles found." +
        (failures
          ? " One search service is unavailable; results may be incomplete."
          : "")
      : "No titles found. Try a shorter title or change Movies / TV shows.";
  $("#search-results").removeAttribute("aria-busy");
  renderResults(results);
  if (results.length) {
    const exact = results.find(
      (s) => s.title.toLowerCase() === query.toLowerCase(),
    );
    showDetails(exact || results[0]);
  } else {
    $(".favorites").replaceChildren(text("h3", "No titles found"));
    $("#imdb-poster").replaceChildren(
      text("p", "Try a different spelling or check the streaming guide."),
    );
    $("#imdb-cast").replaceChildren();
    $("#imdb-ratings").textContent = "";
    whereToWatch({ title: query });
  }
}
$("#search-button").onclick = () => searchOption();
$("#textInput").onkeydown = (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchOption();
  }
};
$("#search-kind").onchange = () => {
  if ($("#textInput").value.trim()) searchOption();
};
$("#search-region").onchange = () => {
  if (current) whereToWatch(current);
};
window.addEventListener("pagehide", () => searchController?.abort());
renderFavorites();
renderResults(catalog);
showDetails(catalog[0]);
