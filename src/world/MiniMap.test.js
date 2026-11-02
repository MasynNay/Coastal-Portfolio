import { miniHome, miniPoint, miniBounds } from "./MiniMap";
import { buildings } from "./config";
import { buildingHeight } from "./WorldLayout";
test("minimap markers and artwork share the actual world projection and building baseline", () => {
  for (const b of buildings) {
    const icon = miniHome(b.id);
    expect(icon.left).toBeCloseTo(miniPoint(b).left);
    expect(icon.top).toBeCloseTo(miniPoint({ x: b.x, z: b.z + 3.1 }).top);
    expect(icon.height).toBeCloseTo(
      (buildingHeight(b) / miniBounds.height) * 100,
    );
    expect(icon.left).toBeGreaterThan(0);
    expect(icon.top - icon.height).toBeGreaterThan(0);
  }
  const nearDoor = miniPoint({ x: buildings[0].x, z: buildings[0].z + 4.6 });
  expect(nearDoor.left).toBeCloseTo(miniHome("home").left);
  expect(nearDoor.top).toBeGreaterThan(miniHome("home").top);
  expect(miniPoint({ x: 0, z: 31 }).top).toBeLessThan(100);
  expect(miniHome("absent")).toBe(null);
});
