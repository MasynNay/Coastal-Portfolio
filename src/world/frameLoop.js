// One render request, with a watchdog for embedded browsers that postpone animation frames
// while processing physical keyboard input. Both clocks enter the same tick; they cannot stack.
export function createFrameLoop(
  step,
  {
    request = requestAnimationFrame,
    cancel = cancelAnimationFrame,
    schedule = setTimeout,
    unschedule = clearTimeout,
    clock = () => performance.now(),
    watchdogMs = 48,
  } = {},
) {
  const statistics = {
    animationFrames: 0,
    watchdogFrames: 0,
  };
  let pending = null,
    watchdog = null,
    last = null,
    disposed = false;
  function clearPending() {
    if (pending !== null) cancel(pending);
    if (watchdog !== null) unschedule(watchdog);
    pending = null;
    watchdog = null;
  }
  function queue() {
    pending = request(tick);
    watchdog = schedule(() => {
      if (disposed) return;
      clearPending();
      tick(clock(), true);
    }, watchdogMs);
  }
  function tick(now, fromWatchdog = false) {
    if (fromWatchdog) statistics.watchdogFrames++;
    else statistics.animationFrames++;
    clearPending();
    if (disposed) return;
    now = last === null ? now : Math.max(now, last);
    const dt = last === null ? 0 : Math.min((now - last) / 1000, 2);
    last = now;
    // Visibility changes reset the clock separately. A late visible frame keeps elapsed
    // movement time; the engine resolves it in small collision-safe simulation steps.
    if (step(now, dt)) queue();
    else last = null;
  }
  return {
    statistics: () => statistics,
    wake({ immediate = false } = {}) {
      if (disposed || pending !== null) return;
      if (immediate) {
        const now = clock();
        last = now;
        if (step(now, 1 / 120)) queue();
        else last = null;
      } else queue();
    },
    sleep() {
      clearPending();
      last = null;
    },
    dispose() {
      this.sleep();
      disposed = true;
    },
  };
}
