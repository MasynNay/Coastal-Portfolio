import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { NavBar } from "../components/NavBar";
import { contactEmail, sendContactMessage } from "../components/ContactMail";
import "../designs/glass.css";
import "./WebsiteServices.css";

const designDirections = [
  { name: "Northline", type: "Home services", description: "Clear and trustworthy", theme: "northline" },
  { name: "Kindred", type: "Creative studio", description: "Expressive and playful", theme: "kindred" },
  { name: "Meridian", type: "Consulting", description: "Sharp and professional", theme: "meridian" },
  { name: "Hearth & Honey", type: "Café", description: "Warm and welcoming", theme: "hearth" },
  { name: "Solstice", type: "Wellness", description: "Calm and airy", theme: "solstice" },
  { name: "Forge", type: "Fitness", description: "Bold and energetic", theme: "forge" },
  { name: "Atelier", type: "Product showcase", description: "Editorial and minimal", theme: "atelier" },
  { name: "Orbit", type: "Software", description: "Modern and technical", theme: "orbit" },
  { name: "Evergreen", type: "Events", description: "Bright and celebratory", theme: "evergreen" },
  { name: "Fieldnotes", type: "Photography", description: "Visual and cinematic", theme: "fieldnotes" },
];

const initial = {
  name: "", email: "", business: "", businessType: "", domain: "",
  existingSite: "", style: "", references: "", styleNotes: "", pages: "",
  features: "", budget: "", timeline: "", details: "", website: "",
};

const field = (label, id, children, hint) => (
  <label className="service-field" htmlFor={id}>
    <span>{label}</span>
    {children}
    {hint && <small>{hint}</small>}
  </label>
);

export default function WebsiteServices() {
  const [form, setForm] = useState(initial);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const oldTitle = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const oldDescription = meta?.getAttribute("content");
    document.title = "Website Design & Development | Masyn Nay";
    meta?.setAttribute("content", "Custom, mobile-friendly websites for small businesses. Email-first projects with written quotes, domain setup and a clear handoff.");
    return () => {
      document.title = oldTitle;
      if (meta && oldDescription !== null && oldDescription !== undefined) meta.setAttribute("content", oldDescription);
    };
  }, []);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setFeedback(null);
    const message = [
      "WEBSITE DEVELOPMENT INQUIRY",
      "Business: " + form.business,
      "Business type: " + (form.businessType || "Not specified"),
      "Domain status: " + form.domain,
      "Existing website: " + (form.existingSite || "Not provided"),
      "Preferred design direction: " + (form.style || "Open to ideas"),
      "Inspiration websites: " + (form.references || "Not provided"),
      "Visual preferences: " + (form.styleNotes || "Not provided"),
      "Pages needed: " + (form.pages || "Not sure yet"),
      "Features needed: " + (form.features || "Not sure yet"),
      "Budget: " + (form.budget || "Not specified"),
      "Timing: " + (form.timeline || "Flexible"),
      "Other details: " + (form.details || "None"),
    ].join("\n");
    try {
      await sendContactMessage({
        firstName: form.name.trim(),
        lastName: "",
        email: form.email.trim(),
        phone: "",
        message,
        website: form.website,
      }, window.location.href, "New website development inquiry");
      setForm(initial);
      setFeedback({ ok: true, text: "Thanks! Your request was sent. I'll review it and reply by email." });
    } catch (error) {
      console.error("Website inquiry could not be sent", error);
      setFeedback({ ok: false, text: "The request could not be sent. Your answers are still here. Please try again or use the email link below." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="glass-site website-services">
      <a className="glass-skip" href="#service-main">Skip to content</a>
      <NavBar glass />
      <main id="service-main" tabIndex={-1}>
        <header className="service-hero">
          <div className="container">
            <span className="glass-eyebrow">INDEPENDENT WEBSITE DESIGN & DEVELOPMENT</span>
            <div className="service-hero-grid">
              <div>
                <h1>A website that feels like <em>your</em> business.</h1>
                <p>Custom, mobile-friendly websites for small businesses and independent creators. You share what you need. I take care of the design, code, domain setup, and launch.</p>
                <div className="service-actions">
                  <a className="service-primary" href="#request">Request a written quote <span aria-hidden="true">↗</span></a>
                  <a className="service-secondary" href="#designs">Explore design directions</a>
                </div>
                <p className="service-fineprint">Email-first process. No calls required. No commitment to request a quote.</p>
              </div>
              <div className="service-hero-art" aria-label="Abstract preview of a clean website layout" role="img">
                <div className="service-art-browser"><span/><span/><span/><i>your brand</i></div>
                <div className="service-art-title"><b>Made for what<br/>you do.</b><span>Thoughtful design. Clear purpose.</span></div>
                <div className="service-art-blocks"><i/><i/><i/></div>
                <div className="service-art-pill">YOUR BUSINESS, YOUR WEBSITE</div>
              </div>
            </div>
          </div>
        </header>

        <section className="service-section" id="offer">
          <div className="container">
            <div className="service-heading"><span className="glass-eyebrow">WHAT'S INCLUDED</span><h2>One person, from first idea to launch.</h2><p>Whether you have an existing domain or are starting from scratch, you won't need to learn the technical pieces.</p></div>
            <div className="service-benefits">
              <article><strong>01</strong><h3>Design & development</h3><p>A responsive website tailored to your business, using your branding and inspiration.</p></article>
              <article><strong>02</strong><h3>Domain & launch</h3><p>Help connecting a domain you already own, or choosing and configuring a new one in your name.</p></article>
              <article><strong>03</strong><h3>Written approvals</h3><p>Clear scope, a preview to review, agreed revisions, and progress updates by email.</p></article>
              <article><strong>04</strong><h3>Clean handoff</h3><p>Access to your site, source deliverables, and clear information about ongoing third-party costs.</p></article>
            </div>
            <div className="service-price">
              <div><span className="glass-eyebrow">PRICING GUIDANCE</span><h3>Small business websites typically start at $1,500.</h3><p>Final price depends on pages, features, and existing systems. You'll receive a written proposal before any deposit, with third-party costs identified separately.</p></div>
              <a href="#request">Tell me about your project ↗</a>
            </div>
          </div>
        </section>

        <section className="service-section service-design-section" id="designs">
          <div className="container">
            <div className="service-heading"><span className="glass-eyebrow">VISUAL STARTING POINTS</span><h2>Ten directions. Your own identity.</h2><p>Choose a general style or share any site you like, such as Nike or Apple. These are design directions, not previous client projects. Your final site will be customized.</p></div>
            <div className="service-design-grid">
              {designDirections.map((item) => (
                <button key={item.name} type="button" className={"service-design-card " + item.theme + (form.style === item.name ? " selected" : "")} onClick={() => {set("style", item.name); document.getElementById("request")?.scrollIntoView({ behavior: "smooth" });}} aria-label={"Select " + item.name + " design direction"}>
                  <div className="service-design-preview"><span className="preview-label">{item.name}</span><span className="preview-line"/><span className="preview-shape"/></div>
                  <div className="service-design-meta"><strong>{item.name}</strong><span>{item.type}</span><small>{item.description}</small></div>
                </button>
              ))}
            </div>
            <p className="service-design-note">Don't see your style? That's fine. Inspiration links and screenshots can guide a custom direction.</p>
          </div>
        </section>

        <section className="service-section service-process" id="process">
          <div className="container">
            <div className="service-heading"><span className="glass-eyebrow">HOW IT WORKS</span><h2>Clear steps. No mystery fees.</h2></div>
            <ol className="service-steps">
              <li><strong>Tell me what you need</strong><span>Submit the short form below, including any websites you like.</span></li>
              <li><strong>Review the written proposal</strong><span>Agree on scope, timeline, ownership, revisions, and payment terms before work begins.</span></li>
              <li><strong>Approve your preview</strong><span>Pay the agreed deposit, review the design, and send feedback by email.</span></li>
              <li><strong>Launch and handoff</strong><span>After final approval and payment, your website goes live and you receive the agreed access and files.</span></li>
            </ol>
          </div>
        </section>

        <section className="service-section service-request" id="request">
          <div className="container service-request-layout">
            <div className="service-request-intro">
              <span className="glass-eyebrow">START A PROJECT</span>
              <h2>Tell me about your website.</h2>
              <p>You don't need to know technical terminology. Answer what you can; we'll work out the details by email.</p>
              <div className="service-disclosure">
                <h3>Before you submit</h3>
                <p>A request is not a contract and does not require payment. We agree on the scope and pricing in writing before any work begins. Domain and hosting accounts remain under your control.</p>
                <p>Form details are delivered through a third-party email form service. Please don't enter passwords, payment card information, or other sensitive information.</p>
              </div>
            </div>
            <form className="service-form" onSubmit={submit}>
              <div className="service-trap" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set("website", e.target.value)} /></div>
              <div className="service-form-grid">
                {field("Your name *", "service-name", <input id="service-name" required autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" />)}
                {field("Email address *", "service-email", <input id="service-email" type="email" required autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />)}
              </div>
              {field("Business or project name *", "service-business", <input id="service-business" required value={form.business} onChange={(e) => set("business", e.target.value)} placeholder="What should your website be called?" />)}
              {field("What does your business do?", "service-business-type", <input id="service-business-type" value={form.businessType} onChange={(e) => set("businessType", e.target.value)} placeholder="e.g. local landscaping, photography, consulting" />)}
              <div className="service-form-grid">
                {field("Do you have a domain? *", "service-domain", <select id="service-domain" required value={form.domain} onChange={(e) => set("domain", e.target.value)}><option value="">Select one</option><option>I already own a domain</option><option>I need help getting a domain</option><option>I'm not sure</option></select>)}
                {field("Existing website (optional)", "service-existing", <input id="service-existing" type="url" value={form.existingSite} onChange={(e) => set("existingSite", e.target.value)} placeholder="https://example.com" />)}
              </div>
              {field("A design direction you like", "service-style", <select id="service-style" value={form.style} onChange={(e) => set("style", e.target.value)}><option value="">I'd like your recommendation</option>{designDirections.map((item) => <option value={item.name} key={item.name}>{item.name} — {item.type}</option>)}<option value="Something else">Something else entirely</option></select>)}
              {field("Websites you admire", "service-references", <textarea id="service-references" rows="2" value={form.references} onChange={(e) => set("references", e.target.value)} placeholder="Links to websites you love, even if they're in another industry" />, "Tell me what you like about them. I use references for inspiration, not to copy other brands.")}
              {field("Colors, logo, and overall feeling", "service-style-notes", <textarea id="service-style-notes" rows="2" value={form.styleNotes} onChange={(e) => set("styleNotes", e.target.value)} placeholder="Already have a logo? Want something light, dark, bold, calm?" />)}
              <div className="service-form-grid">
                {field("Pages needed", "service-pages", <input id="service-pages" value={form.pages} onChange={(e) => set("pages", e.target.value)} placeholder="e.g. Home, About, Services, Contact" />)}
                {field("Budget range", "service-budget", <select id="service-budget" value={form.budget} onChange={(e) => set("budget", e.target.value)}><option value="">Not sure yet</option><option>Under $1,500</option><option>$1,500–$2,500</option><option>$2,500–$5,000</option><option>$5,000+</option></select>)}
              </div>
              {field("Features you need", "service-features", <textarea id="service-features" rows="2" value={form.features} onChange={(e) => set("features", e.target.value)} placeholder="Contact form, gallery, booking link, links to Etsy or Shopify, etc." />)}
              {field("Ideal timeline", "service-timeline", <select id="service-timeline" value={form.timeline} onChange={(e) => set("timeline", e.target.value)}><option value="">Flexible / not sure</option><option>Within 1 month</option><option>1–3 months</option><option>3+ months</option></select>)}
              {field("Anything else?", "service-details", <textarea id="service-details" rows="3" value={form.details} onChange={(e) => set("details", e.target.value)} placeholder="Goals, current frustrations, preferred flow, or questions" />)}
              <button className="service-submit" type="submit" disabled={sending}>{sending ? "Sending request…" : "Send website inquiry →"}</button>
              {feedback && <p role="status" className={feedback.ok ? "service-success" : "service-error"}>{feedback.text}{!feedback.ok && <> <a href={"mailto:" + contactEmail}>Email directly</a>.</>}</p>}
              <p className="service-form-note">No payment is taken here. Communication is by email unless we agree otherwise. Please share logo files or screenshots later by an agreed method.</p>
            </form>
          </div>
        </section>
      </main>
      <footer className="container service-footer"><Link to="/">← Back to portfolio</Link><span>Independent design & development · Written quotes · No calls required</span></footer>
    </div>
  );
}
