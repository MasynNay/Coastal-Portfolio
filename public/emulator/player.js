// Only catalogued public cartridges can boot. No URL query can choose another
// ROM/core/script, and no third-party ad page is configured or requested.
(async function () {
  const status = document.getElementById("player-status");
  try {
    const response = await fetch("/emulator/catalog.json", { cache: "no-cache" });
    if (!response.ok) throw new Error("The cartridge list could not load.");
    const catalog = await response.json();
    const id = new URLSearchParams(window.location.search).get("game");
    const game = Object.hasOwn(catalog, id) ? catalog[id] : null;
    if (!game) throw new Error("This cartridge is not available. Choose a game from the arcade.");
    const graphics = document.createElement("canvas");
    if (!graphics.getContext("webgl2") && !graphics.getContext("webgl"))
      throw new Error("This browser has no WebGL graphics available. Open this cartridge in Chrome, Firefox or Safari with graphics acceleration enabled.");
    document.title = `${game.name} · Pocket Arcade`;
    window.EJS_player = "#emulator-game";
    window.EJS_core = "mgba";
    window.EJS_pathtodata = "/emulator/4.2.3/";
    window.EJS_gameUrl = game.rom;
    window.EJS_gameName = `${game.name} ${game.version}`.trim();
    window.EJS_gameID = game.saveId;
    window.EJS_color = "#82b9a8";
    window.EJS_backgroundColor = "#10262e";
    window.EJS_startButtonName = `Play ${game.name}`;
    window.EJS_startOnLoaded = false;
    window.EJS_alignStartButton = "center";
    window.EJS_language = "en-US";
    window.EJS_disableAutoLang = true;
    window.EJS_disableDatabases = true;
    window.EJS_threads = false;
    window.EJS_AdUrl = "";
    window.EJS_AdTimer = -1;
    // Prefer the current mGBA renderer. EmulatorJS falls back to its bundled
    // legacy core when WebGL2 is unavailable. Touch controls also cover iPads
    // that identify themselves as desktop browsers.
    window.EJS_defaultOptions = { webgl2Enabled: "enabled" };
    if (navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches)
      window.EJS_defaultOptions["virtual-gamepad"] = "enabled";
    window.EJS_defaultControls = { 0: {
      0: { value: "x", value2: "BUTTON_2" },
      2: { value: "shift", value2: "SELECT" },
      3: { value: "enter", value2: "START" },
      4: { value: "up arrow", value2: "DPAD_UP" },
      5: { value: "down arrow", value2: "DPAD_DOWN" },
      6: { value: "left arrow", value2: "DPAD_LEFT" },
      7: { value: "right arrow", value2: "DPAD_RIGHT" },
      8: { value: "z", value2: "BUTTON_1" },
      10: { value: "q", value2: "LEFT_TOP_SHOULDER" },
      11: { value: "e", value2: "RIGHT_TOP_SHOULDER" },
    }, 1: {}, 2: {}, 3: {} };
    const startupTimer = setTimeout(() => {
      status.textContent = "The player is taking longer than expected. Please reopen the cartridge to try again.";
    }, 30000);
    window.EJS_ready = () => {
      clearTimeout(startupTimer);
      status.hidden = true;
      // Upstream 4.2.3 renders Start as a div. Give that existing control native
      // button semantics and keyboard activation without changing vendor code.
      const start = document.querySelector(".ejs_start_button");
      if (start) {
        start.setAttribute("role", "button");
        start.tabIndex = 0;
        start.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            start.click();
          }
        });
      }
    };
    const loader = document.createElement("script");
    loader.src = "/emulator/4.2.3/loader.js";
    loader.onerror = () => {
      clearTimeout(startupTimer);
      status.textContent = "The player could not load. Please reopen the cartridge.";
      status.hidden = false;
    };
    document.body.appendChild(loader);
  } catch (error) {
    status.textContent = error.message;
  }
})();
