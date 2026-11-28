// Original synthesized sounds only: one opt-in audio context, one quiet ocean
// loop, and short disposable voices. No downloads, autoplay or per-frame nodes.
export const audioKey = "island-audio-settings";
export function readAudioSettings() {
  try {
    const v = JSON.parse(localStorage.getItem(audioKey));
    return {
      enabled: !!v?.enabled,
      volume: Number.isFinite(v?.volume)
        ? Math.max(0, Math.min(1, v.volume))
        : 0.35,
    };
  } catch {
    return { enabled: false, volume: 0.35 };
  }
}
export function islandSound(kind) {
  window.dispatchEvent(new CustomEvent("island-sound", { detail: kind }));
}
export function createIslandAudio(environment = window) {
  let settings = readAudioSettings(),
    context = null,
    master = null,
    ocean = null,
    indoors = false,
    paused = true,
    disposed = false,
    stride = 0;
  function update() {
    if (master) {
      master.gain.cancelScheduledValues?.(context.currentTime);
      master.gain.setTargetAtTime(
        settings.enabled && !paused ? settings.volume * 0.3 : 0,
        context.currentTime,
        0.12,
      );
    }
    if (ocean)
      ocean.gain.setTargetAtTime(
        indoors ? 0.018 : 0.07,
        context.currentTime,
        0.3,
      );
  }
  function unlock() {
    if (disposed || !settings.enabled) return;
    try {
      if (!context) {
        const Audio =
          environment.AudioContext || environment.webkitAudioContext;
        if (!Audio) return;
        context = new Audio();
        master = context.createGain();
        master.gain.value = 0;
        master.connect(context.destination);
        const buffer = context.createBuffer(
            1,
            context.sampleRate * 3,
            context.sampleRate,
          ),
          samples = buffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < samples.length; i++) {
          last = (last + Math.random() * 0.04 - 0.02) / 1.02;
          samples[i] = last * 3;
        }
        const source = context.createBufferSource(),
          filter = context.createBiquadFilter();
        ocean = context.createGain();
        source.buffer = buffer;
        source.loop = true;
        filter.type = "lowpass";
        filter.frequency.value = 600;
        source.connect(filter);
        filter.connect(ocean);
        ocean.connect(master);
        source.start();
        const tide = context.createOscillator(),
          swell = context.createGain();
        tide.frequency.value = 0.12;
        swell.gain.value = 0.02;
        tide.connect(swell);
        swell.connect(ocean.gain);
        tide.start();
      }
      context.resume().catch(() => {});
      update();
    } catch {
      /* Audio is optional; exploration and visual feedback still work. */
    }
  }
  function note(hz, delay = 0, duration = 0.16, type = "sine", gain = 0.14) {
    if (!context || !settings.enabled || paused || context.state !== "running")
      return;
    const at = context.currentTime + delay,
      voice = context.createOscillator(),
      amp = context.createGain();
    voice.type = type;
    voice.frequency.value = hz;
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(gain, at + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    voice.connect(amp);
    amp.connect(master);
    voice.start(at);
    voice.stop(at + duration + 0.02);
    voice.onended = () => {
      voice.disconnect();
      amp.disconnect();
    };
  }
  function sound(kind) {
    // Card panels pause the town, but explicit button actions can still chime.
    const wasPaused = paused;
    paused = false;
    if (context && settings.enabled && master) {
      master.gain.cancelScheduledValues?.(context.currentTime);
      master.gain.setTargetAtTime(
        settings.volume * 0.3,
        context.currentTime,
        0.015,
      );
      master.gain.setTargetAtTime(
        wasPaused ? 0 : settings.volume * 0.3,
        context.currentTime + (kind === "wind-song" ? 3 : 1),
        0.1,
      );
    }
    if (kind === "wind-song")
      [659.25, 783.99, 880, 783.99, 587.33, 659.25].forEach((hz, i) =>
        note(hz, i * 0.4, 0.5),
      );
    else if (kind === "discovery" || kind === "rare")
      [523.25, 659.25, 783.99, ...(kind === "rare" ? [1046.5] : [])].forEach(
        (hz, i) => note(hz, i * 0.09, 0.28),
      );
    else if (kind === "tear") {
      [180, 240, 160, 310].forEach((hz, i) =>
        note(hz, i * 0.025, 0.06, "triangle", 0.07),
      );
    } else if (kind === "reveal") note(660, 0, 0.13, "sine", 0.09);
    paused = wasPaused;
  }
  function hear(e) {
    sound(e.detail);
  }
  function visibility() {
    if (!context) return;
    if (environment.document.hidden) context.suspend().catch(() => {});
    else if (settings.enabled) context.resume().catch(() => {});
  }
  environment.addEventListener("island-sound", hear);
  environment.document.addEventListener("visibilitychange", visibility);
  return {
    unlock,
    configure(next) {
      settings = {
        enabled: !!next.enabled,
        volume: Math.max(0, Math.min(1, next.volume)),
      };
      try {
        localStorage.setItem(audioKey, JSON.stringify(settings));
      } catch {}
      if (settings.enabled) unlock();
      else context?.suspend().catch(() => {});
      update();
    },
    scene(next) {
      paused = next.paused;
      indoors = !!next.room;
      update();
    },
    step(distance, surface, running) {
      if (!settings.enabled || paused) {
        stride = 0;
        return;
      }
      stride += distance;
      const length = running ? 6.16 : 4.42;
      if (stride >= length) {
        stride %= length;
        note(
          surface === "sand" ? 110 : surface === "stone" ? 230 : 160,
          0,
          0.065,
          "triangle",
          surface === "sand" ? 0.065 : 0.1,
        );
      }
    },
    sound,
    dispose() {
      disposed = true;
      environment.removeEventListener("island-sound", hear);
      environment.document.removeEventListener("visibilitychange", visibility);
      context?.close().catch(() => {});
    },
  };
}
