import "./ProjectPreview.css";

// Browser chrome is shared across presentations. The image is deliberately
// labeled as an interface preview, rather than an interactive app or screenshot.
export default function ProjectPreview({ title, src }) {
  return (
    <figure className="project-preview">
      <div className="project-preview-bar" aria-hidden="true">
        <span className="project-preview-lights">
          <i />
          <i />
          <i />
        </span>
        <span>{title}</span>
        <small>UI PREVIEW</small>
      </div>
      <img
        src={src}
        alt={`${title} interface preview`}
        loading="lazy"
        decoding="async"
        width="1200"
        height="700"
      />
    </figure>
  );
}
