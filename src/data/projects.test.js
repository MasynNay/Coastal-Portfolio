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
  expect(entry.imgUrl).toBe("/images/projects/anything-plays-ocarina.webp");
  expect(entry.previewKind).toBe("interface");
  expect(entry.release).toBe(
    "https://github.com/MasynNay/anything-plays/releases/tag/v3.0.0",
  );
  expect(entry.demo).toBeUndefined();
  expect(entry.description).toMatch(/3\.0 release.*18 console profiles/i);
  expect(webProjects.filter((project) => project.id === entry.id)).toHaveLength(
    1,
  );
});

test("project catalog uses distinct stable IDs and working project destinations", () => {
  expect(new Set(webProjects.map(({ id }) => id)).size).toBe(
    webProjects.length,
  );
  webProjects.forEach(({ github, demo, website }) => {
    if (github !== undefined) expect(github).toMatch(/^https:\/\/github\.com\//);
    expect(Boolean(demo || website)).toBe(true);
  });
});

test("Chordlore preview is publicly accessible without exposing the private source repository", () => {
  const entry = projectById.chordlore;
  expect(entry).toBeDefined();
  expect(entry.website).toBe("https://masynnay.com/chordlore/");
  expect(entry.github).toBeUndefined();
  expect(entry.release).toBeUndefined();
  expect(entry.previewKind).toBe("artwork");
  expect(entry.description).toMatch(/browser preview/i);
  expect(webProjects.filter((project) => project.id === entry.id)).toHaveLength(1);
});
