import { useEffect, useRef, useState } from "react";
import { photoAlbum } from "../data/photos";
export { default as GamesApp } from "../components/GameLibrary";
export { default as GamePlayer } from "../components/GamePlayer";
// The shared album supplies its own responsive viewer and slideshow. Keeping it
// in an iframe avoids copying family photos or private photo metadata into Git.
export function PhotosApp({ active = true, album = photoAlbum }) {
  return album ? (
    <SharedPhotos album={album} />
  ) : (
    <LocalPhotos active={active} />
  );
}

function SharedPhotos({ album }) {
  const [revision, setRevision] = useState(0);
  return (
    <section
      className="mac-photos mac-shared-photos"
      aria-label="Photo gallery"
    >
      <header className="mac-photo-toolbar">
        <button onClick={() => setRevision((value) => value + 1)}>
          Refresh album
        </button>
        <a href={album.url} target="_blank" rel="noreferrer">
          Open album ↗
        </a>
      </header>
      <iframe
        key={revision}
        className="mac-photo-album"
        title={`${album.name} shared photo album`}
        src={album.url}
        allow="fullscreen"
        allowFullScreen
        referrerPolicy="no-referrer"
      />
    </section>
  );
}

// When no shared album is configured, the build-generated local index remains
// available for a self-contained gallery using public/slideshow images.
function LocalPhotos({ active = true }) {
  const [photos, setPhotos] = useState([]),
    [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    let live = true;
    fetch("/slideshow/index.json")
      .then((r) => r.json())
      .then((list) => {
        if (live) setPhotos(list);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!active || !playing || photos.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % photos.length), 4000);
    return () => clearInterval(t);
  }, [active, playing, photos.length]);
  const swipe = useRef(null);
  return (
    <div className="mac-photos">
      <h2>Photos</h2>
      {photos.length ? (
        <>
          <img
            src={photos[index]}
            alt={`Slideshow item ${index + 1}`}
            draggable={false}
            onPointerDown={(e) => {
              swipe.current = { x: e.clientX, y: e.clientY };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerUp={(e) => {
              const start = swipe.current;
              swipe.current = null;
              if (
                !start ||
                Math.abs(e.clientX - start.x) < 45 ||
                Math.abs(e.clientY - start.y) > 60
              )
                return;
              setIndex(
                (i) =>
                  (i + (e.clientX < start.x ? 1 : -1) + photos.length) %
                  photos.length,
              );
            }}
            onPointerCancel={() => {
              swipe.current = null;
            }}
          />
          <div>
            <button
              onClick={() =>
                setIndex((index - 1 + photos.length) % photos.length)
              }
            >
              ← Previous
            </button>
            <button onClick={() => setPlaying(!playing)}>
              {playing ? "Pause" : "Play slideshow"}
            </button>
            <button onClick={() => setIndex((index + 1) % photos.length)}>
              Next →
            </button>
          </div>
          <p>
            {index + 1} / {photos.length}
          </p>
        </>
      ) : (
        <p>
          Your photo album is ready. Add pictures to the slideshow folder, then
          restart the preview to load them.
        </p>
      )}
    </div>
  );
}
