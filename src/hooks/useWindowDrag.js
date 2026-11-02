import { useCallback, useLayoutEffect, useRef, useState } from "react";

// Mac app windows share one pointer path for fingers, pens and mice. Measure
// their actual CSS layout so responsive positions never jump on first contact.
export default function useWindowDrag(windowRef, disabled = false) {
  const [position, setPosition] = useState(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);

  const geometry = useCallback(() => {
    const node = windowRef.current;
    if (!node) return null;
    const area = node.parentElement;
    const workspace = area.getBoundingClientRect();
    const bounds = node.getBoundingClientRect();
    if (!workspace.width || !workspace.height || !bounds.width) return null;
    const scaleX = workspace.width / (area.offsetWidth || workspace.width);
    const scaleY = workspace.height / (area.offsetHeight || workspace.height);
    const dock = node.closest(".desktop-site")?.querySelector(".desktop-dock");
    const dockTop = dock?.getBoundingClientRect().top;
    const bottom =
      dockTop > workspace.top && dockTop < workspace.bottom
        ? (dockTop - workspace.top) / scaleY - 8
        : workspace.height / scaleY;
    return {
      x: (bounds.left - workspace.left) / scaleX,
      y: (bounds.top - workspace.top) / scaleY,
      scaleX,
      scaleY,
      maxX: Math.max(8, (workspace.width - bounds.width) / scaleX - 8),
      maxY: Math.max(8, bottom - bounds.height / scaleY - 8),
    };
  }, [windowRef]);

  const place = useCallback(
    (x, y, bounds = geometry()) => {
      if (!bounds) return;
      const next = {
        x: Math.max(8, Math.min(x, bounds.maxX)),
        y: Math.max(8, Math.min(y, bounds.maxY)),
      };
      setPosition((previous) =>
        previous?.x === next.x && previous?.y === next.y ? previous : next,
      );
    },
    [geometry],
  );

  // Recontain a moved/resized window after rotation or viewport changes. The
  // dock stays accessible, and app contents retain their independent scrolling.
  useLayoutEffect(() => {
    if (disabled) return;
    const node = windowRef.current;
    const contain = () => {
      const bounds = geometry();
      if (bounds) place(bounds.x, bounds.y, bounds);
    };
    contain();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(contain);
    if (node) {
      observer?.observe(node);
      observer?.observe(node.parentElement);
    }
    window.addEventListener("resize", contain);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", contain);
    };
  }, [disabled, windowRef, geometry, place]);

  function start(event) {
    if (
      disabled ||
      event.isPrimary === false ||
      event.button > 0 ||
      event.target.closest("button")
    ) return;
    const bounds = geometry();
    if (!bounds) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      bounds,
    };
    setDragging(true);
  }

  function move(event) {
    const current = drag.current;
    if (!current || event.pointerId !== current.id) return;
    place(
      current.bounds.x + (event.clientX - current.x) / current.bounds.scaleX,
      current.bounds.y + (event.clientY - current.y) / current.bounds.scaleY,
      current.bounds,
    );
  }

  function end(event) {
    if (event.pointerId !== drag.current?.id) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function key(event) {
    if (disabled || event.target !== event.currentTarget) return;
    const delta = {
      ArrowLeft: [-16, 0],
      ArrowRight: [16, 0],
      ArrowUp: [0, -16],
      ArrowDown: [0, 16],
    }[event.key];
    const bounds = geometry();
    if (!delta || !bounds) return;
    event.preventDefault();
    event.stopPropagation();
    place(bounds.x + delta[0], bounds.y + delta[1], bounds);
  }

  return {
    position,
    dragging,
    titlebarProps: {
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: end,
      onPointerCancel: end,
      onLostPointerCapture: end,
      onKeyDown: key,
    },
  };
}
