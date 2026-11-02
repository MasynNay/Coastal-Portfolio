import { Link, useParams } from "react-router-dom";
import TypingTest from "../typing/TypingTest";
import "./demos.css";
const projects = {
  mixstream: {
    title: "MixStream",
    source: "https://github.com/MasynNay/MixStream",
    description:
      "Movie and TV search, title details, saved favorites, and links to check streaming availability.",
  },
  typeninja: {
    title: "TypeNinja",
    source: "https://github.com/MasynNay/TypeNinja",
    description:
      "A working browser edition of our typing game, with timed rounds, accuracy and local scores.",
  },
  semisnitch: {
    title: "SemiSnitch",
    source: "https://github.com/greg4949/Semi-Snitch",
    description:
      "Explore fictional fleet reports, import your own JSON and update coaching statuses locally.",
  },
};
export default function ProjectDemos() {
  const { project } = useParams(),
    info = projects[project];
  if (!info)
    return (
      <main className="project-demo">
        <h1>Project not found</h1>
        <Link to="/design/glass#projects">Back to the portfolio</Link>
      </main>
    );
  return (
    <main className="project-demo">
      <header className="project-demo-header">
        <div>
          <Link to="/design/glass#projects">← Portfolio</Link>
          <h1>{info.title}</h1>
          <p>{info.description}</p>
        </div>
        <nav aria-label="Project links">
          <a href={info.source} target="_blank" rel="noreferrer">
            Original source ↗
          </a>
          {info.live && (
            <a href={info.live} target="_blank" rel="noreferrer">
              Original live site ↗
            </a>
          )}
        </nav>
      </header>
      {project === "typeninja" ? (
        <div className="project-demo-typing">
          <TypingTest active />
        </div>
      ) : (
        <iframe
          className="project-demo-frame"
          title={info.title + " interactive demo"}
          src={"/demos/" + project + "/index.html"}
        />
      )}
    </main>
  );
}
