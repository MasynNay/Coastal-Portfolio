// Evidence-led project notes, sourced from each repository's README. Group
// contributions remain group work, and preserved client work is labeled clearly.
export const projectStories = {
  "Anything Plays": {
    role: "Independent desktop application",
    problem:
      "Could the movement of a fish, toy, or hand become useful game controls?",
    approach:
      "I connected OpenCV color tracking to configurable camera zones and embedded emulator inputs, with keyboard and controller play available too. Libraries and control profiles stay on the user's computer.",
    outcome:
      "The public 3.3 release offers 18 console profiles through 11 native emulator cores, with installers for Windows, Linux, and Intel and Apple Silicon Macs. Recent work focuses on GameCube preview reliability, camera recovery, and safer stream cleanup.",
    evidence: "https://github.com/MasynNay/anything-plays/blob/main/README.md",
  },
  "Mother Goose Tumbling": {
    role: "Personal website project for a local business",
    problem:
      "Give parents a clear way to find classes, competition details, and information about the gym, while exploring an alternative to the existing Wix site.",
    approach:
      "I organized the site around classes, competition information, the team, contact details, galleries, and parent resources, with navigation and layouts designed for phones as well as larger screens.",
    outcome:
      "My version is preserved as a working GitHub Pages application. MGT now uses another administrator; the preserved site demonstrates my work rather than an ongoing client relationship.",
    evidence: "https://github.com/MasynNay/MGT/blob/main/README.md",
  },
  TypeNinja: {
    role: "University of Utah boot camp team project",
    problem:
      "Make repeated typing practice more engaging, with measurable speed and accuracy.",
    approach:
      "I worked with a five-person team on a typing game using randomized words. The original application included accounts, saved WPM scores, and scoreboards. This portfolio preserves a browser edition with timed rounds and local results.",
    outcome:
      "Visitors can try the core typing experience directly from the portfolio. The browser demo does not pretend to provide the original hosted account and database service.",
    evidence: "https://github.com/MasynNay/TypeNinja/blob/main/README.md",
  },
};
