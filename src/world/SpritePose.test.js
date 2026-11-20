import { act } from "react";
import { createRoot } from "react-dom/client";
import SpritePose from "./SpritePose";

test("family and costume previews use one crisp frame in every direction", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div"),
    root = createRoot(host);
  try {
    for (const asset of [
      "masyn",
      "mi-shell",
      "ezra",
      "fallyn",
      "fitzgerald",
      "link",
      "link-run",
      "ability-ocarina",
    ])
      for (let direction = 0; direction < 8; direction++) {
        act(() =>
          root.render(
            <SpritePose
              asset={asset}
              direction={direction}
              playing={false}
              label="Hyrulian Adventurer"
            />,
          ),
        );
        const preview = host.querySelector('[role="img"]');
        expect(preview.getAttribute("aria-label")).toBe("Hyrulian Adventurer");
        expect(preview.children).toHaveLength(0);
        expect(preview.style.imageRendering).toBe("pixelated");
        expect(preview.style.backgroundImage).toContain("url(");
        expect(preview.style.backgroundSize).not.toBe("");
      }
  } finally {
    act(() => root.unmount());
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
