// The shared home hero reads profile facts from the resume data. Its typewriter
// timer respects reduced motion; the glass layout adds the floating monogram.
import { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import legacyHeroImage from "../assets/images/legacy-hero.svg";
import "animate.css";
import TrackVisibility from "react-on-screen";
import { profile } from "../data/resume";

const roles = [
  "Masyn Nay",
  "A Systems Administrator",
  "An IT Professional",
  "A Web Developer",
  "A Graphic Designer",
];

export const Banner = ({ glass = false }) => {
  const [roleIndex, setRoleIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [text, setText] = useState("Masyn Nay");
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = (event) => setReducedMotion(event.matches);
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const fullText = roles[roleIndex];
    const delay = isDeleting ? 45 : text === fullText ? 2000 : 105;
    const ticker = setTimeout(() => {
      if (!isDeleting && text === fullText) {
        setIsDeleting(true);
      } else if (isDeleting && text === "") {
        setIsDeleting(false);
        setRoleIndex((index) => (index + 1) % roles.length);
      } else {
        setText(fullText.slice(0, text.length + (isDeleting ? -1 : 1)));
      }
    }, delay);
    return () => clearTimeout(ticker);
  }, [text, isDeleting, roleIndex, reducedMotion]);

  return (
    <section className="banner" id="home">
      <Container>
        <Row className="align-items-center">
          <Col xs={12} md={6} xl={7}>
            <TrackVisibility>
              {({ isVisible }) => (
                <div
                  className={
                    isVisible ? "animate__animated animate__fadeIn" : ""
                  }
                >
                  {glass && (
                    <span className="glass-eyebrow">
                      <i /> WELCOME TO MY CORNER OF THE INTERNET
                    </span>
                  )}
                  <h1>
                    {`I'm`}{" "}
                    <span
                      className="txt-rotate"
                      dataperiod="1000"
                      data-rotate={JSON.stringify(roles)}
                    >
                      <span className="wrap">
                        {reducedMotion ? "Masyn Nay" : text}
                      </span>
                    </span>
                  </h1>
                  <p>
                    {profile.introduction}
                    <br></br>
                    <br></br>
                    I graduated from the University of Utah full-stack coding
                    boot camp in May 2023. I bring a creative perspective to my
                    technical work through coding, graphic design, and a drive
                    to keep learning.
                    <br />
                    <br />
                    {profile.interestsIntroduction}
                  </p>
                  {glass && (
                    <div className="glass-hero-actions">
                      <a href="#projects">
                        Explore my work <span>↗</span>
                      </a>
                      <a href="/services">Hire me for a website</a>
                      <a href="#contact">Let’s connect</a>
                    </div>
                  )}
                </div>
              )}
            </TrackVisibility>
          </Col>
          <Col xs={12} md={6} xl={5}>
            <TrackVisibility>
              {({ isVisible }) => (
                <div
                  className={
                    isVisible ? "animate__animated animate__zoomIn" : ""
                  }
                >
                  {glass ? (
                    <div
                      className="glass-sculpture"
                      role="img"
                      aria-label="Floating MN monogram"
                    >
                      <div className="glass-ring ring-one" />
                      <div className="glass-ring ring-two" />
                      <div className="glass-monogram">mn</div>
                      <div className="glass-float-note note-one">
                        <span>⌘</span> Creative by nature
                      </div>
                      <div className="glass-float-note note-two">
                        <span>&lt;/&gt;</span> Built on curiosity
                      </div>
                      <span className="glass-art-caption">
                        IT · DEVELOPMENT · DESIGN
                      </span>
                    </div>
                  ) : (
                    <img src={legacyHeroImage} alt="Header Img" />
                  )}
                </div>
              )}
            </TrackVisibility>
          </Col>
        </Row>
      </Container>
    </section>
  );
};
