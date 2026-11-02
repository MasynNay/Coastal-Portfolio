import "./BrandMark.css";

// One approved mark supplies every portfolio mode. The framed treatment keeps
// the mint highlights readable over light layouts and the game's grass/ocean.
export default function BrandMark({
  size = "nav",
  framed = false,
  decorative = false,
}) {
  return (
    <img
      className={`brand-mark brand-mark--${size}${framed ? " brand-mark--framed" : ""}`}
      src="/brand/MNLogo-256.webp"
      srcSet="/brand/MNLogo-256.webp 256w, /brand/MNLogo-512.webp 512w, /brand/MNLogo.webp 1024w"
      sizes={
        size === "hero"
          ? "(max-width: 650px) 85vw, 360px"
          : ["footer", "study"].includes(size)
            ? "180px"
            : "80px"
      }
      width="512"
      height="384"
      alt={decorative ? "" : "Masyn Nay — MN lotus logo"}
      decoding="async"
    />
  );
}
