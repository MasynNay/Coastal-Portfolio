import { links as profileLinks } from "../data/links";
import { useState, useEffect } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import BrandMark from "./BrandMark";
import linkedinIcon from "../assets/images/linkedin.svg";
import githubIcon from "../assets/images/github.svg";
import instagramIcon from "../assets/images/instagram.svg";
import { Apple, Controller, List, X } from "react-bootstrap-icons";

export const NavBar = ({ glass = false }) => {
  const [activeLink, setActiveLink] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setActiveLink(
      location.pathname.endsWith("/resume")
        ? "resume"
        : location.hash.slice(1) || "home",
    );
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onUpdateActiveLink = (value) => {
    setActiveLink(value);
    if (glass) setExpanded(false);
  };

  const homePath = glass ? "/design/glass" : "/";
  const resumePath = glass ? "/design/glass/resume" : "/resume";
  const shortNavigation = ["/resume", "/game", "/design/glass/resume"].includes(
    location.pathname,
  );
  const links = shortNavigation
    ? [
        ["home", "Home", homePath],
        ["resume", "Resume", resumePath],
      ]
    : [
        ["home", "Home"],
        ["skills", "Skills"],
        ["projects", "Portfolio"],
        ["contact", "Contact"],
        ["resume", "Resume", resumePath],
      ];
  // Respect the visitor's motion setting when following a section link. The
  // callback reads the current preference, including changes made after load.
  function scrollToSection(element) {
    element.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  return (
    <Navbar
      expand={glass ? "lg" : "md"}
      expanded={expanded}
      onToggle={setExpanded}
      className={scrolled ? "scrolled" : ""}
    >
      <Container>
        <Navbar.Brand
          as={Link}
          to={glass ? "/design/glass" : "/"}
          className="brand-link"
          aria-label="Masyn Nay home"
        >
          {glass ? (
            <span className="glass-wordmark">
              masyn<span>nay</span>
            </span>
          ) : (
            <BrandMark decorative />
          )}
        </Navbar.Brand>
        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          label="Toggle navigation"
          aria-expanded={expanded}
        >
          {expanded ? (
            <X className="navbar-menu-icon" size={28} aria-hidden="true" />
          ) : (
            <List className="navbar-menu-icon" size={28} aria-hidden="true" />
          )}
        </Navbar.Toggle>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {links.map(([id, label, page]) => (
              <Nav.Link
                key={id}
                as={page ? Link : HashLink}
                to={page || `${glass ? homePath : ""}#${id}`}
                {...(!page ? { scroll: scrollToSection } : {})}
                aria-current={
                  activeLink === id ? (page ? "page" : "location") : undefined
                }
                className={
                  activeLink === id ? "active navbar-link" : "navbar-link"
                }
                onClick={() => onUpdateActiveLink(id)}
              >
                {label}
              </Nav.Link>
            ))}
          </Nav>
          {glass && (
            <Link
              to="/design/desktop"
              className="glass-mac-button glass-mode-button"
              aria-label="Open Mac Mode"
              data-tooltip="Explore Mac Mode"
              onClick={() => setExpanded(false)}
            >
              <Apple size={20} aria-hidden="true" />
              <span>Mac Mode</span>
            </Link>
          )}
          {glass && (
            <Link
              to="/world"
              className="glass-mac-button glass-mode-button glass-world-button"
              aria-label="Explore game mode"
              data-tooltip="Explore game mode"
              onClick={() => setExpanded(false)}
            >
              <Controller size={19} aria-hidden="true" />
              <span>Game Mode</span>
            </Link>
          )}
          <span className="navbar-text">
            <div className="social-icon">
              <a href={profileLinks.linkedin} aria-label="LinkedIn">
                <img src={linkedinIcon} alt="" />
              </a>
              <a href={profileLinks.github} aria-label="GitHub">
                <img src={githubIcon} alt="" />
              </a>
              <a href={profileLinks.instagram} aria-label="Instagram">
                <img src={instagramIcon} alt="" />
              </a>
            </div>
          </span>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
