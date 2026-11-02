// Canvas gestures own only navigation and zoom. HUD buttons never pass through
// this surface. Touch waits for release so a pinch or drag cannot start a walk.
export function createPointerInput(
  canvas,
  { enabled, onTap, onZoom, onPinch, clock = () => performance.now() },
) {
  const pointers = new Map();
  let lastTap = null,
    pinchDistance = 0;
  const distance = () => {
    const [a, b] = [...pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  function tap(event) {
    const now = clock();
    const double =
      lastTap &&
      now - lastTap.time < 340 &&
      Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 30;
    const target = onTap(event, !!double, double ? lastTap.target : null);
    lastTap = double
      ? null
      : { time: now, x: event.clientX, y: event.clientY, target };
  }
  function down(event) {
    if (!enabled() || (event.button !== undefined && event.button !== 0))
      return;
    event.preventDefault();
    // Mouse presses retain their immediate response. A second click runs.
    if (!event.pointerType || event.pointerType === "mouse") {
      tap(event);
      return;
    }
    canvas.setPointerCapture?.(event.pointerId);
    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      time: clock(),
      moved: false,
    });
    if (pointers.size > 1) {
      pointers.forEach((p) => {
        p.moved = true;
      });
      lastTap = null;
      pinchDistance = distance();
      onPinch?.();
    }
  }
  function move(event) {
    const p = pointers.get(event.pointerId);
    if (!p) return;
    event.preventDefault();
    p.x = event.clientX;
    p.y = event.clientY;
    if (Math.hypot(p.x - p.startX, p.y - p.startY) > 10) p.moved = true;
    if (pointers.size > 1) {
      const next = distance();
      if (next && pinchDistance && enabled())
        onZoom(Math.log(next / pinchDistance) * 0.7);
      pinchDistance = next;
    }
  }
  function up(event) {
    const p = pointers.get(event.pointerId);
    pointers.delete(event.pointerId);
    if (canvas.hasPointerCapture?.(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
    if (!p) return;
    if (
      !p.moved &&
      enabled() &&
      clock() - p.time < 600 &&
      Math.hypot(event.clientX - p.startX, event.clientY - p.startY) <= 10
    )
      tap(event);
    if (pointers.size < 2) pinchDistance = 0;
  }
  function cancel(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    pointers.forEach((p) => {
      p.moved = true;
    });
    lastTap = null;
    pinchDistance = 0;
  }
  const events = {
    pointerdown: down,
    pointermove: move,
    pointerup: up,
    pointercancel: cancel,
    lostpointercapture: cancel,
  };
  Object.entries(events).forEach(([name, fn]) =>
    canvas.addEventListener(name, fn),
  );
  return {
    clear() {
      pointers.clear();
      lastTap = null;
      pinchDistance = 0;
    },
    dispose() {
      this.clear();
      Object.entries(events).forEach(([name, fn]) =>
        canvas.removeEventListener(name, fn),
      );
    },
  };
}
