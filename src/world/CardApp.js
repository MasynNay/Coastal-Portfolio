import { useRef } from "react";

// Shared frame keeps the navigation outside the scrolling content. On a phone,
// this fills the modal viewport, so controls never cover a card or disappear below it.
export function CardApp({ children, active, state, onNavigate, onBack }) {
  const bagCount = Object.values(state.packs).reduce((sum, n) => sum + n, 0);
  return (
    <section className="card-app">
      <div className="card-app-main" key={active}>
        {onBack && (
          <button
            className="card-inventory-link card-inventory-return"
            onClick={onBack}
          >
            ← Inventory
          </button>
        )}
        {children}
      </div>
      <nav className="card-app-nav" aria-label="Card collection navigation">
        {[
          ["shop", "Shop", "M4 9h16l-2-5H6L4 9Zm1 0v11h14V9M9 20v-7h6v7"],
          ["packs", "Packs", "M6 3h12v18H6zM6 7h12M6 17h12M10 10h4v4h-4z"],
          ["album", "Binder", "M4 3h16v18H4zM8 3v18M11 7h6M11 11h6M11 15h6"],
        ].map(([id, label, path]) => (
          <button
            key={id}
            aria-current={active === id ? "page" : undefined}
            onClick={() => onNavigate(id)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={path} />
            </svg>
            <span>
              {label}
              {id === "packs" && bagCount > 0 && <b>{bagCount}</b>}
            </span>
          </button>
        ))}
      </nav>
    </section>
  );
}

// Horizontal gestures advance a page/card; vertical movement remains native
// scrolling. Suppress the following click only after a completed swipe, avoiding
// the double advance that otherwise happens on touch release.
export function useCardSwipe(onSwipe) {
  const start = useRef(null),
    swiped = useRef(false);
  return {
    onPointerDown: (e) => {
      swiped.current = false;
      if (e.button === 0) e.currentTarget.setPointerCapture?.(e.pointerId);
      start.current = e.button === 0 ? { x: e.clientX, y: e.clientY } : null;
    },
    onPointerUp: (e) => {
      const origin = start.current;
      start.current = null;
      if (!origin) return;
      const dx = e.clientX - origin.x,
        dy = e.clientY - origin.y;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        swiped.current = true;
        onSwipe(dx < 0 ? 1 : -1);
      }
    },
    onPointerCancel: () => {
      start.current = null;
    },
    onClickCapture: (e) => {
      if (swiped.current) {
        e.preventDefault();
        e.stopPropagation();
        swiped.current = false;
      }
    },
  };
}
