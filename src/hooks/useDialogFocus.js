import { useEffect, useRef } from "react";

// Shared by modal panels, not the Mac's independent app windows. A stack keeps
// only the top panel in charge of Escape/Tab when one panel opens another.
const panels = [];
let savedOverflow;
const controls =
  'a[href],button,input,select,textarea,iframe,summary,[tabindex]:not([tabindex="-1"])';

function available(node, panel) {
  if (node.matches(":disabled") || node.tabIndex < 0 || node.type === "hidden")
    return false;
  for (let parent = node; parent; parent = parent.parentElement) {
    const style = getComputedStyle(parent);
    if (
      parent.hidden ||
      parent.hasAttribute("inert") ||
      style.display === "none" ||
      style.visibility === "hidden"
    )
      return false;
    // Content of a collapsed field guide is not a Tab destination.
    if (
      parent.tagName === "DETAILS" &&
      !parent.open &&
      !parent.querySelector("summary")?.contains(node)
    )
      return false;
    if (parent === panel) break;
  }
  return true;
}

export default function useDialogFocus(panelRef, onClose, returnFocusRef) {
  // Status updates may replace callbacks while a panel stays open. Keep its
  // focus and listeners stable, but always dismiss using the latest callback.
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const previous = returnFocusRef?.current || document.activeElement;
    if (!panels.length) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    panels.push(panel);
    panel.focus({ preventScroll: true });
    const top = () => panels[panels.length - 1] === panel;
    function key(event) {
      if (!top() || event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        // The welcome screen deliberately has no Escape callback. It keeps
        // focus contained until the visitor chooses its start button.
        close.current?.();
      } else if (event.key === "Tab") {
        const nodes = [...panel.querySelectorAll(controls)].filter((node) =>
          available(node, panel),
        );
        const index = nodes.indexOf(document.activeElement);
        if (
          !nodes.length ||
          index < 0 ||
          (event.shiftKey ? index === 0 : index === nodes.length - 1)
        ) {
          event.preventDefault();
          (event.shiftKey ? nodes[nodes.length - 1] : nodes[0])?.focus();
        }
      }
    }
    // Pointer focus must not escape behind a modal either. Iframes themselves
    // remain focusable so embedded players can receive their keyboard input.
    function focus(event) {
      if (top() && !panel.contains(event.target))
        panel.focus({ preventScroll: true });
    }
    document.addEventListener("keydown", key);
    document.addEventListener("focusin", focus);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("focusin", focus);
      const wasTop = top();
      panels.splice(panels.indexOf(panel), 1);
      if (!panels.length) document.body.style.overflow = savedOverflow;
      if (wasTop && previous?.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, [panelRef, returnFocusRef]);
}
