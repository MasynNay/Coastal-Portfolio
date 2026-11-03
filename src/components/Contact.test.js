import { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { Contact } from "./Contact";
import { sendContactMessage } from "./ContactMail";

jest.mock("react-on-screen", () => ({
  __esModule: true,
  default: ({ children }) => children({ isVisible: true }),
}));
jest.mock("./ContactMail", () => ({
  contactEmail: "masynnay33@gmail.com",
  sendContactMessage: jest.fn(),
}));
let host, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(<Contact />));
  for (const [name, value] of Object.entries({
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "555-0100",
    message: "A message worth keeping.",
  })) {
    const field = host.querySelector(`[name="${name}"]`);
    act(() => Simulate.change(field, { target: { value } }));
  }
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  jest.clearAllMocks();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
const submit = () =>
  host
    .querySelector("form")
    .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

test("failed delivery keeps the visitor's message and offers the correct direct-email fallback", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  sendContactMessage.mockRejectedValue(new Error("Service unavailable"));
  await act(async () => submit());
  expect(host.querySelector('[name="message"]').value).toBe(
    "A message worth keeping.",
  );
  expect(host.querySelector('[name="email"]').value).toBe("ada@example.com");
  expect(host.querySelector('[role="status"]').textContent).toContain(
    "couldn’t be sent",
  );
  expect(host.querySelector('[role="status"] a').getAttribute("href")).toBe(
    "mailto:masynnay33@gmail.com",
  );
  expect(host.querySelector('button[type="submit"]').disabled).toBe(false);
  log.mockRestore();
});

test("sending disables duplicate submissions and clears fields only after acceptance", async () => {
  let accept;
  sendContactMessage.mockImplementation(
    () =>
      new Promise((resolve) => {
        accept = resolve;
      }),
  );
  act(() => submit());
  expect(host.querySelector('button[type="submit"]').textContent).toBe(
    "Sending...",
  );
  expect(host.querySelector('[name="message"]').disabled).toBe(true);
  act(() => submit());
  expect(sendContactMessage).toHaveBeenCalledTimes(1);
  await act(async () => accept({ success: true }));
  expect(host.querySelector('[name="message"]').value).toBe("");
  expect(host.querySelector('[role="status"]').textContent).toContain(
    "sent successfully",
  );
  expect(host.querySelector('button[type="submit"]').disabled).toBe(false);
});
