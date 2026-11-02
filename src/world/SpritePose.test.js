import { act } from "react";
import { createRoot } from "react-dom/client";
import SpritePose from "./SpritePose";

test("the adventurer preview shares a frame and position between solid and smooth layers", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div"),
    root = createRoot(host);
  try {
    for (const asset of ["link", "link-run", "ability-ocarina"])
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
        const [base, detail] = preview.children;
        expect(preview.children).toHaveLength(2);
        expect(base.style.imageRendering).toBe("pixelated");
        expect(detail.style.imageRendering).toBe("auto");
        for (const property of [
          "backgroundImage",
          "backgroundPosition",
          "backgroundSize",
        ])
          expect(base.style[property]).toBe(detail.style[property]);
      }
  } finally {
    act(() => root.unmount());
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
