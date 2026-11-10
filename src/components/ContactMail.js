import { profile } from "../data/resume";
export const contactEmail = profile.email.toLowerCase();
export const contactSubject = "Someone sent you a message from your portfolio";

// All three portfolio modes use this delivery boundary. FormSubmit owns mail
// delivery and recipient activation; no private mail credentials ship to visitors.
export async function sendContactMessage(
  details,
  pageUrl = window.location.href,
  subject = contactSubject,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${contactEmail}`, {
      method: "POST",
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        name: [details.firstName.trim(), details.lastName.trim()]
          .filter(Boolean)
          .join(" "),
        email: details.email.trim(),
        phone: details.phone.trim() || "Not provided",
        message: details.message.trim(),
        _replyto: details.email.trim(),
        _subject: subject,
        _template: "table",
        _url: pageUrl,
        _honey: details.website || "",
      }),
    });
    const result = await response.json();
    // Some service errors arrive as HTTP 200 with success:"false". Do not clear
    // the visitor's message or show a success state for a rejected submission.
    if (!response.ok || ![true, "true"].includes(result.success))
      throw new Error(
        result.message || "The contact service rejected the message.",
      );
    return result;
  } finally {
    clearTimeout(timeout);
  }
}
