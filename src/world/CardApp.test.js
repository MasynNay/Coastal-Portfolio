import { act } from "react";
import { createRoot } from "react-dom/client";
import CardPacks, { CardCollection } from "./CardPacks";
import {
  collectPack,
  ripOwnedPack,
  readCardCollection,
} from "./CardCollection";
import { useCardSwipe } from "./CardApp";
let host, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
const button = (name) =>
  [...host.querySelectorAll("button")].find((b) =>
    b.textContent.includes(name),
  );
test("shop presents a single collection and sends collected packs to the bag", () => {
  const navigate = jest.fn();
  act(() => root.render(<CardPacks onInventory={navigate} />));
  expect(host.querySelectorAll(".booster-art")).toHaveLength(1);
  act(() => button("Collect Pack").click());
  expect(readCardCollection().packs.kanto).toBe(1);
  act(() => host.querySelector(".card-app-nav button:last-child").click());
  expect(navigate).toHaveBeenCalledWith("album");
  act(() => host.querySelector('[aria-label="Next collection"]').click());
  expect(host.querySelector(".card-shop-details h3").textContent).toBe(
    "Evolving Skies",
  );
});
test("navigation preserves an unfinished pack and Resume continues the same saved card", () => {
  collectPack("kanto");
  ripOwnedPack("kanto", () => 0.3);
  const original = readCardCollection().pending.cards.map((c) => c.id);
  act(() =>
    root.render(<CardCollection onBack={() => {}} onShop={() => {}} />),
  );
  act(() => host.querySelector(".card-app-nav button:last-child").click());
  expect(host.querySelector(".card-album")).not.toBeNull();
  act(() => host.querySelector(".card-app-nav button:nth-child(2)").click());
  expect(button("Resume Open Pack")).toBeDefined();
  act(() => button("Resume Open Pack").click());
  act(() => button("Reveal Card").click());
  expect(readCardCollection().pending.flipped).toBe(true);
  expect(readCardCollection().pending.cards.map((c) => c.id)).toEqual(original);
  expect(
    Object.values(readCardCollection().cards).reduce(
      (n, c) => n + c.quantity,
      0,
    ),
  ).toBe(5);
});
test("horizontal swipes advance once, vertical drags and taps do not", () => {
  const swipe = jest.fn(),
    click = jest.fn();
  function Surface() {
    const handlers = useCardSwipe(swipe);
    return (
      <button {...handlers} onClick={click}>
        Card
      </button>
    );
  }
  act(() => root.render(<Surface />));
  const node = host.querySelector("button");
  function pointer(type, x, y) {
    const e = new Event(type, { bubbles: true });
    Object.assign(e, { button: 0, clientX: x, clientY: y });
    node.dispatchEvent(e);
  }
  act(() => {
    pointer("pointerdown", 200, 100);
    pointer("pointerup", 100, 105);
    node.click();
  });
  expect(swipe).toHaveBeenCalledWith(1);
  expect(click).not.toHaveBeenCalled();
  act(() => {
    pointer("pointerdown", 200, 100);
    pointer("pointerup", 190, 200);
  });
  expect(swipe).toHaveBeenCalledTimes(1);
  act(() => {
    pointer("pointerdown", 200, 100);
    pointer("pointerup", 200, 100);
    node.click();
  });
  expect(click).toHaveBeenCalledTimes(1);
});
