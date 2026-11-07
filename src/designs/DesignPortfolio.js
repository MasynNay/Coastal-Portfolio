// Retained design studies use the same projects, skills and contact form as the
// live site. Only their layout and visual treatment differ.
import { links } from "../data/links";
import BrandMark from "../components/BrandMark";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Contact } from "../components/Contact";
import fishVideo from "../assets/images/vendetta-pokemon.mp4";
import { projects, skills } from "./content";
import "./designs.css";
import { profile } from "../data/resume";
import ProjectPreview from "../components/ProjectPreview";

// The "Coding" filter includes browser work and native desktop software.
const matchesProjectFilter = (project, filter) =>
  filter === "All" ||
  project.category === filter ||
  (filter === "Web" && project.category === "Software");

const hasProjectArtwork = (project) =>
  (project.category === "Web" || project.category === "Software") &&
  Boolean(project.imgUrl);

export function DesignPortfolio({ expressive }) {
  const [filter, setFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const name = expressive ? "Expressive" : "Polished";

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Masyn Nay — ${name} portfolio`;
    return () => {
      document.title = previousTitle;
    };
  }, [name]);

  return (
    <div
      className={`portfolio-design ${expressive ? "expressive" : "polished"}`}
    >
      <a className="design-skip" href="#design-main">
        Skip to content
      </a>
      <div className="design-preview-bar">
        <span>DESIGN STUDY / {expressive ? "02" : "01"}</span>
        <div>
          <Link
            to="/design/polished"
            aria-current={!expressive ? "page" : undefined}
          >
            01 Polished
          </Link>
          <Link
            to="/design/expressive"
            aria-current={expressive ? "page" : undefined}
          >
            02 Expressive
          </Link>
          <Link to="/">Original ↗</Link>
        </div>
      </div>
      <header className="design-header">
        <a className="brand-link" href="#home" aria-label="Masyn Nay home">
          <BrandMark framed decorative />
        </a>
        <button
          className="design-menu"
          aria-expanded={menuOpen}
          aria-controls="design-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
        <nav
          id="design-navigation"
          className={menuOpen ? "is-open" : ""}
          aria-label="Main navigation"
          onClick={() => setMenuOpen(false)}
        >
          <a href="#skills">Skills</a>
          <a href="#projects">Portfolio</a>
          <Link to="/resume">Resume ↗</Link>
          <a className="design-nav-contact" href="#contact">
            Let’s connect <span>↗</span>
          </a>
        </nav>
      </header>
      <main id="design-main">
        {expressive ? <ExpressiveHero /> : <PolishedHero />}
        <section
          className="design-about design-section"
          aria-labelledby="about-heading"
        >
          <div className="design-section-label">01 / A LITTLE CONTEXT</div>
          <div>
            <h2 id="about-heading">
              Curiosity is the
              <br />
              <em>common thread.</em>
            </h2>
            <p>{profile.introduction}</p>
            <p>
              Outside of work, you’ll find me spending time with family,
              building computers, playing video games, snowboarding, or catching
              up on a show. I’m always looking for something new to learn.
            </p>
          </div>
        </section>
        <section
          id="skills"
          className="design-section design-skills"
          aria-labelledby="skills-heading"
        >
          <div className="design-section-label">02 / THE TOOLKIT</div>
          <div className="design-section-intro">
            <h2 id="skills-heading">
              Across the stack.
              <br />
              <em>Beyond the screen.</em>
            </h2>
            <p>
              From troubleshooting systems to shaping interfaces, here’s what I
              work with.
            </p>
          </div>
          <div className="design-skill-grid">
            {skills.map((skill, i) => (
              <article key={skill.title}>
                <span className="design-small-number">0{i + 1}</span>
                <h3>{skill.title}</h3>
                <p>{skill.detail}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          id="projects"
          className="design-section design-work"
          aria-labelledby="work-heading"
        >
          <div className="design-section-label">
            03 / SELECTED WORK & MILESTONES
          </div>
          <div className="design-work-heading">
            <h2 id="work-heading">
              {expressive ? (
                <>
                  Things I’ve
                  <br />
                  <em>put into the world.</em>
                </>
              ) : (
                <>
                  Built with purpose.
                  <br />
                  <em>Learned by doing.</em>
                </>
              )}
            </h2>
            <div
              className="design-filters"
              role="group"
              aria-label="Filter portfolio"
            >
              {["All", "Web", "IT"].map((item) => (
                <button
                  key={item}
                  aria-pressed={filter === item}
                  onClick={() => setFilter(item)}
                >
                  {item === "Web" ? "Coding" : item}
                </button>
              ))}
            </div>
          </div>
          <p className="design-result-count" role="status">
            {
              projects.filter((project) =>
                matchesProjectFilter(project, filter),
              ).length
            }{" "}
            projects & milestones
          </p>
          <div className="design-project-grid">
            {projects
              .filter((project) => matchesProjectFilter(project, filter))
              .map((project) => (
                <article className="design-project" key={project.title}>
                  <div
                    className={`design-project-art${hasProjectArtwork(project) ? " has-preview" : ""}`}
                  >
                    {hasProjectArtwork(project) ? (
                      <ProjectPreview
                        title={project.title}
                        src={project.imgUrl}
                        kind={project.previewKind}
                      />
                    ) : (
                      <>
                        <span>
                          {project.category === "IT"
                            ? "A+"
                            : project.title === "TypeNinja"
                              ? "Aa_"
                              : project.title === "MixStream"
                                ? "▶"
                                : project.title === "SemiSnitch"
                                  ? "S / S"
                                  : "MG"}
                        </span>
                        <small>{project.tools}</small>
                      </>
                    )}
                  </div>
                  <div className="design-project-copy">
                    <span className="design-section-label">
                      {project.label}
                    </span>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <div className="design-project-links">
                      {project.demo && (
                        <a href={project.demo}>Try the demo ↗</a>
                      )}
                      {project.website && (
                        <a
                          href={project.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {project.websiteLabel || "Visit website"} ↗
                        </a>
                      )}
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View source ↗
                        </a>
                      )}
                      {project.roadmap && (
                        <a
                          href={project.roadmap}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Development roadmap ↗
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
          </div>
          <article className="design-fish">
            <div>
              <span className="design-section-label">THE FIRST EXPERIMENT</span>
              <h3>
                A fish. A game.
                <br />A starting point.
              </h3>
              <p>
                My first coding project let my betta fish, Vendetta, play
                Pokémon. Inspired by FishPlaysPokemon on Twitch in 2014, it was
                a fun introduction to building something out of curiosity. These
                are the remaining clips.
              </p>
              <Link to="/game" className="design-text-link">
                Explore the game page ↗
              </Link>
            </div>
            <video
              controls
              preload="none"
              aria-label="Clips from Vendetta’s Pokémon project"
            >
              <source src={fishVideo} type="video/mp4" />
            </video>
          </article>
        </section>
        <section
          className="design-section design-contact"
          aria-label="Get in touch"
        >
          <div className="design-section-label">04 / WHAT’S NEXT?</div>
          <div className="design-contact-intro">
            <h2>
              Let’s make
              <br />
              <em>something work.</em>
            </h2>
            <p>
              Have a project, a question, or an opportunity? I’d love to hear
              from you.
            </p>
            <a href={`mailto:${profile.email}`}>{profile.email} ↗</a>
          </div>
          <Contact />
        </section>
      </main>
      <footer className="design-footer">
        <a className="brand-link" href="#home" aria-label="Masyn Nay home">
          <BrandMark size="footer" framed decorative />
        </a>
        <p>IT. Development. Design. Always learning.</p>
        <div>
          <a href={links.github}>GitHub ↗</a>
          <a href={links.linkedin}>LinkedIn ↗</a>
          <a href={links.instagram}>Instagram ↗</a>
        </div>
        <a href="#home">Back to top ↑</a>
      </footer>
    </div>
  );
}

function PolishedHero() {
  return (
    <section id="home" className="design-hero">
      <div className="design-hero-copy">
        <p className="design-eyebrow">
          <span /> IT PROFESSIONAL / DEVELOPER / DESIGNER
        </p>
        <h1>
          Technical mind.
          <br />
          <em>Creative instinct.</em>
        </h1>
        <p className="design-hero-description">
          I’m Masyn. I work where technology meets people—supporting systems,
          building for the web, and finding better ways to make things work.
        </p>
        <div className="design-hero-actions">
          <a className="design-primary" href="#projects">
            Explore my work <span>↗</span>
          </a>
          <Link className="design-text-link" to="/resume">
            View resume ↗
          </Link>
        </div>
      </div>
      <aside className="design-hero-aside">
        <span className="design-section-label">
          A MULTIDISCIPLINARY APPROACH
        </span>
        <div className="design-orbit" aria-hidden="true">
          <BrandMark size="study" framed decorative />
        </div>
        <div className="design-aside-bottom">
          <span>
            Systems thinking.
            <br />
            Hands-on making.
          </span>
          <span>
            Roy, Utah
            <br />
            41° N / 112° W
          </span>
        </div>
      </aside>
      <div className="design-hero-bottom">
        <span>BUILT ON CURIOSITY</span>
        <a href="#skills">Scroll to explore ↓</a>
        <span>PORTFOLIO / MASYN NAY</span>
      </div>
    </section>
  );
}

function ExpressiveHero() {
  return (
    <section id="home" className="design-hero">
      <div className="design-hero-copy">
        <p className="design-eyebrow">
          <span /> HELLO, INTERNET. I’M MASYN NAY.
        </p>
        <h1>
          I fix things.
          <br />I build things.
          <br />
          <em>I keep exploring.</em>
        </h1>
        <div className="design-expressive-note">
          <span className="design-spark" aria-hidden="true">
            ✳
          </span>
          <p>
            IT professional. Web developer. Designer.
            <br />A curious mind with a hands-on approach.
          </p>
        </div>
        <div className="design-hero-actions">
          <a className="design-primary" href="#projects">
            See what I’ve been making ↗
          </a>
          <Link className="design-text-link" to="/resume">
            The resume ↗
          </Link>
        </div>
      </div>
      <aside
        className="design-hero-aside"
        aria-label="Technology, design, and curiosity"
      >
        <div className="design-sticker sticker-code">
          &lt; build /&gt;<small>ONE IDEA AT A TIME</small>
        </div>
        <div className="design-sticker sticker-system">
          <span>↗</span>MAKE IT
          <br />
          WORK.
        </div>
        <div className="design-sticker sticker-curious">
          STAY
          <br />
          <em>curious.</em>
          <span>✳</span>
        </div>
        <span className="design-margin-note">
          A LITTLE LOGIC. A LITTLE IMAGINATION.
        </span>
      </aside>
      <div className="design-hero-bottom">
        <span>TECHNOLOGY ↗</span>
        <span>DESIGN ✳</span>
        <span>EXPERIMENTATION ↗</span>
        <a href="#skills">KEEP GOING ↓</a>
      </div>
    </section>
  );
}
