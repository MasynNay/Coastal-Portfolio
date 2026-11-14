"""Exercise Windfall's full-detail shaders under Chromium SwiftShader.

This validates WebGL shader link/runtime compatibility and locally hosted CC0
material loading. SwiftShader is NOT a real GPU performance benchmark.
"""
from __future__ import annotations
import asyncio
import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "qa-artifacts"
EXPECTED_SCANS = {"forest-floor-rgba.png", "cobblestone-rgba.png", "tree-bark-rgba.png"}


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass


async def main():
    ARTIFACTS.mkdir(exist_ok=True)
    server = ThreadingHTTPServer(
        ("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT))
    )
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base=f"http://127.0.0.1:{server.server_address[1]}/"
    try:
        async with async_playwright() as playwright:
            browser=await playwright.chromium.launch(
                channel="chrome", headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage",
                      "--enable-unsafe-swiftshader", "--use-angle=swiftshader"]
            )
            try:
                page=await browser.new_page(viewport={"width": 540, "height": 320}, device_scale_factor=1)
                errors=[]
                page.on("pageerror", lambda err: errors.append(str(err)))
                await page.goto(base+"?quality=full", wait_until="domcontentloaded", timeout=90000)
                await page.wait_for_function(
                    "document.documentElement.dataset.windfallReady==='1'",
                    timeout=240000,
                )
                await page.wait_for_function(
                    "document.documentElement.dataset.windfallAssetStatus!==undefined",
                    timeout=240000,
                )
                await page.wait_for_function(
                    "document.documentElement.dataset.windfallScannedMaterials!==undefined",
                    timeout=240000,
                )
                await page.wait_for_timeout(1100)
                state=await page.evaluate("""() => {
                  const gl=document.getElementById('scene').getContext('webgl2');
                  const root=document.documentElement.dataset;
                  return {
                    renderer:window.WindfallDiagnostics?.snapshot()?.renderer,
                    softwarePath:window.WindfallDiagnostics?.snapshot()?.softwareRenderer,
                    models:JSON.parse(root.windfallAssetStatus||'[]'),
                    scans:root.windfallScannedMaterials||'',
                    ready:root.windfallReady,
                    draws:window.WindfallDiagnostics?.snapshot()?.modelDraws,
                    error:document.getElementById('error').textContent,
                    glError:gl?.getError()
                  };
                }""")
                assert state["ready"] == "1", state
                assert not state["softwarePath"], state
                assert state["glError"] == 0, state
                assert not state["error"] and not errors, (state,errors)
                assert len(state["models"]) == 6 and all(x["loaded"] for x in state["models"]), state
                assert set(state["scans"].split(",")) == EXPECTED_SCANS, state
                assert state["draws"] and state["draws"]["colorSubmitted"] > 0, state
                await page.screenshot(path=str(ARTIFACTS/"authored-full-detail.png"))
                # Uncluttered art-review frame: hide the preview HUD and reframe
                # at desktop aspect ratio. Game UI remains unchanged in source.
                await page.set_viewport_size({"width": 850, "height": 500})
                await page.add_style_tag(content="""
                  .top,.bottom,.center,.vignette,#mobileControls,#runTouch{
                    display:none !important
                  }
                """)
                await page.wait_for_timeout(1250)
                assert await page.evaluate(
                    "()=>document.getElementById('scene').getContext('webgl2').getError()"
                ) == 0
                await page.screenshot(path=str(ARTIFACTS/"authored-full-detail-world.png"))
                (ARTIFACTS/"full-detail-results.json").write_text(
                    json.dumps({
                        "disclaimer":"Full shader feature path on SwiftShader, NOT a physical GPU or AAA visual approval",
                        "state":state,
                        "pageErrors":errors
                    },indent=2)+"\n"
                )
                print(json.dumps(state,indent=2))
            finally:
                await browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    asyncio.run(main())
