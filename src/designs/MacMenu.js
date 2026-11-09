import BrandMark from "../components/BrandMark";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Apple } from "react-bootstrap-icons";
import useDialogFocus from "../hooks/useDialogFocus";
import "./MacMenu.css";

// The Apple control is a real menu, independent of dock apps and their windows.
// Dismissal and keyboard focus follow the same rules as a small system menu.
export function MacMenu({ onAbout, onAppearance, buttonRef }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null),
    menu = useRef(null);
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector('[role="menuitem"]')?.focus();
    const outside = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  function keys(e) {
    if (e.key === "Tab") {
      // Return to the trigger before normal Tab traversal; removed menu items
      // must not send focus to the page body.
      buttonRef.current?.focus();
      setOpen(false);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const items = [...menu.current.querySelectorAll('[role="menuitem"]')];
    const i = items.indexOf(document.activeElement);
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? items.length - 1
          : (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) %
            items.length;
    items[next]?.focus();
  }
  return (
    <div className="mac-system" ref={root}>
      <button
        className="mac-system-toggle"
        ref={buttonRef}
        aria-label="Open system menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="mac-system-menu"
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <Apple size={18} aria-hidden="true" />
      </button>
      {open && (
        <div
          className="mac-system-menu"
          id="mac-system-menu"
          role="menu"
          aria-label="System menu"
          ref={menu}
          onKeyDown={keys}
        >
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onAbout();
            }}
          >
            About this Mac
          </button>
          {onAppearance && (
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onAppearance();
              }}
            >
              Change Wallpaper &amp; Bezel…
            </button>
          )}
          <div className="mac-system-separator" role="separator" />
          <Link
            role="menuitem"
            to="/design/glass"
            onClick={() => setOpen(false)}
          >
            Back to Main Site
          </Link>
          <Link role="menuitem" to="/world" onClick={() => setOpen(false)}>
            Game Mode
          </Link>
        </div>
      )}
    </div>
  );
}

// This lighthearted spec panel belongs to Masyn's Mac, not the portfolio's
// existing About app. It doesn't create a second dock icon or change app state.
export function AboutMac({ onClose, returnFocusRef }) {
  const panel = useRef(null);
  useDialogFocus(panel, onClose, returnFocusRef);
  const specs = [
    ["Processor", "Powered by caffeine"],
    ["Memory", "About the same as Dory the fish"],
    ["Storage", "About 150 lbs of FAT32"],
    ["Graphics", "Dad jokes rendered in 4K"],
    ["System", "MasynOS · Always learning"],
    ["Serial number", "MN-MTNDEW-REPEAT"],
  ];
  return (
    <div
      className="mac-about-scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={panel}
        tabIndex={-1}
        className="mac-about-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mac-about-title"
      >
        <header>
          <button
            className="mac-about-close"
            aria-label="Close About this Mac"
            onClick={() => onClose()}
          >
            ×
          </button>
          <span>About this Mac</span>
        </header>
        <div className="mac-about-content">
          <div className="mac-about-machine" aria-hidden="true">
            <div className="mac-about-display">
              <BrandMark size="screen" decorative />
            </div>
            <div className="mac-about-chin">
              <Apple size={9} />
            </div>
            <div className="mac-about-stand" />
          </div>
          <h1 id="mac-about-title">Masyn</h1>
          <p className="mac-about-edition">Human hardware. Always curious.</p>
          <dl>
            {specs.map(([name, value]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mac-about-note">
            Runs best with family time, a good book or podcast, and an
            occasional snack break.
          </p>
        </div>
      </section>
    </div>
  );
}
