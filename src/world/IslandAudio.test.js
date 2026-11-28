import { createIslandAudio, audioKey } from "./IslandAudio";
beforeEach(() => localStorage.clear());
function audioEnvironment() {
  const param = () => ({
    value: 0,
    setTargetAtTime: jest.fn(),
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  });
  const nodes = [];
  const node = () => {
    const n = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      gain: param(),
      frequency: param(),
    };
    nodes.push(n);
    return n;
  };
  const context = {
    currentTime: 0,
    sampleRate: 10,
    destination: {},
    state: "running",
    createBuffer: () => ({ getChannelData: () => new Float32Array(30) }),
    createGain: node,
    createOscillator: jest.fn(node),
    createBufferSource: node,
    createBiquadFilter: node,
    resume: jest.fn(() => Promise.resolve()),
    suspend: jest.fn(() => Promise.resolve()),
    close: jest.fn(() => Promise.resolve()),
  };
  const environment = {
    AudioContext: jest.fn(() => context),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    document: {
      hidden: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  };
  return { environment, context, nodes };
}
test("audio stays off until enabled, reuses one context, and disposes listeners and resources", () => {
  const { environment, context } = audioEnvironment(),
    audio = createIslandAudio(environment);
  audio.unlock();
  audio.sound("rare");
  expect(environment.AudioContext).not.toHaveBeenCalled();
  audio.configure({ enabled: true, volume: 0.4 });
  audio.unlock();
  audio.configure({ enabled: true, volume: 0.5 });
  expect(environment.AudioContext).toHaveBeenCalledTimes(1);
  audio.scene({ paused: false, room: null });
  const ambient = context.createOscillator.mock.calls.length;
  audio.step(1, "sand", false);
  expect(context.createOscillator).toHaveBeenCalledTimes(ambient);
  audio.step(4, "sand", false);
  expect(context.createOscillator).toHaveBeenCalledTimes(ambient + 1);
  audio.scene({ paused: true, room: null });
  audio.step(40, "stone", true);
  expect(context.createOscillator).toHaveBeenCalledTimes(ambient + 1);
  audio.sound("rare");
  expect(context.createOscillator.mock.calls.length).toBeGreaterThan(
    ambient + 1,
  );
  expect(JSON.parse(localStorage.getItem(audioKey))).toEqual({
    enabled: true,
    volume: 0.5,
  });
  audio.dispose();
  expect(context.close).toHaveBeenCalledTimes(1);
  expect(environment.removeEventListener).toHaveBeenCalledWith(
    "island-sound",
    expect.any(Function),
  );
});
