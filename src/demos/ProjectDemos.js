// Demo routes reuse project metadata. TypeNinja runs as React; the other demos
// use isolated documents so their styles and browser-local state stay contained.
import { projectById } from "../data/projects";
import { Link, useParams } from "react-router-dom";
import TypingTest from "../typing/TypingTest";
import "./demos.css";
export default function ProjectDemos() {
  const { project } = useParams(),
    info = projectById[project];
  if (!info?.demo)
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
          <p>{info.demoDescription}</p>
        </div>
        <nav aria-label="Project links">
          <a href={info.github} target="_blank" rel="noreferrer">
            Original source ↗
          </a>
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
