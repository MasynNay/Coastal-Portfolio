// Adapted from the original Header, Reports, Report and IdleTableRow views.
// Browser storage replaces Apollo/MongoDB services only in this local demo.
const key = "semisnitch-demo-reports-v1";
const events = [
  {
    startTime: "2026-01-12 08:00",
    endTime: "2026-01-12 09:15",
    driverName: "Demo Driver A",
    vehicle: "DEMO-101",
    idleMinutes: 75,
    city: "Example City",
    state: "UT",
    lat: 40.7,
    long: -111.9,
    minTemp: 25,
    maxTemp: 38,
    coaching: "needsCoaching",
  },
  {
    startTime: "2026-01-12 10:00",
    endTime: "2026-01-12 10:20",
    driverName: "Demo Driver B",
    vehicle: "DEMO-102",
    idleMinutes: 20,
    city: "Sample Town",
    state: "UT",
    lat: 41.2,
    long: -111.9,
    minTemp: 24,
    maxTemp: 37,
    coaching: "doesNotNeed",
  },
];
const fields = [
  "startTime",
  "endTime",
  "driverName",
  "vehicle",
  "idleMinutes",
  "city",
  "state",
  "lat",
  "long",
  "minTemp",
  "maxTemp",
];
const statuses = [
  ["", "Select coaching status"],
  ["doesNotNeed", "Does not need coaching"],
  ["needsCoaching", "Needs coaching"],
  ["coached", "Coached"],
];
let reports = [
    {
      id: "sample",
      name: "Sample fleet · January",
      createdAt: 1768212000000,
      idleEvents: events,
    },
  ],
  removed = null;
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (
    Array.isArray(saved) &&
    saved.every(
      (r) => r && typeof r.id === "string" && Array.isArray(r.idleEvents),
    )
  )
    reports = saved;
} catch {}
const $ = (s) => document.querySelector(s),
  el = (tag, value, cls) => {
    const n = document.createElement(tag);
    if (value != null) n.textContent = value;
    if (cls) n.className = cls;
    return n;
  };
function save() {
  try {
    localStorage.setItem(key, JSON.stringify(reports));
  } catch {
    $("#message").textContent =
      "Browser storage is unavailable; changes will last for this visit.";
  }
}
function button(label, fn, cls) {
  const b = el("button", label, cls);
  b.onclick = fn;
  return b;
}
function list() {
  const root = $("#reports");
  root.replaceChildren();
  reports.forEach((r) => {
    const card = el(
      "article",
      null,
      "report-card bg-gray-500 rounded text-white flex items-center justify-between",
    );
    card.append(
      button(
        r.name + " · " + r.idleEvents.length + " events",
        () => open(r),
        "open",
      ),
      button(
        "Delete",
        () => {
          removed = { report: r, index: reports.indexOf(r) };
          reports = reports.filter((item) => item.id !== r.id);
          save();
          list();
        },
        "bg-red-500 text-white py-1 px-2 rounded hover:bg-red-700",
      ),
    );
    root.append(card);
  });
  if (!reports.length)
    root.append(
      el("p", "No reports yet. Import the sample JSON to try it out."),
    );
  if (removed)
    root.append(
      button(
        "Undo delete",
        () => {
          reports.splice(removed.index, 0, removed.report);
          removed = null;
          save();
          list();
        },
        "back",
      ),
    );
}
function open(report) {
  const root = $("#reports");
  root.replaceChildren(
    button("← Saved Reports", list, "back"),
    el("h2", report.name, "report-title"),
  );
  const total = report.idleEvents.reduce(
    (sum, e) => sum + (Number(e.idleMinutes) || 0),
    0,
  );
  root.append(
    el(
      "p",
      report.idleEvents.length +
        " idle events · " +
        total +
        " total idle minutes · " +
        report.idleEvents.filter((e) => e.coaching === "needsCoaching").length +
        " need coaching",
      "summary",
    ),
  );
  const wrap = el("div", null, "table-scroll");
  wrap.tabIndex = 0;
  wrap.setAttribute("aria-label", "Report table, scroll horizontally");
  const table = el("table"),
    thead = el("thead"),
    tr = el("tr");
  [
    "Start Time",
    "End Time",
    "Driver Name",
    "Vehicle",
    "Idle Time",
    "City",
    "State",
    "Latitude",
    "Longitude",
    "Low Temp",
    "High Temp",
    "Coaching?",
  ].forEach((t) => {
    const th = el(
      "th",
      t,
      "p-2 bg-slate-300 border border-slate-600 text-left",
    );
    th.scope = "col";
    tr.append(th);
  });
  thead.append(tr);
  table.append(thead);
  const body = el("tbody");
  report.idleEvents.forEach((e, i) => {
    const row = el("tr");
    fields.forEach((f) => {
      let value = e[f] ?? "—";
      if (f === "idleMinutes")
        value =
          Math.floor(value / 60) +
          " hours " +
          Math.floor(value % 60) +
          " minutes";
      row.append(el("td", value, "border border-slate-600 bg-slate-100 p-2"));
    });
    const cell = el("td", null, "border border-slate-600 bg-slate-100 p-2"),
      select = el("select");
    select.setAttribute(
      "aria-label",
      "Coaching status for " + e.driverName + " event " + (i + 1),
    );
    statuses.forEach(([value, label]) => {
      const o = el("option", label);
      o.value = value;
      select.append(o);
    });
    select.value = e.coaching || "";
    select.onchange = () => {
      e.coaching = select.value;
      save();
      open(report);
    };
    cell.append(select);
    row.append(cell);
    body.append(row);
  });
  table.append(body);
  wrap.append(table);
  root.append(wrap);
}
function normalize(data) {
  if (!Array.isArray(data) || !data.length || data.length > 1000)
    throw Error("Choose a JSON array with 1–1,000 idle events.");
  return data.map((e) => {
    if (
      !e ||
      typeof e !== "object" ||
      !e.driverName ||
      !Number.isFinite(Number(e.idleMinutes)) ||
      Number(e.idleMinutes) < 0
    )
      throw Error("Each event needs a driverName and nonnegative idleMinutes.");
    const result = {};
    fields.forEach((f) => {
      if (["idleMinutes", "lat", "long", "minTemp", "maxTemp"].includes(f)) {
        const value = e[f] == null ? null : Number(e[f]);
        result[f] = value == null || Number.isFinite(value) ? value : null;
      } else result[f] = String(e[f] ?? "").slice(0, 150);
    });
    result.coaching = statuses.some(([s]) => s === e.coaching)
      ? e.coaching
      : "";
    return result;
  });
}
$("#upload").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    if (file.size > 2000000)
      throw Error("Please choose a JSON file under 2 MB.");
    const idleEvents = normalize(JSON.parse(await file.text()));
    reports.unshift({
      id: "import-" + Date.now(),
      name: file.name.slice(0, 100),
      createdAt: Date.now(),
      idleEvents,
    });
    save();
    list();
    $("#message").textContent =
      "Imported " +
      idleEvents.length +
      " events. Nothing was uploaded to a server.";
  } catch (error) {
    $("#message").textContent = error.message;
  }
  e.target.value = "";
};
$("#sample").onclick = () => {
  const url = URL.createObjectURL(
      new Blob([JSON.stringify(events, null, 2)], { type: "application/json" }),
    ),
    a = el("a");
  a.href = url;
  a.download = "semisnitch-sample.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
document.querySelector("header a").onclick = (e) => {
  e.preventDefault();
  list();
};
list();
