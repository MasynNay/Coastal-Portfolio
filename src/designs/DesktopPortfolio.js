import { SystemIcon } from "./WorkspaceSystem";
import WorkspacePanel, {
  AppGlyph,
  ChromeButton,
  StartButton,
  SystemWallpaper,
  WorkspaceTray,
  WorkspaceWidgets,
} from "./WorkspaceChrome";
import { links } from "../data/links";
import BrandMark from "../components/BrandMark";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Person,
  Folder2Open,
  Terminal,
  FileEarmarkText,
  Envelope,
  ArrowLeft,
  Github,
  Controller,
  Images,
  Keyboard,
  Flower1,
  Search,
  LayoutWtf,
} from "react-bootstrap-icons";
import { Projects } from "../components/Projects";
import { Contact } from "../components/Contact";
import ResumePage from "../pages/ResumePage";
import { skills } from "./content";
import { profile } from "../data/resume";
import MacAppearance, {
  appearanceStyle,
  readAppearance,
  saveAppearance,
} from "./MacAppearance";
import { MacMenu, AboutMac } from "./MacMenu";
import { GamesApp, GamePlayer, PhotosApp } from "./MacApps";
import TypingTest from "../typing/TypingTest";
import AsciiApp from "../ascii/AsciiStudio";
import useWindowDrag from "../hooks/useWindowDrag";
import "./glass.css";
import "./desktop.css";
import "./Workspace.css";
import "./WorkspaceChrome.css";

const apps = [
  { id: "about", title: "Profile", Icon: Person, color: "blue" },
  { id: "projects", title: "Portfolio", Icon: Folder2Open, color: "folder" },
  { id: "skills", title: "Skills", Icon: Terminal, color: "black" },
  { id: "resume", title: "Resume", Icon: FileEarmarkText, color: "paper" },
  { id: "contact", title: "Contact", Icon: Envelope, color: "mail" },
  { id: "typing", title: "Typing Test", Icon: Keyboard, color: "teal" },
  { id: "ascii", title: "ASCII", Icon: Flower1, color: "ascii" },
  { id: "games", title: "Games", Icon: Controller, color: "blue" },
  { id: "photos", title: "Photos", Icon: Images, color: "folder" },
];

export function DesktopPortfolio() {
  const [windows, setWindows] = useState([]);
  const [active, setActive] = useState("");
  const [aboutMac, setAboutMac] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [appearance, setAppearance] = useState(readAppearance);
  const [shellPanel, setShellPanel] = useState(null);
  const [recent, setRecent] = useState([]);
  const system = appearance.system || "mac";
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
    setRecent((current) =>
      [id, ...current.filter((item) => item !== id)].slice(0, 6),
    );
    openWindow({ id });
  }

  function changeAppearance(next) {
    setAppearance(next);
    saveAppearance(next);
  }

  function restoreWindow(id) {
    setWindows((current) =>
      current.map((w) =>
        w.id === id ? { ...w, minimized: false, layer: nextLayer(current) } : w,
      ),
    );
    setActive(id);
  }

  function showDesktop() {
    setWindows((current) => current.map((w) => ({ ...w, minimized: true })));
    setActive("");
  }

  const togglePanel = (panel) =>
    setShellPanel((current) => (current === panel ? null : panel));

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
    <div
      className="desktop-studio"
      data-system={system}
      data-motion={appearance.motion !== false}
      data-wallpaper={appearance.wallpaper}
      data-bezel={appearance.bezel}
      style={{
        ...appearanceStyle(appearance),
        "--workspace-brightness": appearance.brightness ?? 1,
      }}
    >
      {/* The physical frame surrounds the existing interactive desktop; app coordinates stay inside its screen. */}
      <div className="imac-computer">
        <div className="imac-screen-shell">
          <span className="imac-camera" aria-hidden="true" />
          <div className="desktop-site">
            <header className="desktop-menubar">
              {(appearance.system || "mac") === "mac" && (
                <MacMenu
                  system="mac"
                  buttonRef={systemButton}
                  onAbout={() => setAboutMac(true)}
                  onAppearance={() => setAppearanceOpen(true)}
                />
              )}
              {system === "ubuntu" ? (
                <ChromeButton
                  label="Open Activities"
                  onClick={() => togglePanel("windows")}
                  expanded={shellPanel === "windows"}
                >
                  Activities
                </ChromeButton>
              ) : (
                <strong>
                  {apps.find((app) => app.id === active)?.title || "Finder"}
                </strong>
              )}
              {system === "mac" && (
                <nav
                  className="workspace-mac-menus"
                  aria-label="Mac application menus"
                >
                  <ChromeButton
                    label="Open Applications"
                    onClick={() => togglePanel("launch")}
                  >
                    Go
                  </ChromeButton>
                  <ChromeButton
                    label="Open Windows"
                    onClick={() => togglePanel("windows")}
                  >
                    Window
                  </ChromeButton>
                  <ChromeButton
                    label="Customize Workspace"
                    onClick={() => setAppearanceOpen(true)}
                  >
                    View
                  </ChromeButton>
                </nav>
              )}
              <div className="desktop-menu-right">
                <WorkspaceTray
                  now={now}
                  system={system}
                  onOpen={togglePanel}
                  panel={shellPanel}
                />
              </div>
            </header>
            <main
              className="desktop-workspace"
              aria-label="Interactive portfolio desktop"
            >
              <div className="desktop-wallpaper" aria-hidden="true">
                {appearance.wallpaper === "ocean" && (
                  <SystemWallpaper system={system} />
                )}
                <div className="desktop-wallpaper-loop" />
                <div className="workspace-wallpaper-dim" />
              </div>
              <div className="desktop-shortcuts">
                {apps
                  .filter((app) =>
                    ["projects", "resume", "about"].includes(app.id),
                  )
                  .map((app) => (
                    <button key={app.id} onClick={() => openApp(app.id)}>
                      <AppGlyph app={app} />
                      <span>{app.title}</span>
                    </button>
                  ))}
                <a href={links.github} target="_blank" rel="noreferrer">
                  <Github aria-hidden="true" />
                  <span>GitHub ↗</span>
                </a>
              </div>
              {appearance.widgets !== false && (
                <WorkspaceWidgets
                  system={system}
                  now={now}
                  windows={windows}
                  onOpen={togglePanel}
                  onApp={openApp}
                />
              )}
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
                  {window.id === "ascii" && (
                    <AsciiApp
                      active={active === "ascii" && !window.minimized}
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
                      <h1>Masyn Nay</h1>
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
                      <a href={`mailto:${profile.email}`}>{profile.email} ↗</a>
                      <Contact />
                    </div>
                  )}
                </DesktopWindow>
              ))}
              {windows.every((window) => window.minimized) && (
                <div className="desktop-empty">
                  <p>
                    {system === "windows"
                      ? "Open Start to explore the portfolio."
                      : system === "ubuntu"
                        ? "Open Applications to explore the portfolio."
                        : "Click an icon on the dock to try it out!"}
                  </p>
                </div>
              )}
            </main>
            <nav className="desktop-dock" aria-label="Portfolio apps">
              {system !== "mac" && (
                <StartButton
                  system={system}
                  onClick={() => togglePanel("launch")}
                  expanded={shellPanel === "launch"}
                />
              )}
              {system === "windows" && (
                <>
                  <ChromeButton
                    label="Search applications"
                    Icon={Search}
                    onClick={() => togglePanel("search")}
                    expanded={shellPanel === "search"}
                  />
                  <ChromeButton
                    label="Task View"
                    Icon={LayoutWtf}
                    onClick={() => togglePanel("windows")}
                    expanded={shellPanel === "windows"}
                  />
                </>
              )}
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
                  <AppGlyph app={app} />
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
            {system === "windows" && (
              <div className="workspace-windows-tray">
                <WorkspaceTray
                  now={now}
                  system={system}
                  onOpen={togglePanel}
                  panel={shellPanel}
                />
                <ChromeButton
                  label="Show desktop"
                  className="workspace-peek"
                  onClick={showDesktop}
                />
              </div>
            )}
            {shellPanel && (
              <WorkspacePanel
                key={`${system}-${shellPanel}`}
                panel={shellPanel}
                system={system}
                apps={apps}
                windows={windows}
                appearance={appearance}
                now={now}
                recent={recent}
                onClose={() => setShellPanel(null)}
                onApp={openApp}
                onWindow={restoreWindow}
                onAppearance={() => setAppearanceOpen(true)}
                onChange={changeAppearance}
                onAbout={() => setAboutMac(true)}
                onShowDesktop={showDesktop}
                onPanel={setShellPanel}
              />
            )}
            {appearanceOpen && (
              <MacAppearance
                value={appearance}
                returnFocusRef={systemButton}
                onClose={() => setAppearanceOpen(false)}
                onChange={changeAppearance}
              />
            )}
            {aboutMac && (
              <AboutMac
                system={appearance.system || "mac"}
                returnFocusRef={systemButton}
                onClose={() => setAboutMac(false)}
              />
            )}
          </div>
        </div>
        <div className="imac-chin" aria-hidden="true">
          <SystemIcon system={appearance.system || "mac"} />
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
      app.id === "typing" || app.id === "ascii"
        ? 40
        : 90 + apps.findIndex((item) => item.id === app.id) * 25,
    y:
      app.id === "typing" || app.id === "ascii"
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
      className={`desktop-window ${app.id === "ascii" ? "window-ascii" : ""} ${app.largePlayer ? "window-large-game" : ""} ${active ? "window-active" : ""} ${maximized ? "window-maximized" : ""} ${dragging ? "window-dragging" : ""}`}
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
        <span className="desktop-window-mode">WORKSPACE</span>
      </div>
      <div className="desktop-window-body">{children}</div>
    </section>
  );
}
