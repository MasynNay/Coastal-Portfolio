// The collection screens and Help share these instructions, so a keyboard
// shortcut never becomes the only explanation of an action available by touch.
export default function CollectingHelp({ kind, expanded = false }) {
  const bugs = kind === "bugs";
  return (
    <details className="collection-instructions" open={expanded}>
      <summary>
        {bugs ? "How to find bugs" : "How to catch aquatic life"}
        {" · phone, tablet & keyboard"}
      </summary>
      <p>
        <strong>Phone or tablet: </strong>
        {bugs ? (
          <>
            Tap clear ground beside a tree. When the bottom action button says
            <strong> Shake tree · find bugs</strong>, tap it. Three bugs fall
            out. Tap near a bug, tap its <strong>Catch</strong> action, then
            choose <strong>Gently catch</strong> to keep it.
          </>
        ) : (
          <>
            Tap clear ground at the pond or pier. When <strong>Fish</strong>{" "}
            appears at the bottom of the screen, tap it to cast. Wait for the
            result; successful catches are saved automatically.
          </>
        )}
      </p>
      <p>
        <strong>Keyboard & mouse: </strong>
        {bugs ? (
          <>
            Walk beside a tree and press <kbd>E</kbd> to shake it. Approach a
            fallen bug and press <kbd>E</kbd> to inspect it, then choose
            <strong> Gently catch</strong>.
          </>
        ) : (
          <>
            Walk with WASD or the arrow keys, or click clear ground beside the
            water. Select <strong>Fish</strong> to cast; buttons also work with
            Tab and Enter.
          </>
        )}
      </p>
      <p>
        {bugs
          ? "Your bugs live in Inventory → Terrariums."
          : "Freshwater creatures come from the pond; saltwater creatures come from the sea. Find your catches in Inventory → Aquariums."}{" "}
        Swipe or scroll the creature strip to choose a resident. Tap or click
        the habitat to look closer, then again to return to the full view.
      </p>
    </details>
  );
}
