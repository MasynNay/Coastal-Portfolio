// Add a dated entry when a patch ships. These describe the actual changes since
// the preceding production commit, rather than fictional in-game release notes.
const patchNotes = [
  {
    version: "1.0.4",
    date: "November 2, 2026",
    previousCommit: "b8ae9df",
    changes: [
      "Element Runner and Axolotl Drift now open maximized inside Mac Mode, with their courses using the available window space.",
      "Moved game information beside the courses in wide Mac windows and collapsed the extra controls panel by default. Show Controls and Restore remain available.",
      "Added a Fullscreen control for these two games when an even larger view is wanted.",
    ],
  },
  {
    version: "1.0.3",
    date: "November 2, 2026",
    previousCommit: "d6d5b23",
    changes: [
      "Connected Mac Mode's Photos app to the live Frames shared album, with photo browsing and slideshow controls.",
      "Added Refresh Album and Open Album controls. Photo changes can now come directly from the shared album without a portfolio rebuild.",
      "Kept the local slideshow folder available as an alternative and documented how to switch photo sources.",
      "Added all seven island mini-games to Mac Mode's Games app and the hidden Pocket Arcade, each with a custom cartridge and keyboard/touch instructions.",
      "The same game components and rules power the island and standalone cartridge players, including a compact version of the family axolotl race.",
    ],
  },
  {
    version: "1.0.2",
    date: "November 2, 2026",
    previousCommit: "eb2a0d2",
    changes: [
      "Restored Mother Goose Tumbling to the shared project list across the website, Mac Mode and Game Mode.",
      "Added a real screenshot, the preserved live application and source links, and a note that the current site has moved to a new administrator.",
    ],
  },
  {
    version: "1.0.1",
    date: "November 2, 2026",
    previousCommit: "d79d89b",
    changes: [
      "Terrariums and aquariums fit the screen in normal and close-up views. Only the creature picker scrolls sideways.",
      "Inventory and Open Field Guide share one toolbar, and creature details are centered beneath their habitats.",
      "Release One and Look Closer have matching sizes on opposite sides of each habitat. Pause is centered below the details.",
      "Releasing a creature now asks for confirmation. Discoveries stay in the field guide after release.",
      "Added phone, tablet and keyboard instructions for shaking trees, catching bugs and fishing, in the collection screens and Help.",
      "Fixed Contact Me email delivery with FormSubmit. Activation is complete, and a test from the live website was received successfully. Messages include the visitor's contact details and message; failed submissions keep their draft and offer a direct email link.",
      "The Windfall mailbox now holds these real patch notes instead of a duplicate Rickroll.",
    ],
  },
];
export default patchNotes;
