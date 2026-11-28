import { useEffect, useRef, useState } from "react";
import {
  Calendar3,
  Search,
  Grid3x3Gap,
  Gear,
  Sun,
  Moon,
  Clock,
  LayoutWtf,
  PersonCircle,
  Sliders,
  Stars,
  ChevronLeft,
  ChevronRight,
  X,
  Wifi,
  WifiOff,
} from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import useDialogFocus from "../hooks/useDialogFocus";
import { SystemIcon } from "./WorkspaceSystem";

// Every launcher, search result and running-window shortcut opens the same
// portfolio app. System controls affect only this browser workspace.
export function AppGlyph({ app }) {
  return (
    <span className={`desktop-app-icon icon-${app.color}`}>
      <app.Icon aria-hidden="true" />
    </span>
  );
}

export function ChromeButton({
  label,
  Icon,
  onClick,
  expanded,
  children,
  buttonRef,
  className = "",
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`workspace-chrome-button ${className}`}
      aria-label={label}
      aria-expanded={expanded}
      onClick={onClick}
    >
      {Icon && <Icon aria-hidden="true" />}
      {children}
    </button>
  );
}

export function StartButton({ system, onClick, expanded }) {
  return (
    <ChromeButton
      className="workspace-start"
      label={system === "windows" ? "Open Start" : "Show Applications"}
      expanded={expanded}
      onClick={onClick}
    >
      {system === "windows" ? (
        <SystemIcon system="windows" size={24} />
      ) : (
        <Grid3x3Gap size={23} />
      )}
    </ChromeButton>
  );
}

export function WorkspaceTray({ now, system, onOpen, panel }) {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  return (
    <div className="workspace-tray">
      {system === "mac" && (
        <ChromeButton
          label="Spotlight Search"
          Icon={Search}
          expanded={panel === "search"}
          onClick={() => onOpen("search")}
        />
      )}
      <ChromeButton
        label="Quick Settings"
        Icon={Sliders}
        expanded={panel === "quick"}
        onClick={() => onOpen("quick")}
      >
        {online ? (
          <Wifi title="Browser online" />
        ) : (
          <WifiOff title="Browser offline" />
        )}
      </ChromeButton>
      <ChromeButton
        label="Open Calendar"
        expanded={panel === "calendar"}
        onClick={() => onOpen("calendar")}
      >
        <span className="workspace-tray-clock">
          <time dateTime={now.toISOString()}>
            {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </time>
          <small>
            {now.toLocaleDateString([], { month: "short", day: "numeric" })}
          </small>
        </span>
      </ChromeButton>
    </div>
  );
}

// Desktop widgets reflect the real local date and the user's current session.
// They are intentionally separate from the portfolio windows and hide on phones.
export function WorkspaceWidgets({ system, now, windows, onOpen, onApp }) {
  return (
    <aside className="workspace-widgets" aria-label="Workspace widgets">
      <button
        className="workspace-date-widget"
        onClick={() => onOpen("calendar")}
      >
        <small>{now.toLocaleDateString([], { weekday: "long" })}</small>
        <strong>{now.getDate()}</strong>
        <span>
          {now.toLocaleDateString([], { month: "long", year: "numeric" })}
        </span>
      </button>
      <button
        className="workspace-feature-widget"
        onClick={() => onApp("projects")}
      >
        <span className="workspace-widget-eyebrow">
          <Stars /> Featured Work
        </span>
        <strong>Anything Plays</strong>
        <span>Explore the camera-controlled gaming studio.</span>
        <img
          src="/images/projects/anything-plays-ocarina.webp"
          alt="Anything Plays project interface"
          loading="lazy"
        />
      </button>
      <button
        className="workspace-session-widget"
        onClick={() => onOpen("windows")}
      >
        <LayoutWtf />
        <span>
          <strong>
            {windows.length} {windows.length === 1 ? "app" : "apps"} open
          </strong>
          <small>
            {system === "ubuntu"
              ? "Activities overview"
              : system === "windows"
                ? "Task view"
                : "Window overview"}
          </small>
        </span>
      </button>
    </aside>
  );
}

function CalendarPanel({ now }) {
  const [offset, setOffset] = useState(0);
  const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const start = month.getDay(),
    days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return (
    <div className="workspace-calendar">
      <div className="workspace-calendar-day">
        <Calendar3 aria-hidden="true" />
        <strong>
          {now.toLocaleDateString([], {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </strong>
      </div>
      <div className="workspace-calendar-heading">
        <button
          aria-label="Previous month"
          onClick={() => setOffset((n) => n - 1)}
        >
          <ChevronLeft />
        </button>
        <strong>
          {month.toLocaleDateString([], { month: "long", year: "numeric" })}
        </strong>
        <button aria-label="Next month" onClick={() => setOffset((n) => n + 1)}>
          <ChevronRight />
        </button>
      </div>
      <div className="workspace-calendar-grid">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <small key={d}>{d}</small>
        ))}
        {Array.from({ length: start + days }, (_, i) =>
          i < start ? (
            <span key={i} />
          ) : (
            <span
              key={i}
              data-today={offset === 0 && i - start + 1 === now.getDate()}
            >
              {i - start + 1}
            </span>
          ),
        )}
      </div>
      <button className="workspace-calendar-today" onClick={() => setOffset(0)}>
        Today
      </button>
    </div>
  );
}

export default function WorkspacePanel({
  panel,
  system,
  apps,
  windows,
  now,
  appearance,
  recent,
  onClose,
  onApp,
  onWindow,
  onAppearance,
  onChange,
  onAbout,
  onShowDesktop,
  onPanel,
}) {
  const ref = useRef(null),
    [query, setQuery] = useState(""),
    [allApps, setAllApps] = useState(false);
  useDialogFocus(ref, onClose);
  const launcher = panel === "launch" || panel === "search";
  const matches = apps.filter((a) =>
    `${a.title} ${a.id}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const heading =
    panel === "quick"
      ? system === "mac"
        ? "Control Center"
        : "Quick Settings"
      : panel === "calendar"
        ? "Calendar"
        : panel === "windows"
          ? system === "ubuntu"
            ? "Activities"
            : "Window Overview"
          : system === "windows"
            ? "Start"
            : system === "ubuntu"
              ? "Applications"
              : "Spotlight";
  const act = (fn) => () => {
    onClose();
    fn();
  };
  return (
    <div
      className={`workspace-panel-backdrop panel-${panel}`}
      onPointerDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        tabIndex={-1}
        className={`workspace-shell-panel shell-${panel}`}
      >
        <header>
          <div>
            <small>
              {system === "windows"
                ? "WINDOWS 11 WORKSPACE"
                : system === "ubuntu"
                  ? "UBUNTU WORKSPACE"
                  : "MAC WORKSPACE"}
            </small>
            <h2>{heading}</h2>
          </div>
          <button
            className="workspace-panel-close"
            aria-label={`Close ${heading}`}
            onClick={onClose}
          >
            <X />
          </button>
        </header>
        {launcher && (
          <>
            <label className="workspace-search">
              <Search aria-hidden="true" />
              <input
                autoComplete="off"
                placeholder={
                  system === "mac" ? "Spotlight Search" : "Search apps"
                }
                aria-label="Search portfolio apps"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && matches.length) {
                    e.preventDefault();
                    onClose();
                    onApp(matches[0].id);
                  }
                }}
              />
            </label>
            <div className="workspace-launch-heading">
              <h3>
                {query
                  ? "Search Results"
                  : system === "windows"
                    ? allApps
                      ? "All Apps"
                      : "Pinned"
                    : "Applications"}
              </h3>
              {system === "windows" && !query && (
                <button onClick={() => setAllApps((v) => !v)}>
                  {allApps ? "Pinned Apps" : "All Apps"}
                </button>
              )}
            </div>
            <div className="workspace-launch-grid">
              {(allApps
                ? [...matches].sort((a, b) => a.title.localeCompare(b.title))
                : matches
              ).map((app) => (
                <button key={app.id} onClick={act(() => onApp(app.id))}>
                  <AppGlyph app={app} />
                  <span>{app.title}</span>
                </button>
              ))}
            </div>
            {!matches.length && <p>No matching portfolio apps.</p>}
            {system === "windows" && !query && (
              <>
                <h3>Recommended</h3>
                <div className="workspace-recent">
                  {(recent.length ? recent : ["projects", "resume", "games"])
                    .slice(0, 3)
                    .map((id) => {
                      const app = apps.find((a) => a.id === id);
                      return (
                        app && (
                          <button key={id} onClick={act(() => onApp(id))}>
                            <AppGlyph app={app} />
                            <span>
                              {app.title}
                              <small>
                                {recent.includes(id)
                                  ? "Recently opened"
                                  : "Explore the portfolio"}
                              </small>
                            </span>
                          </button>
                        )
                      );
                    })}
                </div>
              </>
            )}
            <footer className="workspace-panel-footer">
              <span>
                <PersonCircle aria-hidden="true" /> Masyn Nay
              </span>
              <button onClick={act(onAppearance)}>
                <Gear /> Settings
              </button>
              <Link to="/world">Game Mode</Link>
              <Link to="/design/glass">Website</Link>
            </footer>
          </>
        )}
        {panel === "windows" && (
          <>
            <p>Choose an open app to bring it forward.</p>
            <div className="workspace-running-grid">
              {windows.map((w) => {
                const app = apps.find((a) => a.id === w.id) || {
                  title: w.game?.name || "Game",
                  Icon: LayoutWtf,
                  color: "blue",
                };
                return (
                  <button key={w.id} onClick={act(() => onWindow(w.id))}>
                    <div className="workspace-mini-window">
                      <AppGlyph app={app} />
                      <span>{app.title}</span>
                    </div>
                    <small>{w.minimized ? "Minimized" : "Open"}</small>
                  </button>
                );
              })}
            </div>
            {!windows.length && <p>No apps open yet.</p>}
            <div className="workspace-overview-actions">
              <button onClick={() => onPanel("launch")}>
                Show Applications
              </button>
              <button onClick={act(onShowDesktop)}>Show Desktop</button>
            </div>
          </>
        )}
        {panel === "quick" && (
          <>
            <div className="workspace-quick-grid">
              <button onClick={act(onAppearance)}>
                <Gear /> Personalization
              </button>
              <button
                aria-pressed={appearance.motion !== false}
                onClick={() =>
                  onChange({
                    ...appearance,
                    motion: appearance.motion === false,
                  })
                }
              >
                <Sun /> Wallpaper Motion
              </button>
              <button
                aria-pressed={appearance.brightness < 0.8}
                onClick={() =>
                  onChange({
                    ...appearance,
                    brightness: appearance.brightness < 0.8 ? 1 : 0.55,
                  })
                }
              >
                <Moon /> Dim Wallpaper
              </button>
              <button onClick={act(onAbout)}>
                <PersonCircle /> About This Workspace
              </button>
              <button
                aria-pressed={appearance.widgets !== false}
                onClick={() =>
                  onChange({
                    ...appearance,
                    widgets: appearance.widgets === false,
                  })
                }
              >
                <Grid3x3Gap /> Desktop Widgets
              </button>
              <button onClick={() => onPanel("windows")}>
                <LayoutWtf /> Window Overview
              </button>
            </div>
            <label className="workspace-brightness">
              <Sun aria-hidden="true" /> Wallpaper Brightness
              <input
                aria-label="Wallpaper brightness"
                type="range"
                min=".35"
                max="1"
                step=".05"
                value={appearance.brightness ?? 1}
                onChange={(e) =>
                  onChange({
                    ...appearance,
                    brightness: Number(e.target.value),
                  })
                }
              />
            </label>
            <div className="workspace-quick-info">
              <Clock />{" "}
              {now.toLocaleDateString([], {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>
            <p className="workspace-panel-note">
              These controls customize the portfolio on this device.
            </p>
          </>
        )}
        {panel === "calendar" && <CalendarPanel now={now} />}
      </section>
    </div>
  );
}

// Original, text-free vector wallpapers are rendered at the screen's aspect
// ratio. Neither app names nor promotional copy are baked into the artwork.
export function SystemWallpaper({ system }) {
  return (
    <svg
      className="workspace-system-wallpaper"
      viewBox="0 0 1200 720"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {system === "mac" ? (
        <>
          <defs>
            <linearGradient id="mac-sky" x2=".2" y2="1">
              <stop stopColor="#b6e1d9" />
              <stop offset=".5" stopColor="#72b9cc" />
              <stop offset="1" stopColor="#5489ad" />
            </linearGradient>
            <linearGradient id="mac-ridge" x1="0" y1="0" x2="1" y2=".8">
              <stop stopColor="#c2dad0" />
              <stop offset=".48" stopColor="#6296a2" />
              <stop offset="1" stopColor="#304f79" />
            </linearGradient>
            <linearGradient id="mac-valley" x1="0" y1="0" x2=".9" y2="1">
              <stop stopColor="#4f9e9d" />
              <stop offset=".5" stopColor="#295a79" />
              <stop offset="1" stopColor="#152644" />
            </linearGradient>
            <linearGradient id="mac-water" x2=".75" y2="1">
              <stop stopColor="#86cccb" />
              <stop offset=".52" stopColor="#337b9a" />
              <stop offset="1" stopColor="#242b5e" />
            </linearGradient>
            <radialGradient id="mac-light">
              <stop stopColor="#fff5dd" stopOpacity=".65" />
              <stop offset="1" stopColor="#fff5dd" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d="M0 0H1200V720H0Z" fill="url(#mac-sky)" />
          <ellipse cx="950" cy="110" rx="620" ry="320" fill="url(#mac-light)" />
          <path
            d="M0 435C156 381 215 238 381 228C527 219 599 331 713 281C881 209 930 91 1200 115V720H0Z"
            fill="url(#mac-ridge)"
          />
          <path
            d="M0 458C184 407 303 478 443 383C610 270 692 250 812 338C971 454 1062 291 1200 273V720H0Z"
            fill="#376987"
            opacity=".72"
          />
          <path
            d="M0 420C183 372 244 299 348 307C508 320 563 470 699 452C856 432 997 350 1200 392V720H0Z"
            fill="url(#mac-valley)"
          />
          <path
            d="M0 597C237 437 327 493 496 540C675 591 724 511 883 477C1025 446 1134 510 1200 473V720H0Z"
            fill="url(#mac-water)"
          />
          <path
            d="M0 662C273 569 359 658 593 612C830 565 1027 535 1200 604V720H0Z"
            fill="#162d55"
            opacity=".45"
          />
          <path
            d="M0 595C236 456 339 512 500 553C674 601 744 514 884 480C1023 454 1138 510 1200 475"
            stroke="#c8eee1"
            opacity=".34"
            fill="none"
            strokeWidth="2"
          />
        </>
      ) : system === "windows" ? (
        <>
          <defs>
            <linearGradient id="win-fold" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#c2eaff" />
              <stop offset=".32" stopColor="#4b9bff" />
              <stop offset=".72" stopColor="#1946a5" />
              <stop offset="1" stopColor="#071d59" />
            </linearGradient>
            <linearGradient id="win-fold-dark" x1="1" y1="0" x2="0" y2="1">
              <stop stopColor="#83c7ff" />
              <stop offset=".55" stopColor="#205ec2" />
              <stop offset="1" stopColor="#081539" />
            </linearGradient>
            <radialGradient id="win-halo" cx=".66" cy=".45" r=".7">
              <stop stopColor="#347dcc" />
              <stop offset=".8" stopColor="#0a2458" />
              <stop offset="1" stopColor="#071632" />
            </radialGradient>
          </defs>
          <path d="M0 0H1200V720H0Z" fill="url(#win-halo)" />
          <g className="workspace-bloom" transform="translate(80 -10)">
            <path
              d="M260 720C312 532 153 440 367 329C541 240 635 170 585 24C802 94 839 225 726 333C564 490 878 578 766 720Z"
              fill="url(#win-fold-dark)"
            />
            <path
              d="M500 760C297 646 317 517 474 427C682 309 820 260 740 33C996 183 936 363 722 469C569 544 624 658 890 741Z"
              fill="url(#win-fold)"
            />
            <path
              d="M500 760C297 646 317 517 474 427C682 309 820 260 740 33"
              stroke="#d4efff"
              strokeWidth="3"
              opacity=".42"
              fill="none"
            />
            <path
              d="M637 720C493 613 527 543 695 476C895 395 1027 203 941 86C1172 193 1081 445 855 537C747 581 750 651 1025 720Z"
              fill="url(#win-fold-dark)"
            />
            <path
              d="M691 720C633 625 713 565 899 514C1116 455 1180 303 1137 173C1269 353 1176 556 985 616C917 643 899 676 964 720Z"
              fill="url(#win-fold)"
            />
          </g>
        </>
      ) : (
        <>
          <defs>
            <linearGradient id="ubuntu-dune" x2="1" y2="1">
              <stop stopColor="#ee793e" />
              <stop offset="1" stopColor="#672245" />
            </linearGradient>
            <radialGradient id="ubuntu-sky" cx=".7" cy=".3" r=".85">
              <stop stopColor="#9c3460" />
              <stop offset="1" stopColor="#29162f" />
            </radialGradient>
          </defs>
          <path d="M0 0H1200V720H0Z" fill="url(#ubuntu-sky)" />
          <path d="M0 450 340 110 680 390 1200 20V720H0Z" fill="#62204f" />
          <path
            d="M0 560 400 235 780 490 1200 125V720H0Z"
            fill="url(#ubuntu-dune)"
          />
          <path d="M0 620 370 370 700 610 1200 298V720H0Z" fill="#3c1744" />
          <path d="M0 720 420 470 790 720Z" fill="#e96536" opacity=".45" />
          <circle cx="875" cy="230" r="118" fill="#f6a85d" opacity=".56" />
          <g fill="none" stroke="#ffb486" opacity=".36">
            <circle cx="875" cy="230" r="138" />
            <circle cx="875" cy="230" r="155" />
          </g>
          <g fill="none" stroke="#ffb486" strokeWidth="1.5" opacity=".18">
            <path d="M0 320 330 0M0 400 416 0M1200 480 890 720M1200 560 1040 720" />
            <path d="M0 688 310 410 490 583 780 325 1200 68" />
          </g>
        </>
      )}
    </svg>
  );
}
