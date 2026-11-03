// Titles, descriptions and destinations stay identical in website cards, Mac
// windows and game rooms. Each presentation chooses its own card layout.
export const webProjects = [
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
