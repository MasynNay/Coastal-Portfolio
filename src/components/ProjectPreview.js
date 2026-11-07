import "./ProjectPreview.css";

// Shared browser chrome frames interface artwork and real screenshots without
// loading the live application inside each portfolio card.
export default function ProjectPreview({ title, src, kind = "interface" }) {
  return (
    <figure className="project-preview">
      <div className="project-preview-bar" aria-hidden="true">
        <span className="project-preview-lights">
          <i />
          <i />
          <i />
        </span>
        <span>{title}</span>
        <small>{kind === "artwork" ? "ORIGINAL ARTWORK" : "UI PREVIEW"}</small>
      </div>
      <img
        src={src}
        alt={
          kind === "artwork"
            ? `${title} original illustrated project artwork`
            : `${title} interface preview`
        }
        loading="lazy"
        decoding="async"
        width="1200"
        height="700"
      />
    </figure>
  );
}
