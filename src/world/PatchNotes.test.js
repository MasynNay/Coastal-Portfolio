import { act } from "react";
import { createRoot } from "react-dom/client";
import { MailboxMessage } from "./Activities";
import { mailboxLetters } from "./Mailboxes";

test("Windfall opens actual patch notes while the one original Rickroll stays at About", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div"), root = createRoot(host), opened = jest.fn();
  try {
    act(() => root.render(<MailboxMessage id="lodge" onOpen={opened} />));
    expect(host.textContent).toContain("News from Windfall");
    act(() => host.querySelector("button").click());
    expect(opened).toHaveBeenCalledTimes(1);
    expect(host.textContent).toContain("Island update · 1.0.1");
    expect(host.querySelectorAll("li").length).toBeGreaterThan(3);
    expect(host.querySelector("a").href).toContain("compare/d79d89b...v1.0.1");
    expect(host.querySelector('a[href*="youtube"]')).toBeNull();
    expect(Object.values(mailboxLetters).filter(letter => letter.reward?.url.includes("dQw4w9WgXcQ"))).toHaveLength(1);
    expect(mailboxLetters.home.reward.url).toContain("dQw4w9WgXcQ");
  } finally {
    act(() => root.unmount());
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
