import { Apple } from "react-bootstrap-icons";
// Presentation only: these styles share the same apps, windows and saved data.
export const workspaceSystems = {
  mac: { name: "Mac", computer: "Masyn’s Mac", about: "About this Mac" },
  windows: { name: "Windows", computer: "Masyn’s PC", about: "About This PC" },
  ubuntu: {
    name: "Ubuntu",
    computer: "Masyn’s Ubuntu",
    about: "About This Computer",
  },
};
export function SystemIcon({ system = "mac", size = 18 }) {
  if (system === "mac") return <Apple size={size} aria-hidden="true" />;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      {system === "windows" ? (
        <>
          <path d="M2 3h9v9H2zm11 0h9v9h-9zM2 14h9v9H2zm11 0h9v9h-9z" />
        </>
      ) : (
        <>
          <circle
            cx="12"
            cy="12"
            r="7"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <circle cx="12" cy="3" r="3" />
          <circle cx="4.2" cy="16.5" r="3" />
          <circle cx="19.8" cy="16.5" r="3" />
        </>
      )}
    </svg>
  );
}
