import BrandMark from "../components/BrandMark";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Apple,
  Person,
  Folder2Open,
  Terminal,
  FileEarmarkText,
  Envelope,
  ArrowLeft,
  Github,
  Wifi,
  BatteryFull,
  Controller,
  Images,
  Keyboard,
} from "react-bootstrap-icons";
import { Projects } from "../components/Projects";
import { Contact } from "../components/Contact";
import ResumePage from "../pages/ResumePage";
import { skills } from "./content";
import { profile } from "../data/resume";
import { MacMenu, AboutMac } from "./MacMenu";
import { GamesApp, GamePlayer, PhotosApp } from "./MacApps";
import TypingTest from "../typing/TypingTest";
import useWindowDrag from "../hooks/useWindowDrag";
import "./glass.css";
import "./desktop.css";

const apps = [
  { id: "about", title: "About Masyn", Icon: Person, color: "blue" },
  { id: "projects", title: "Portfolio", Icon: Folder2Open, color: "folder" },
  { id: "skills", title: "Skills", Icon: Terminal, color: "black" },
  { id: "resume", title: "Resume", Icon: FileEarmarkText, color: "paper" },
  { id: "contact", title: "Contact", Icon: Envelope, color: "mail" },
  { id: "typing", title: "Typing Test", Icon: Keyboard, color: "teal" },
  { id: "games", title: "Games", Icon: Controller, color: "blue" },
  { id: "photos", title: "Photos", Icon: Images, color: "folder" },
];

export function DesktopPortfolio() {
  const [windows, setWindows] = useState([]);
  const [active, setActive] = useState("");
  const [aboutMac, setAboutMac] = useState(false);
  const systemButton = useRef(null);
  const [now, setNow] = useState(new Date());
  const dockButtons = useRef({});
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const nextLayer = (current) =>
    Math.max(0, ...current.map((item) => item.layer)) + 1;

  function openWindow(entry) {
    setWindows((current) => {
      const next = { ...entry, minimized: false, layer: nextLayer(current) };
      return current.some((item) => item.id === entry.id)
        ? current.map((item) => (item.id === entry.id ? next : item))
        : [...current, next];
    });
    setActive(entry.id);
  }

  function openApp(id) {
    openWindow({ id });
  }

  function openGame(game) {
    const id = `game-${game.id}`;
    openWindow({ id, game });
  }

  function focusApp(id) {
    // Raise with z-index instead of moving DOM nodes. Reordering a captured
    // title bar in the DOM can cancel a finger drag on a background window.
    setWindows((current) => {
      const layer = nextLayer(current);
      return current.map((item) =>
        item.id === id ? { ...item, layer } : item,
      );
    });
    setActive(id);
  }

  function closeApp(id) {
    setWindows((current) => current.filter((window) => window.id !== id));
    setActive((current) => (current === id ? "" : current));
    dockButtons.current[id.startsWith("game-") ? "games" : id]?.focus();
  }

  function minimizeApp(id) {
    setWindows((current) =>
      current.map((window) =>
        window.id === id ? { ...window, minimized: true } : window,
      ),
    );
    setActive((current) => (current === id ? "" : current));
    dockButtons.current[id.startsWith("game-") ? "games" : id]?.focus();
  }

  return (
    <div className="desktop-studio">
      {/* The physical frame surrounds the existing interactive desktop; app coordinates stay inside its screen. */}
      <div className="imac-computer">
        <div className="imac-screen-shell">
          <span className="imac-camera" aria-hidden="true" />
          <div className="desktop-site">
            <header className="desktop-menubar">
              <MacMenu
                buttonRef={systemButton}
                onAbout={() => setAboutMac(true)}
              />
              <strong>Masyn’s Mac</strong>
              <span className="desktop-menu-caption">
                Explore. Open. Discover.
              </span>
              <div className="desktop-menu-right">
                <Wifi aria-hidden="true" />
                <BatteryFull aria-hidden="true" />
                <time dateTime={now.toISOString()}>
                  {now.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  <span>
                    {now.toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </time>
              </div>
            </header>
            <main
              className="desktop-workspace"
              aria-label="Interactive portfolio desktop"
            >
              <div className="desktop-wallpaper" aria-hidden="true">
                <span>
                  Think differently.
                  <br />
                  <em>Build personally.</em>
                </span>
                <div className="desktop-wallpaper-loop" />
              </div>
              <div className="desktop-shortcuts">
                {apps
                  .filter((app) => ["projects", "resume"].includes(app.id))
                  .map((app) => (
                    <button key={app.id} onClick={() => openApp(app.id)}>
                      <app.Icon aria-hidden="true" />
                      <span>{app.title}</span>
                    </button>
                  ))}
                <a
                  href="https://github.com/MasynNay"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github aria-hidden="true" />
                  <span>GitHub ↗</span>
                </a>
              </div>
              {windows.map((window) => (
                <DesktopWindow
                  key={window.id}
                  app={
                    window.game
                      ? {
                          id: window.id,
                          title: window.game.name,
                          Icon: Controller,
                          largePlayer: window.game.largePlayer,
                        }
                      : apps.find((app) => app.id === window.id)
                  }
                  minimized={window.minimized}
                  active={active === window.id}
                  stack={window.layer}
                  onFocus={() => focusApp(window.id)}
                  onClose={() => closeApp(window.id)}
                  onMinimize={() => minimizeApp(window.id)}
                >
                  {window.id === "games" && <GamesApp onOpen={openGame} />}
                  {window.game && <GamePlayer game={window.game} />}
                  {window.id === "photos" && (
                    <PhotosApp
                      active={active === "photos" && !window.minimized}
                    />
                  )}
                  {window.id === "typing" && (
                    <TypingTest
                      active={active === "typing" && !window.minimized}
                    />
                  )}
                  {window.id === "about" && (
                    <div className="desktop-about">
                      <div className="desktop-avatar" aria-hidden="true">
                        <BrandMark size="avatar" decorative />
                      </div>
                      <span className="desktop-kicker">
                        A HUMAN BEHIND THE SCREEN
                      </span>
                      <h1>Hey, I’m Masyn.</h1>
                      <p className="desktop-about-role">{profile.headline}</p>
                      <p>{profile.introduction}</p>
                      <p>{profile.interestsIntroduction}</p>
                      <div className="desktop-about-actions">
                        <button onClick={() => openApp("projects")}>
                          Explore my portfolio ↗
                        </button>
                        <button onClick={() => openApp("contact")}>
                          Say hello
                        </button>
                      </div>
                      <p className="desktop-window-tip">
                        Make yourself at home. Open an app from the dock below.
                      </p>
                    </div>
                  )}
                  {window.id === "projects" && (
                    <div className="desktop-projects glass-site">
                      <Projects glass />
                    </div>
                  )}
                  {window.id === "skills" && (
                    <div className="desktop-skills">
                      <span className="desktop-terminal-path">
                        masyn@portfolio ~ skills
                      </span>
                      <h2>The toolkit</h2>
                      <p>
                        Learning is a lifelong project. Here’s what I work with.
                      </p>
                      {skills.map((skill) => (
                        <section key={skill.title}>
                          <h3>
                            <span>→</span> {skill.title}
                          </h3>
                          <p>{skill.detail}</p>
                        </section>
                      ))}
                      <span
                        className="desktop-terminal-cursor"
                        aria-hidden="true"
                      >
                        ▌
                      </span>
                    </div>
                  )}
                  {window.id === "resume" && (
                    <div className="desktop-resume">
                      <ResumePage />
                    </div>
                  )}
                  {window.id === "contact" && (
                    <div className="desktop-contact glass-site">
                      <p>Have something in mind? Let’s talk.</p>
                      <a href="mailto:MasynNay33@gmail.com">
                        MasynNay33@gmail.com ↗
                      </a>
                      <Contact />
                    </div>
                  )}
                </DesktopWindow>
              ))}
              {windows.every((window) => window.minimized) && (
                <div className="desktop-empty">
                  <p>Click an icon on the dock to try it out!</p>
                </div>
              )}
            </main>
            <nav className="desktop-dock" aria-label="Portfolio apps">
              {apps.map((app) => (
                <button
                  key={app.id}
                  ref={(node) => {
                    dockButtons.current[app.id] = node;
                  }}
                  onClick={() => openApp(app.id)}
                  aria-label={`Open ${app.title}`}
                  aria-pressed={active === app.id}
                  className={
                    windows.some((window) => window.id === app.id)
                      ? "app-running"
                      : ""
                  }
                >
                  <span className="dock-tooltip">{app.title}</span>
                  <span className={`desktop-app-icon icon-${app.color}`}>
                    <app.Icon aria-hidden="true" />
                  </span>
                  <i />
                </button>
              ))}
              <span className="desktop-dock-divider" />
              <Link to="/design/glass" aria-label="Return to main website">
                <span className="dock-tooltip">Website</span>
                <span className="desktop-app-icon icon-teal">
                  <ArrowLeft aria-hidden="true" />
                </span>
              </Link>
            </nav>
            {aboutMac && (
              <AboutMac
                returnFocusRef={systemButton}
                onClose={() => setAboutMac(false)}
              />
            )}
          </div>
        </div>
        <div className="imac-chin" aria-hidden="true">
          <Apple />
        </div>
        <div className="imac-stand" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}

function DesktopWindow({
  app,
  children,
  active,
  minimized,
  stack,
  onFocus,
  onClose,
  onMinimize,
}) {
  const initialPosition = {
    x:
      app.id === "typing"
        ? 40
        : 90 + apps.findIndex((item) => item.id === app.id) * 25,
    y:
      app.id === "typing"
        ? 24
        : 42 + apps.findIndex((item) => item.id === app.id) * 22,
  };
  // Canvas-heavy games open at the largest size inside the iMac bezel. Their
  // green window control still restores the ordinary draggable window.
  const [maximized, setMaximized] = useState(!!app.largePlayer);
  const windowRef = useRef(null);
  const { position, dragging, titlebarProps } = useWindowDrag(
    windowRef,
    maximized || minimized,
  );

  useEffect(() => {
    if (
      active &&
      !minimized &&
      !windowRef.current?.contains(document.activeElement)
    )
      windowRef.current?.focus({ preventScroll: true });
  }, [active, minimized]);

  return (
    <section
      ref={windowRef}
      role="dialog"
      aria-label={app.title}
      tabIndex={-1}
      hidden={minimized}
      className={`desktop-window ${app.largePlayer ? "window-large-game" : ""} ${active ? "window-active" : ""} ${maximized ? "window-maximized" : ""} ${dragging ? "window-dragging" : ""}`}
      style={{
        "--window-start-x": `${initialPosition.x}px`,
        "--window-start-y": `${initialPosition.y}px`,
        "--window-x": position ? `${position.x}px` : undefined,
        "--window-y": position ? `${position.y}px` : undefined,
        zIndex: 10 + stack,
      }}
      onPointerDown={() => {
        if (!active) onFocus();
      }}
      onFocusCapture={() => {
        if (!active) onFocus();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        className="desktop-window-titlebar"
        role="toolbar"
        tabIndex={0}
        aria-label={`${app.title} title bar. Drag to move, or use arrow keys when focused.`}
        {...titlebarProps}
        onDoubleClick={(event) => {
          if (!event.target.closest("button")) setMaximized(!maximized);
        }}
      >
        <div className="desktop-window-controls">
          <button
            className="window-close"
            aria-label={`Close ${app.title}`}
            onClick={onClose}
          >
            ×
          </button>
          <button
            className="window-minimize"
            aria-label={`Minimize ${app.title}`}
            onClick={onMinimize}
          >
            −
          </button>
          <button
            className="window-expand"
            aria-label={`${maximized ? "Restore" : "Maximize"} ${app.title}`}
            aria-pressed={maximized}
            onClick={() => setMaximized(!maximized)}
          >
            ↗
          </button>
        </div>
        <span>
          <app.Icon size={14} /> {app.title}
        </span>
        <span className="desktop-window-mode">DARK MODE</span>
      </div>
      <div className="desktop-window-body">{children}</div>
    </section>
  );
}
