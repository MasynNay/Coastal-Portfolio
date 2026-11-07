import { profile, achievements } from "../data/resume";
import { skills, projects } from "../designs/content";
import { Contact } from "../components/Contact";
import ResumePage from "../pages/ResumePage";
import SpritePose from "./SpritePose";

export default function RoomContent({ id, onHunt, huntActive = false }) {
  // These imports are the same sources used by the normal portfolio: updates appear in both modes.
  if (id === "home")
    return (
      <>
        <p className="world-lead">{profile.introduction}</p>
        <p>{profile.interestsIntroduction}</p>
        <h3>A few things I’ve built</h3>
        {achievements.map((a) => (
          <article key={a.title}>
            <h4>{a.title}</h4>
            <p>{a.description}</p>
          </article>
        ))}
      </>
    );
  if (id === "skills")
    return (
      <div className="world-content-grid">
        {skills.map((s) => (
          <article key={s.title}>
            <h3>{s.title}</h3>
            <p>{s.detail}</p>
          </article>
        ))}
      </div>
    );
  if (id === "portfolio")
    return (
      <div className="world-content-grid">
        {projects.map((p) => (
          <article key={p.title}>
            <small>{p.label}</small>
            <h3>{p.title}</h3>
            <p>{p.description}</p>
            <p>{p.tools}</p>
            {p.demo && (
              <a href={p.demo} target="_blank" rel="noreferrer">
                Try the demo ↗
              </a>
            )}
            {p.website && (
              <a href={p.website} target="_blank" rel="noreferrer">
                Visit project ↗
              </a>
            )}
            {p.github && (
              <a href={p.github} target="_blank" rel="noreferrer">
                View source ↗
              </a>
            )}
            {p.roadmap && (
              <a href={p.roadmap} target="_blank" rel="noreferrer">
                Development roadmap ↗
              </a>
            )}
          </article>
        ))}
      </div>
    );
  if (id === "resume") return <ResumePage />;
  if (id === "contact") return <Contact />;
  return (
    <>
      <p className="world-lead">Welcome to the Windfall lodge.</p>
      <p>
        A small coastal hideaway inspired by the timber houses and ocean colors
        of Windfall Island. Its role can grow as we add more games.
      </p>
      <h3>The glass-float hunt</h3>
      <aside
        className="float-story"
        aria-label="The story behind the glass floats"
      >
        <SpritePose
          asset="glass-float-1"
          playing={false}
          scale={0.7}
          label="A seafoam glass float"
        />
        <div>
          <h4>A family tradition from the Oregon coast</h4>
          <p>
            On our regular trips to the Oregon coast, my family loves searching
            the beach for hidden glass floats. We also visit glassblowing
            studios to make our own. This little hunt brings a piece of those
            memories into my world.
          </p>
          <p>
            In Lincoln City, the Finders Keepers program has volunteers place
            handblown glass floats along seven miles of beach for people to find
            and keep. Official drops happen throughout daylight hours. Visitors
            can also make their own float with a local glassblower.
          </p>
          <div className="float-story-links">
            <a
              href="https://www.explorelincolncity.com/things-to-do/glass-floats/"
              target="_blank"
              rel="noreferrer"
            >
              The real Finders Keepers tradition ↗
            </a>
            <a
              href="https://www.lincolncityglasscenter.com/"
              target="_blank"
              rel="noreferrer"
            >
              Make a float in Lincoln City ↗
            </a>
          </div>
        </div>
      </aside>
      <p>
        Twenty handblown glass fishing floats are waiting to be hidden: swirling
        seafoam, cobalt, rose, amber and more. Start the hunt to make the
        colored glass balls appear outdoors. Search the lawns, paths and beach;
        walk close to a float and press E or tap Collect. These are visible
        treasures, so keep an eye out for their shine! The places / secrets
        counter opens your journal, where you can see every color found. Your
        current hunt is saved on this device. A fresh hunt chooses new hiding
        spots, including all four beaches; your lifetime color discoveries stay
        in the journal.
      </p>
      <button className="world-primary" onClick={() => onHunt(false)}>
        {huntActive ? "Continue searching" : "Start searching"}
      </button>
      {huntActive && (
        <button onClick={() => onHunt(true)}>
          Hide a fresh set of 20 floats
        </button>
      )}
    </>
  );
}
