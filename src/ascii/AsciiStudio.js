import { lazy, Suspense } from "react";

// All three entrances share one deferred import. Character-cell data and the
// drawing engine load only when ASCII opens, rather than during site/game boot.
const AsciiApp = lazy(() => import("./AsciiApp"));
export default function AsciiStudio(props) {
  return (
    <Suspense
      fallback={
        <p className="ascii-loading" role="status">
          Opening ASCII Studio…
        </p>
      }
    >
      <AsciiApp {...props} />
    </Suspense>
  );
}
