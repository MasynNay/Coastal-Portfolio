import BrandMark from "../components/BrandMark";
import { NavBar } from "../components/NavBar";
import { Banner } from "../components/Banner";
import { Projects } from "../components/Projects";
import { Contact } from "../components/Contact";
import { Link } from "react-router-dom";
import { skills } from "./content";
import "./glass.css";
import ResumePage from "../pages/ResumePage";
import {
  CodeSlash,
  Palette,
  Diagram3,
  Display,
  HddNetwork,
  Grid,
  Database,
  Terminal,
  Tools,
  Stars,
} from "react-bootstrap-icons";

const skillIcons = [
  CodeSlash,
  HddNetwork,
  Database,
  Display,
  Grid,
  Diagram3,
  Terminal,
  Palette,
  Tools,
  Stars,
];

export function GlassPortfolio({ resume = false }) {
  return (
    <div className="glass-site">
      <a className="glass-skip" href="#glass-main">
        Skip to content
      </a>
      <NavBar glass />
      <main id="glass-main" tabIndex={-1}>
        {resume ? (
          <div className="glass-resume">
            <ResumePage />
          </div>
        ) : (
          <>
            <Banner glass />
            <section className="glass-skills" id="skills">
              <div className="container">
                <div className="glass-section-heading">
                  <span className="glass-eyebrow">
                    ALWAYS LEARNING. ALWAYS BUILDING.
                  </span>
                  <h2>Skills</h2>
                  <p>A technical foundation. A creative perspective.</p>
                </div>
                <div className="glass-skills-panel">
                  {skills.map((skill, i) => {
                    const SkillIcon = skillIcons[i] || Grid;
                    return (
                      <article key={skill.title}>
                        <div className="glass-skill-top">
                          <span className="glass-skill-icon">
                            <SkillIcon aria-hidden="true" />
                          </span>
                          <span className="glass-skill-number">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <h3>{skill.title}</h3>
                        <ul
                          className="glass-skill-items"
                          aria-label={`${skill.title} skills`}
                        >
                          {skill.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
            <Projects glass />
            <div className="glass-contact-wrap">
              <Contact />
            </div>
          </>
        )}
      </main>
      <footer className="glass-footer container">
        <Link
          className="brand-link"
          to="/design/glass#home"
          aria-label="Masyn Nay home"
        >
          <BrandMark size="footer" decorative />
        </Link>
        <p>Technology, creativity, and a little curiosity.</p>
        <div>
          <a href="https://github.com/MasynNay">GitHub ↗</a>
          <a href="https://www.linkedin.com/in/masyn-nay-290225201/">
            LinkedIn ↗
          </a>
          <a href="https://www.instagram.com/masynnay/">Instagram ↗</a>
          <a href="/React-Portfolio/" target="_blank" rel="noreferrer">
            Before this redesign ↗
          </a>
        </div>
        <div
          className="glass-portfolio-archive"
          aria-label="Earlier portfolios"
        >
          <span>EARLIER PORTFOLIOS</span>
          <a
            href="https://masynnay.github.io/Reactive-Portfolio/"
            target="_blank"
            rel="noreferrer"
          >
            2022 · HTML & CSS ↗
          </a>
          <a
            href="https://masynnay.github.io/React-Portfolio/"
            target="_blank"
            rel="noreferrer"
          >
            2023 · React ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
