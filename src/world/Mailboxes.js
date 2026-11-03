// Secrets are opened deliberately. The playful video never starts until the
// visitor opens the letter; original arcade portals remain tucked inside each box.
export const mailboxLetters = {
  home: {
    title: "A mysterious mixtape",
    openOnUnseal: true,
    teaser: "Someone left you a song. The envelope says: trust me.",
    reward: {
      label: "Play the mysterious mixtape ↗",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    joke: "You’ve been rickrolled. The ducks insist they had nothing to do with it.",
  },
  skills: {
    title: "A very small support ticket",
    teaser: "The workshop has received an urgent request…",
    joke: "User reports: ‘There’s a bug in my code.’ Investigation finds one tiny jumping spider living very comfortably on the keyboard.",
  },
  portfolio: {
    title: "Patch notes from the playground",
    teaser: "A handwritten release log, with several crayon corrections.",
    joke: "Version 1.0: slide added. Version 1.1: slide tested 400 times. Known issue: nobody wants to go home.",
  },
  resume: {
    title: "A wizard’s troubleshooting guide",
    teaser: "A sealed scroll marked: powerful magic inside.",
    joke: "First spell: turn it off. Second spell: turn it back on. If both fail, consult the wizard’s documentation.",
  },
  contact: {
    title: "A postcard from the ducks",
    teaser: "It’s covered in tiny webbed footprints.",
    joke: "Dear Masyn, the pond Wi-Fi is excellent. We still refuse to pay the bill. Warmest quacks, the ducks.",
  },
  lodge: {
    title: "News from Windfall",
    teaser:
      "The latest island update has arrived. Open the letter for real patch notes.",
    content: "patch-notes",
  },
};
