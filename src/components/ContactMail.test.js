import { sendContactMessage } from "./ContactMail";

const details = {
  firstName: " Ada ",
  lastName: " Lovelace ",
  email: " ada@example.com ",
  phone: " 555-0100 ",
  message: " Hello from the portfolio. ",
  website: "",
};
const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = jest.fn();
  jest.useFakeTimers();
});
afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
});

test.each([true, "true"])(
  "delivery includes the requested recipient, subject, visitor details and reply-to (%s)",
  async (success) => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ success }) });
    await sendContactMessage(details, "https://masynnay.com/world");
    const [url, request] = fetch.mock.calls[0];
    expect(url).toBe("https://formsubmit.co/ajax/masynnay33@gmail.com");
    expect(request.method).toBe("POST");
    expect(JSON.parse(request.body)).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "555-0100",
      message: "Hello from the portfolio.",
      _replyto: "ada@example.com",
      _subject: "Someone sent you a message from your portfolio",
      _template: "table",
      _url: "https://masynnay.com/world",
      _honey: "",
    });
    expect(jest.getTimerCount()).toBe(0);
  },
);

test.each([false, "false"])(
  "a rejected HTTP-200 submission cannot be reported as sent (%s)",
  async (success) => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success, message: "Not activated" }),
    });
    await expect(sendContactMessage(details)).rejects.toThrow("Not activated");
    expect(jest.getTimerCount()).toBe(0);
  },
);

test("a network failure is surfaced and cancels the timeout", async () => {
  fetch.mockRejectedValue(new TypeError("Network unavailable"));
  await expect(sendContactMessage(details)).rejects.toThrow(
    "Network unavailable",
  );
  expect(jest.getTimerCount()).toBe(0);
});

test("a stalled request is aborted instead of leaving the form stuck sending", async () => {
  fetch.mockImplementation(
    (_, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => reject(new Error("Timed out")));
      }),
  );
  const result = sendContactMessage(details);
  jest.advanceTimersByTime(20000);
  await expect(result).rejects.toThrow("Timed out");
});
