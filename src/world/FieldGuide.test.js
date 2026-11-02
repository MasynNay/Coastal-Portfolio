import { createRoot } from "react-dom/client";
import { act } from "react";
import FieldGuide from "./FieldGuide";
import { bugSpecies, saveTerrariums } from "./Bugs";
import { fishSpecies, saveAquariums } from "./Fish";

beforeEach(() => localStorage.clear());

beforeAll(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
});

test("released species stay revealed, including collections saved before discovery history existed", () => {
  localStorage.setItem("world-spiders", JSON.stringify([bugSpecies[0].id]));
  localStorage.setItem(
    "world-aquariums",
    JSON.stringify({ [fishSpecies[0].id]: 2 }),
  );
  saveTerrariums({});
  saveAquariums({});
  const host = document.createElement("div"),
    root = createRoot(host);
  act(() => root.render(<FieldGuide bugs={{}} fish={{}} />));
  expect(
    host.querySelectorAll('.species-card[data-discovered="true"]'),
  ).toHaveLength(1);
  expect(host.textContent).toContain("Discovered · released");
  expect(host.querySelector("nav progress").value).toBe(1);
  const tabs = host.querySelectorAll("nav button");
  act(() => tabs[1].click());
  expect(
    host.querySelectorAll('.species-card[data-discovered="true"]'),
  ).toHaveLength(1);
  expect(host.textContent).toContain("Discovered · released");
  expect(host.querySelectorAll("nav progress")[1].value).toBe(1);
  expect(JSON.parse(localStorage.getItem("world-aquariums"))).toEqual({});
  expect(JSON.parse(localStorage.getItem("world-spiders"))).toEqual({});
  act(() => root.unmount());
});
afterAll(() => {
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

jest.mock("./SpritePose", () => () => null);

test("one book switches collections and counts duplicate catches as one discovered species", () => {
  const host = document.createElement("div"),
    root = createRoot(host);
  act(() =>
    root.render(
      <FieldGuide
        bugs={{ [bugSpecies[0].id]: 5 }}
        fish={{ [fishSpecies[0].id]: 3 }}
      />,
    ),
  );
  const tabs = host.querySelectorAll("nav button"),
    progress = host.querySelectorAll("nav progress");
  expect(progress[0].value).toBe(1);
  expect(progress[0].max).toBe(bugSpecies.length);
  expect(progress[1].value).toBe(1);
  expect(progress[1].max).toBe(fishSpecies.length);
  expect(tabs[0].getAttribute("aria-pressed")).toBe("true");
  expect(host.querySelectorAll(".species-card").length).toBe(40);
  expect(
    host.querySelectorAll('.species-card[data-discovered="true"]'),
  ).toHaveLength(1);
  expect(host.querySelectorAll(".species-lock")).toHaveLength(39);
  const nextPage = host.querySelector(".collection-pages button:last-child");
  act(() => nextPage.click());
  expect(host.querySelectorAll(".species-card")).toHaveLength(40);
  expect(host.querySelector(".collection-pages").textContent).toContain(
    "41–80",
  );
  expect(
    host.querySelectorAll('.species-card[data-discovered="true"]'),
  ).toHaveLength(0);
  act(() => tabs[1].click());
  expect(tabs[1].getAttribute("aria-pressed")).toBe("true");
  expect(host.querySelectorAll(".species-card").length).toBe(40);
  expect(
    host.querySelectorAll('.species-card[data-discovered="true"]'),
  ).toHaveLength(1);
  expect(host.querySelectorAll(".species-lock")).toHaveLength(39);
  // Catching a previously unknown species reveals its original colored portrait.
  act(() =>
    root.render(
      <FieldGuide
        bugs={{}}
        fish={{
          [fishSpecies[0].id]: 3,
          [fishSpecies[1].id]: 1,
        }}
      />,
    ),
  );
  expect(
    host.querySelectorAll('.species-card[data-discovered="true"]'),
  ).toHaveLength(2);
  expect(host.querySelectorAll(".species-lock")).toHaveLength(38);
  act(() => root.unmount());
});

test("seashells share the guide, keep quantities and show locked portraits until discovered", () => {
  const host = document.createElement("div"),
    root = createRoot(host);
  act(() =>
    root.render(
      <FieldGuide
        bugs={{}}
        fish={{}}
        shells={{ "shell-1": 3 }}
        initialSection="shells"
      />,
    ),
  );
  const tabs = host.querySelectorAll(".field-guide-sections button");
  expect(tabs).toHaveLength(3);
  expect(tabs[2].getAttribute("aria-pressed")).toBe("true");
  expect(tabs[2].textContent).toContain("1 / 50 discovered");
  expect(host.querySelectorAll(".species-lock")).toHaveLength(39);
  expect(host.textContent).toContain("In your collection · 3");
  expect(host.textContent).toContain("Total shells");
  act(() => root.unmount());
});
