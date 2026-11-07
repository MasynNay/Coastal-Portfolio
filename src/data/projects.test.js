import { webProjects, projectById } from "./projects";

// The main Coastal site, desktop-style view and island portfolio all read
// this same catalog. Keep real off-site desktop projects discoverable across
// every presentation without inventing a browser-playable demo.
test("Anything Plays is a truthful, fully linked desktop project", () => {
  const entry = projectById["anything-plays"];
  expect(entry).toBeDefined();
  expect(entry.title).toBe("Anything Plays");
  expect(entry.category).toBe("Software");
  expect(entry.website).toBe("https://anythingplays.masynnay.com/");
  expect(entry.github).toBe("https://github.com/MasynNay/anything-plays");
  expect(entry.imgUrl).toBe(
    "https://anythingplays.masynnay.com/assets/anything-plays-original.webp"
  );
  expect(entry.previewKind).toBe("artwork");
  expect(entry.demo).toBeUndefined();
  expect(entry.description).toMatch(/version 3\.0.*QA continues/i);
  expect(webProjects.filter((project) => project.id === entry.id)).toHaveLength(1);
});

test("project catalog uses distinct stable IDs and working project destinations", () => {
  expect(new Set(webProjects.map(({ id }) => id)).size).toBe(
    webProjects.length
  );
  webProjects.forEach(({ github, demo, website }) => {
    expect(github).toMatch(/^https:\/\/github\.com\//);
    expect(Boolean(demo || website)).toBe(true);
  });
});
