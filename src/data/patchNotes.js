// Add a dated entry when a patch ships. These describe the actual changes since
// the preceding production commit, rather than fictional in-game release notes.
const patchNotes = [
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
