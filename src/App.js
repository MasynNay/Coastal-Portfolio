import { lazy, Suspense } from "react";
import "./app.css";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { DesignPortfolio } from "./designs/DesignPortfolio";
import { NavBar } from "./components/NavBar";
import { Banner } from "./components/Banner";
import { Skills } from "./components/Skills";
import { Projects } from "./components/Projects";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import ResumePage from "./pages/ResumePage";
import Game from "./pages/Game";
import { GlassPortfolio } from "./designs/GlassPortfolio";
import { DesktopPortfolio } from "./designs/DesktopPortfolio";

// Load the sprite game and art workshop only when those modes are opened.
const ProjectDemos = lazy(() => import("./demos/ProjectDemos"));
const SpriteStudio = lazy(() => import("./world/SpriteStudio"));
const WorldMode = lazy(() => import("./world/WorldMode"));
const ArcadeGame = lazy(() => import("./pages/ArcadeGame"));
function App() {
  return (
    <Router>
      <PortfolioRoutes />
    </Router>
  );
}
function PortfolioRoutes() {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, "") || "/";
  if (pathname.startsWith("/arcade/"))
    return (
      <Suspense fallback={<p>Opening island game…</p>}>
        <Routes>
          <Route path="/arcade/:game" element={<ArcadeGame />} />
        </Routes>
      </Suspense>
    );
  if (pathname.startsWith("/projects/"))
    return (
      <Suspense fallback={<p>Opening project…</p>}>
        <Routes>
          <Route path="/projects/:project" element={<ProjectDemos />} />
        </Routes>
      </Suspense>
    );
  if (["/world/characters", "/world/sprites"].includes(pathname))
    return (
      <Suspense fallback={<p>Opening character workshop…</p>}>
        <SpriteStudio />
      </Suspense>
    );
  if (pathname === "/world")
    return (
      <Suspense
        fallback={
          <div
            style={{
              padding: 40,
              background: "#102328",
              minHeight: "100vh",
              color: "#e0e8df",
            }}
          >
            Preparing the island…
          </div>
        }
      >
        <WorldMode />
      </Suspense>
    );
  if (pathname === "/game") return <Game />;
  if (
    ["/", "/resume", "/design/glass", "/design/glass/resume"].includes(pathname)
  )
    return <GlassPortfolio resume={pathname.endsWith("/resume")} />;
  if (pathname === "/design/desktop") return <DesktopPortfolio />;
  if (pathname === "/design/polished" || pathname === "/design/expressive") {
    return <DesignPortfolio expressive={pathname === "/design/expressive"} />;
  }
  return (
    <div className="App">
      <NavBar />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Banner />
              <Skills />
              <Projects />
              <Contact />
            </>
          }
        />
        <Route path="/resume" element={<ResumePage />} />
      </Routes>
      <Footer />
    </div>
  );
}
export default App;
