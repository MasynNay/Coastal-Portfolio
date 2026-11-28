import { projectStories } from "../data/projectStories";
import "./ProjectStory.css";
// Native disclosure stays keyboard/touch accessible and keeps long case studies
// out of the initial card scan. Screenshots remain in the shared project cover.
export default function ProjectStory({ title }) {
  const story = projectStories[title];
  if (!story) return null;
  return (
    <details className="project-story">
      <summary>Read the Project Story</summary>
      <small>{story.role}</small>
      <dl>
        <dt>The Problem</dt>
        <dd>{story.problem}</dd>
        <dt>How I Approached It</dt>
        <dd>{story.approach}</dd>
        <dt>The Result</dt>
        <dd>{story.outcome}</dd>
      </dl>
      <a href={story.evidence} target="_blank" rel="noreferrer">
        Project Documentation
      </a>
    </details>
  );
}
