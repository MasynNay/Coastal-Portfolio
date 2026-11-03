import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./app.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { DesignPortfolio } from "./designs/DesignPortfolio";
import Game from "./pages/Game";
import { GlassPortfolio } from "./designs/GlassPortfolio";
import { DesktopPortfolio } from "./designs/DesktopPortfolio";

// Heavy demos and the town are loaded only when their routes are opened. One
// route tree owns aliases and fallbacks; no old second portfolio tree can drift
// out of sync with the current views. The frozen original is a separate build.
const ProjectDemos = lazy(() => import("./demos/ProjectDemos"));
const SpriteStudio = lazy(() => import("./world/SpriteStudio"));
const WorldMode = lazy(() => import("./world/WorldMode"));
const ArcadeGame = lazy(() => import("./pages/ArcadeGame"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="app-loading" role="status">
            Opening the portfolio…
          </div>
        }
      >
        <Routes>
          {["/", "/design/glass"].map((path) => (
            <Route key={path} path={path} element={<GlassPortfolio />} />
          ))}
          {["/resume", "/design/glass/resume"].map((path) => (
            <Route key={path} path={path} element={<GlassPortfolio resume />} />
          ))}
          <Route path="/design/desktop" element={<DesktopPortfolio />} />
          <Route path="/world" element={<WorldMode />} />
          {["/world/sprites", "/world/characters"].map((path) => (
            <Route key={path} path={path} element={<SpriteStudio />} />
          ))}
          <Route path="/arcade/:game" element={<ArcadeGame />} />
          <Route path="/projects/:project" element={<ProjectDemos />} />
          <Route path="/game" element={<Game />} />
          <Route
            path="/design/polished"
            element={<DesignPortfolio expressive={false} />}
          />
          <Route
            path="/design/expressive"
            element={<DesignPortfolio expressive />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
