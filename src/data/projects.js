// Titles, descriptions and destinations stay identical in website cards, Mac
// windows and game rooms. Each presentation chooses its own card layout.
export const webProjects = [
  {
    id: "anything-plays",
    imgUrl:
      "https://anythingplays.masynnay.com/assets/anything-plays-desktop-preview.webp",
    previewKind: "interface",
    title: "Anything Plays",
    website: "https://anythingplays.masynnay.com/",
    websiteLabel: "Explore the project",
    category: "Software",
    label: "05 / INDEPENDENT DESKTOP SOFTWARE",
    description:
      "Turn a webcam into a controller for classic games. Track a color on a hand, toy, or fish and map movement to game inputs, or play with a keyboard. The free 3.0 release bundles 11 emulator cores for 18 console profiles, including Nintendo 64 and GameCube. The desktop app runs offline on Windows, macOS, and Linux.",
    tools:
      "Python · OpenCV · Tkinter · Libretro · PyInstaller · GitHub Actions",
    github: "https://github.com/MasynNay/anything-plays",
    release: "https://github.com/MasynNay/anything-plays/releases/tag/v3.0.0",
  },
  {
    id: "aftertone",
    imgUrl: "/images/projects/aftertone.webp",
    title: "AFTERTONE",
    category: "Web",
    label: "WEB APP / MUSIC DISCOVERY",
    description:
      "Discover music by listening to short previews and choosing Keep or Pass. Follow a familiar or experimental listening path, search the Deezer catalog, save favorites, or put your music knowledge to the test in tournament-style Music Duels. Preview availability depends on the provider.",
    tools:
      "JavaScript modules · Node.js · Deezer API · Browser audio · GitHub Pages",
    website: "https://aftertone.masynnay.com/demo/",
    websiteLabel: "Open the app",
    github: "https://github.com/MasynNay/aftertone",
  },
  {
    id: "keystoria",
    imgUrl: "/images/projects/keystoria.webp",
    title: "Keystoria",
    category: "Web",
    label: "BROWSER GAME / TYPING PRACTICE",
    description:
      "Build typing confidence through synchronized lyrics, timed speed tests, and practical Linux command exercises. The public browser edition includes Lyric Lab, Speed Lab, and Field Academy. The full 24-mission cooperative story campaign runs through a local Python and WebSocket server.",
    tools:
      "JavaScript · Python · WebSockets · Real-time multiplayer · GitHub Pages",
    website: "https://keystoria.masynnay.com/play/",
    websiteLabel: "Play in browser",
    github: "https://github.com/MasynNay/Keystoria",
  },
  {
    id: "mixstream",
    imgUrl: "/images/projects/mixstream.svg",
    title: "MixStream",
    demo: "/projects/mixstream",
    demoDescription:
      "Movie and TV search, title details, saved favorites, and links to check streaming availability.",
    category: "Web",
    label: "01 / GROUP PROJECT",
    description:
      "Find movies and shows, explore their details, and discover where to stream them. My first University of Utah boot camp group project.",
    tools: "JavaScript · CSS · Utelly & IMDB APIs",
    github: "https://github.com/MasynNay/MixStream",
  },
  {
    id: "typeninja",
    imgUrl: "/images/projects/typeninja.svg",
    title: "TypeNinja",
    demo: "/projects/typeninja",
    demoDescription:
      "A working browser edition of our typing game, with timed rounds, accuracy and local scores.",
    category: "Web",
    label: "02 / GROUP PROJECT",
    description:
      "A typing game for practicing speed and accuracy with randomly generated words. My second boot camp group project.",
    tools: "JavaScript · Node.js · Express",
    github: "https://github.com/MasynNay/TypeNinja",
  },
  {
    id: "semisnitch",
    imgUrl: "/images/projects/semisnitch.svg",
    title: "SemiSnitch",
    demo: "/projects/semisnitch",
    demoDescription:
      "Explore fictional fleet reports, import your own JSON and update coaching statuses locally.",
    category: "Web",
    label: "03 / GROUP PROJECT",
    description:
      "An all-in-one solution for optimizing semi-truck operations. My final boot camp group project.",
    tools: "React · GraphQL · Mongoose · Tailwind",
    github: "https://github.com/greg4949/Semi-Snitch",
  },
  {
    id: "mgt",
    imgUrl: "/images/projects/mgt.jpg",
    title: "Mother Goose Tumbling",
    website: "https://masynnay.github.io/MGT/",
    websiteLabel: "View preserved site",
    category: "Web",
    label: "04 / CLIENT PROJECT",
    description:
      "A website for Mother Goose Tumbling (MGT), featuring classes, a photo gallery, and parent resources. The site is now managed by a new administrator; my original version is preserved as a live application.",
    tools: "Responsive design · Class information · Photo gallery",
    github: "https://github.com/MasynNay/MGT",
  },
];

// Direct lookup is shared by demo headers and app credits; the list above owns
// titles, source links and local demo availability.
export const projectById = Object.fromEntries(
  webProjects.map((project) => [project.id, project]),
);
