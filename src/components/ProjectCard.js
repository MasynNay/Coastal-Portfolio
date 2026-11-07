// Project cards share destinations and preview artwork across portfolio layouts.
// The glass flag changes presentation, never the project data or navigation.
import { Link } from "react-router-dom";
import { Col } from "react-bootstrap";
import ProjectPreview from "./ProjectPreview";

export const ProjectCard = ({
  title,
  description,
  imgUrl,
  previewKind = "interface",
  webLink,
  webLabel = "Visit website",
  gitLink,
  roadmap,
  demoLink,
  glass = false,
  iconLabel,
  category,
}) => {
  const hasPreview = (category === "Web" || category === "Software") && imgUrl;
  if (glass)
    return (
      <Col xs={12} md={6} className="glass-project-column">
        <article className="glass-project-card">
          <div
            className={`glass-project-cover cover-${title.split(" ")[0].toLowerCase()}${hasPreview ? " has-preview" : ""}`}
            aria-hidden={hasPreview ? undefined : true}
          >
            {hasPreview ? (
              <ProjectPreview title={title} src={imgUrl} kind={previewKind} />
            ) : (
              <>
                <span>
                  {iconLabel ||
                    (title.startsWith("CompTIA")
                      ? "A+"
                      : title === "TypeNinja"
                        ? "Aa_"
                        : title === "MixStream"
                          ? "▶"
                          : title === "SemiSnitch"
                            ? "S/S"
                            : "↗")}
                </span>
                <i />
              </>
            )}
          </div>
          <div className="glass-project-body">
            <h3>{title}</h3>
            <p>{description}</p>
            <div>
              {demoLink && <Link to={demoLink}>Try the demo ↗</Link>}
              {webLink && (
                <a href={webLink} target="_blank" rel="noreferrer">
                  {webLabel} ↗
                </a>
              )}
              {gitLink && (
                <a href={gitLink} target="_blank" rel="noreferrer">
                  View source ↗
                </a>
              )}
              {roadmap && (
                <a href={roadmap} target="_blank" rel="noreferrer">
                  Development roadmap ↗
                </a>
              )}
            </div>
          </div>
        </article>
      </Col>
    );
  return (
    <Col size={12} sm={6} md={4}>
      <div className="proj-imgbx">
        {imgUrl ? (
          <img src={imgUrl} alt={title} />
        ) : (
          <div className="placeholder-image">No Image Available</div>
        )}
        <div className="proj-txtx">
          <h4>{title}</h4>
          <span>{description}</span>
          <br />
          <br />
          {demoLink && (
            <Link className="projectbtn" to={demoLink}>
              Try the demo
            </Link>
          )}
          {webLink && (
            <a
              className="projectbtn"
              href={webLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {webLabel}
            </a>
          )}
          {gitLink && (
            <a
              className="projectbtn"
              href={gitLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              View GitHub Repo
            </a>
          )}
          {roadmap && (
            <a
              className="projectbtn"
              href={roadmap}
              target="_blank"
              rel="noopener noreferrer"
            >
              Development roadmap
            </a>
          )}
        </div>
      </div>
    </Col>
  );
};
