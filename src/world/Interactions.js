// A hug is the ordinary Masyn/Mi Shell greeting. Only one of twenty equally
// sized RNG buckets starts the playful encounter; other family greetings do not.
export function familyGreeting(character, person, random = Math.random) {
  if (character !== "masyn" || person !== "mi-shell") return "person";
  return Math.floor(random() * 20) === 0 ? "encounter" : "affection";
}
export const propMessages = {
  tunnel: "A little adventure through the tunnel. Watch your head!",
  "climbing-dome": "Pick a route, hold on, and climb a little higher.",
  "spring-rider": "One small seahorse, a whole ocean of imagination.",
  "picnic-table":
    "The perfect spot for a snack and a very serious playground meeting.",
  bonsai: "A quiet breath by the bonsai. There’s always room to keep growing.",
  chimes: "The sea breeze sets the chimes singing. ♫",
  mushroom: "A warm little lantern lights the workshop garden.",
  workbench:
    "Measure twice, build once. There’s another project taking shape here.",
  parcelbox: "A parcel full of ideas, ready for the next project.",
  workstation: "Solar power, a fresh terminal, and something new to build.",
  telescope: "Beyond the harbor: a whole sky of possibilities. ✧",
  orrery: "The stars turn, and there’s always something more to learn.",
  "coastal-mailbox":
    "A little reminder: Masyn is always happy to hear from you.",
  windmill: "A little coastal breeze keeps this corner turning.",
  playhouse:
    "Race you to the slide! The kids have claimed this corner of town.",
  swings: "A gentle push, a little higher, and a great view of the pond.",
  seesaw:
    "Up, down, and one more turn. There’s always room for another player.",
  sandbox: "A tiny sandcastle city, built by Ezra, Fallyn, and Fitzgerald.",
};
