// Add a dated entry when a patch ships. These describe the actual changes since
// the preceding production commit, rather than fictional in-game release notes.
const patchNotes = [
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
      "Replaced the inaccessible EmailJS connection with FormSubmit. Failed submissions keep the visitor's message and offer a direct email link; delivery requires the recipient's one-time activation.",
      "The Windfall mailbox now holds these real patch notes instead of a duplicate Rickroll.",
    ],
  },
];
export default patchNotes;
