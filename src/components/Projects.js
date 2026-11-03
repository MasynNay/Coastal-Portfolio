import { Container, Row, Col, Tab, Nav } from "react-bootstrap";
import { ProjectCard } from "./ProjectCard";
import { webProjects } from "../data/projects";
import certificateImage from "../assets/images/comptia-certificate.png";
import vendettaVideo from "../assets/images/vendetta-pokemon.mp4";
import "animate.css";
import TrackVisibility from "react-on-screen";
import { Link, useLocation } from "react-router-dom";
import gameIcon from "../assets/images/game-icon.svg";
import { achievements } from "../data/resume";

export const Projects = ({ glass = false }) => {
  const { search } = useLocation();
  const initialTab =
    new URLSearchParams(search).get("project") === "first" ? "third" : "first";
  const itProjects = [
    ...(glass
      ? achievements.map((item) => ({
          title: item.title,
          description: item.description,
          iconLabel: item.iconLabel,
        }))
      : []),
    {
      title: "CompTIA A+ Certification",
      description:
        "I completed the CompTIA A+ certification in May, 2024. This certification is a great starting point for a career in IT and is a great way to learn the basics of computer hardware, software, and networking.",
      imgUrl: certificateImage,
    },
  ];

  const codingProjects = [
    ...webProjects.map(
      ({ github, demo, website, websiteLabel, ...project }) => ({
        ...project,
        gitLink: github,
        demoLink: demo,
        webLink: website,
        webLabel: websiteLabel,
      }),
    ),
  ];

  return (
    <section className="project" id="projects">
      <Container>
        <Row>
          <Col size={12}>
            <TrackVisibility>
              {({ isVisible }) => (
                <div
                  className={
                    isVisible ? "animate__animated animate__fadeIn" : ""
                  }
                >
                  <h2>Portfolio</h2>
                  <p>
                    Here’s a glimpse into my portfolio, highlighting some
                    accomplishments from working in IT and from coding. This
                    section showcases some of my IT experience and coding skills
                    coming together to drive creative results.
                  </p>
                  <Tab.Container
                    id="projects-tabs"
                    defaultActiveKey={initialTab}
                  >
                    <Nav
                      variant="pills"
                      className="nav-pills mb-5 justify-content-center align-items-center"
                      id="pills-tab"
                    >
                      <Nav.Item>
                        <Nav.Link eventKey="first">IT</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="second">Coding</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="third">First Project</Nav.Link>
                      </Nav.Item>
                    </Nav>
                    <Tab.Content
                      id="slideInUp"
                      className={
                        isVisible ? "animate__animated animate__slideInUp" : ""
                      }
                    >
                      <Tab.Pane eventKey="first">
                        <Row>
                          {itProjects.map((project) => (
                            <ProjectCard
                              key={project.title}
                              {...project}
                              glass={glass}
                            />
                          ))}
                        </Row>
                      </Tab.Pane>
                      <Tab.Pane eventKey="second">
                        <Row>
                          {codingProjects.map((project) => (
                            <ProjectCard
                              key={project.title}
                              {...project}
                              glass={glass}
                            />
                          ))}
                        </Row>
                      </Tab.Pane>
                      <Tab.Pane eventKey="third">
                        <p>
                          This was my very first coding project. I wanted to be
                          able to have my betta fish, Vendetta, play a Pokemon
                          game. I got my inspiration from "FishPlaysPokemon"
                          that was on Twitch.tv in 2014. This was a very fun
                          project to work on and a great starting point for a
                          coder's journey! The video provided were the only
                          remaining clips I could find of this project. I hope
                          you enjoy.
                        </p>
                        <div
                          className={glass ? "first-project-film" : undefined}
                        >
                          <video
                            src={vendettaVideo}
                            controls
                            preload="metadata"
                            aria-label="Vendetta’s first coding project"
                          />
                          <div
                            className={
                              glass ? "first-project-caption" : undefined
                            }
                          >
                            {glass && (
                              <span>VENDETTA / THE FIRST EXPERIMENT</span>
                            )}
                            <Link
                              to="/game"
                              className={
                                glass ? "first-project-secret" : "icon-link"
                              }
                              aria-label="Take a small detour"
                            >
                              <img src={gameIcon} alt="" />
                            </Link>
                          </div>
                        </div>
                      </Tab.Pane>
                    </Tab.Content>
                  </Tab.Container>
                </div>
              )}
            </TrackVisibility>
          </Col>
        </Row>
      </Container>
    </section>
  );
};
