import { act } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Exercise public addresses through the actual router without starting a game
// or fetching art. These stand-ins expose which view the visitor reaches.
jest.mock("./designs/GlassPortfolio", () => ({
  GlassPortfolio: ({ resume }) => (
    <div>{resume ? "Resume view" : "Website view"}</div>
  ),
}));
jest.mock("./designs/DesktopPortfolio", () => ({
  DesktopPortfolio: () => <div>Mac view</div>,
}));
jest.mock("./designs/DesignPortfolio", () => ({
  DesignPortfolio: ({ expressive }) => (
    <div>{expressive ? "Expressive study" : "Polished study"}</div>
  ),
}));
jest.mock("./world/WorldMode", () => () => <div>World view</div>);
jest.mock("./world/SpriteStudio", () => () => <div>Sprite workshop</div>);
jest.mock("./pages/ArcadeGame", () => () => <div>Island game</div>);
jest.mock("./demos/ProjectDemos", () => () => <div>Project demo</div>);
jest.mock("./pages/Game", () => () => <div>Pocket Arcade</div>);

let host, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  window.history.replaceState({}, "", "/");
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
test.each([
  ["/", "Website view"],
  ["/design/glass/", "Website view"],
  ["/resume", "Resume view"],
  ["/design/glass/resume", "Resume view"],
  ["/design/desktop", "Mac view"],
  ["/world/", "World view"],
  ["/world/sprites", "Sprite workshop"],
  ["/world/characters", "Sprite workshop"],
  ["/game", "Pocket Arcade"],
  ["/arcade/element-runner", "Island game"],
  ["/projects/mixstream", "Project demo"],
  ["/design/polished", "Polished study"],
  ["/design/expressive", "Expressive study"],
])("%s opens its intended view", async (url, view) => {
  window.history.replaceState({}, "", url);
  await act(async () => root.render(<App />));
  expect(host.textContent).toBe(view);
});
test.each(["/old-link", "/projects/unmatched/extra"])(
  "unmatched address %s returns home",
  async (url) => {
    window.history.replaceState({}, "", url);
    await act(async () => root.render(<App />));
    expect(window.location.pathname).toBe("/");
    expect(host.textContent).toBe("Website view");
  },
);
