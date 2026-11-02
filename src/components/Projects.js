import { Container, Row, Col, Tab, Nav } from "react-bootstrap";
import { ProjectCard } from "./ProjectCard";
import { webProjects } from "../data/projects";
import itproject1 from "../assets/images/itproject1.PNG";
import video from "../assets/images/video1.mp4";
import placeholder from "../assets/images/placeholder.png";
import "animate.css";
import TrackVisibility from "react-on-screen";
import { Link, useLocation } from "react-router-dom";
import gameIcon from "../assets/images/game-icon.svg";
import { achievements } from "../data/resume";

export const Projects = ({ glass = false }) => {
  const { search } = useLocation();
  const initialTab =
    new URLSearchParams(search).get("project") === "first" ? "third" : "first";
  const projectsTab1 = [
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
      imgUrl: itproject1,
    },
    {
      title: "Custom Project 2",
      description: "Description for custom project 2.",
      imgUrl: placeholder,
    },
  ];

  const projectsTab2 = [
    ...webProjects.map(({ github, demo, ...project }) => ({
      ...project,
      gitLink: github,
      demoLink: demo,
    })),
    // Retained on the original route only; the redesign hides unfinished cards.
    {
      title: "Placeholder #5",
      description: "Placeholder #5",
      imgUrl: placeholder,
      // No links
    },
    {
      title: "Placeholder #6",
      description: "Placeholder #6",
      imgUrl: placeholder,
      // No links
    },
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
                          {projectsTab1
                            .filter(
                              (project) =>
                                !glass || project.title !== "Custom Project 2",
                            )
                            .map((project) => (
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
                          {projectsTab2
                            .filter(
                              (project) =>
                                !glass ||
                                !project.title.startsWith("Placeholder"),
                            )
                            .map((project) => (
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
                            src={video}
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
