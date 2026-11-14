"""Browser smoke and visual-regression artifacts for UNRELEASED Windfall.
Runs against real local HTTP files and browser WebGL2 (SwiftShader permitted).
Not a hardware performance benchmark or cinematic quality approval.
Usage: python public/windfall-2026/tools/browser_graphics_ci.py
"""
from __future__ import annotations
import asyncio
import json
import math
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "qa-artifacts"
EXPECTED = {
    "weathered-standing-stone", "windfall-broadleaf-tree",
    "windfall-timber-cottage", "windfall-harbor-workshop",
    "windfall-wayfarer", "windfall-mountain-conifer",
    "windfall-companion-a", "windfall-companion-b",
    "windfall-companion-c", "windfall-companion-d",
}


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass


async def state(page):
    return await page.evaluate("""() => {
      const gl=document.getElementById('scene').getContext('webgl2');
      const raw=document.documentElement.dataset.windfallAssetStatus;
      return {
        ready:document.documentElement.dataset.windfallReady||null,
        loaded:document.documentElement.dataset.windfallAssets||null,
        assets:raw?JSON.parse(raw):[],
        error:document.getElementById('error').textContent||'',
        diagnostics:window.WindfallDiagnostics?.snapshot()||null,
        glError:gl?gl.getError():-1
      };
    }""")


async def wait_for_scene(page):
    await page.wait_for_function(
        "document.documentElement.dataset.windfallReady==='1'", timeout=120000
    )
    await page.wait_for_function(
        "document.documentElement.dataset.windfallAssetStatus!==undefined",
        timeout=120000,
    )
    await page.wait_for_timeout(1500)


async def run_case(browser, base, fallback):
    page = await browser.new_page(viewport={"width": 850, "height": 500}, device_scale_factor=1)
    js_errors = []
    page.on("pageerror", lambda exc: js_errors.append(str(exc)))
    if fallback:
        await page.route("**/models/windfall-wayfarer.glb", lambda route: route.abort())
    try:
        await page.goto(base + "?quality=software", wait_until="domcontentloaded", timeout=60000)
        await wait_for_scene(page)
        initial = await state(page)
        assert initial["ready"] == "1", initial
        assert initial["glError"] == 0, initial
        assert not initial["error"], initial
        loaded = {item["id"]: item for item in initial["assets"]}
        assert set(loaded) == EXPECTED, loaded
        for name, entry in loaded.items():
            assert bool(entry["loaded"]) != (fallback and name == "windfall-wayfarer"), entry
        diagnostics = initial["diagnostics"]
        assert diagnostics, initial
        assert diagnostics["modelDraws"]["instances"] > 0, diagnostics
        companions=[item for item in initial["assets"] if item.get("role")=="companion"]
        assert len(companions)==4 and all(x["loaded"] for x in companions), companions
        assert diagnostics["modelDraws"]["colorSubmitted"] > 0, diagnostics
        assert diagnostics["modelDraws"]["colorCulled"] >= 0, diagnostics
        prefix = "fallback" if fallback else "authored"
        await page.screenshot(path=str(ARTIFACTS / f"{prefix}-start.png"))
        before = diagnostics["player"]
        await page.keyboard.down("w")
        await page.wait_for_timeout(1700)
        await page.keyboard.up("w")
        await page.wait_for_timeout(550)
        moved = await state(page)
        after = moved["diagnostics"]["player"]
        movement = math.dist(before, after)
        assert movement > .07, f"{prefix}: no player travel ({movement:.4f})"
        assert moved["glError"] == 0, moved
        await page.screenshot(path=str(ARTIFACTS / f"{prefix}-walk.png"))
        if not fallback:
            await page.mouse.move(400, 215)
            await page.mouse.down()
            await page.mouse.move(590, 245, steps=6)
            await page.mouse.up()
            await page.wait_for_timeout(500)
            orbit = await state(page)
            assert orbit["glError"] == 0, orbit
            await page.screenshot(path=str(ARTIFACTS / "authored-orbit.png"))
        assert not js_errors, js_errors
        return {
            "mode": prefix,
            "assets_loaded": sum(bool(x["loaded"]) for x in loaded.values()),
            "movement": round(movement, 3),
            "initial_draws": diagnostics["modelDraws"],
            "later_draws": moved["diagnostics"]["modelDraws"],
            "renderer": diagnostics["renderer"],
            "software_path": diagnostics["softwareRenderer"],
            "js_errors": js_errors,
        }
    finally:
        await page.close()


async def main():
    ARTIFACTS.mkdir(exist_ok=True)
    handler = partial(QuietHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_address[1]}/"
    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(
                channel="chrome", headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage",
                      "--enable-unsafe-swiftshader", "--use-angle=swiftshader"]
            )
            try:
                result = {
                    "disclaimer": "Software-rendered Chromium verification only, not AAA art or real GPU FPS",
                    "cases": [
                        await run_case(browser, base, fallback=False),
                        await run_case(browser, base, fallback=True),
                    ],
                }
                (ARTIFACTS / "browser-results.json").write_text(
                    json.dumps(result, indent=2) + "\n"
                )
                print(json.dumps(result, indent=2))
            finally:
                await browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    asyncio.run(main())
