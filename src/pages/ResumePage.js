import { Container } from "react-bootstrap";
import {
  profile,
  experience,
  education,
  achievements,
  interests,
} from "../data/resume";
import "../ResumePage.css";

export default function ResumePage() {
  return (
    <section className="resume" id="resume" aria-label="Masyn Nay resume">
      <Container>
        <header className="header-section mb-4">
          <span className="resume-edition">RESUME / 2026</span>
          <h1>{profile.name}</h1>
          <p className="resume-headline">{profile.headline}</p>
          <p className="resume-contact-line">
            <span>{profile.location}</span>
            <a href="tel:+18019413063">{profile.phone}</a>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </p>
          <div className="resume-profile-links">
            <a href="https://masynnay.com">Website ↗</a>
            <a href="https://github.com/MasynNay">GitHub ↗</a>
            <a href="https://www.linkedin.com/in/masyn-nay-290225201/">
              LinkedIn ↗
            </a>
          </div>
        </header>
        <section
          className="resume-section"
          aria-labelledby="resume-summary-title"
        >
          <h2 id="resume-summary-title">Summary</h2>
          <p>{profile.summary}</p>
        </section>
        <section
          className="resume-section"
          aria-labelledby="resume-skills-title"
        >
          <h2 id="resume-skills-title">Core Skills</h2>
          <ul className="resume-skill-list">
            {profile.coreSkills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </section>
        <section
          className="resume-section"
          aria-labelledby="resume-experience-title"
        >
          <h2 id="resume-experience-title">Professional Experience</h2>
          {experience.map((job) => (
            <article key={job.employer} className="experience-entry">
              <div className="resume-job-heading">
                <div>
                  <h3>{job.employer}</h3>
                  <p className="resume-job-title">{job.title}</p>
                </div>
                <div className="resume-job-meta">
                  <p>{job.location}</p>
                  <p>{job.dates}</p>
                </div>
              </div>
              <ul>
                {job.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
        <section
          className="resume-section"
          aria-labelledby="resume-education-title"
        >
          <h2 id="resume-education-title">Education & Certifications</h2>
          {education.map((item) => (
            <article className="education-entry" key={item.title}>
              <h3>{item.title}</h3>
              <p>
                {item.institution} · {item.year}
                {item.detail ? ` · ${item.detail}` : ""}
              </p>
            </article>
          ))}
        </section>
        <section
          className="resume-section"
          aria-labelledby="resume-achievements-title"
        >
          <h2 id="resume-achievements-title">Key Achievements</h2>
          <div className="resume-feature-grid">
            {achievements.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          className="resume-section"
          aria-labelledby="resume-interests-title"
        >
          <h2 id="resume-interests-title">Interests</h2>
          <div className="resume-feature-grid">
            {interests.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </Container>
    </section>
  );
}
