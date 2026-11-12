import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { projectById } from "../data/projects";
import { NavBar } from "../components/NavBar";
import { contactEmail, sendContactMessage } from "../components/ContactMail";
import "../designs/glass.css";
import "./WebsiteServices.css";

// Concept links open standalone sites. Published work comes from the same
// project catalog that powers the portfolio, so destinations stay in sync.
const examples = [
  {
    id: "brightside",
    title: "Brightside Electric",
    type: "Home Services",
    description:
      "A residential electrician’s site with service cards and an estimate checklist that changes with the visitor’s project.",
    href: "/demos/website-services/brightside.html",
    image: "/demos/website-services/brightside-preview.webp",
  },
  {
    id: "juniper",
    title: "Juniper Movement",
    type: "Classes & Appointments",
    description:
      "A Pilates studio with a timetable visitors can filter by level and a first-visit guide for beginners.",
    href: "/demos/website-services/juniper.html",
    image: "/demos/website-services/juniper-preview.webp",
  },
  {
    id: "stillform",
    title: "Stillform Ceramics",
    type: "Online Store",
    description:
      "A small ceramics storefront with a sample shopping bag that tracks quantities and subtotal.",
    href: "/demos/website-services/stillform.html",
    image: "/demos/website-services/stillform-preview.webp",
  },
  {
    id: "open-table",
    title: "Open Table Pantry",
    type: "Nonprofit & Community",
    description:
      "A neighborhood pantry with separate paths for finding grocery pickup hours and exploring volunteer roles.",
    href: "/demos/website-services/open-table.html",
    image: "/demos/website-services/open-table-preview.webp",
  },
  {
    id: "alder",
    title: "Alder Advisory",
    type: "Professional Services",
    description:
      "A consulting practice with expandable areas of expertise and a sample case study for prospective clients.",
    href: "/demos/website-services/alder.html",
    image: "/demos/website-services/alder-preview.webp",
  },
  {
    id: "daybreak",
    title: "Daybreak Bakehouse",
    type: "Food & Hospitality",
    description:
      "A café and bakery with a filterable menu, clear prices, and hours that are easy to find before visiting.",
    href: "/demos/website-services/daybreak.html",
    image: "/demos/website-services/daybreak-preview.webp",
  },
];

const featuredProject = projectById.mgt;
const publishedWork = [
  {
    project: featuredProject,
    label: "Past Client Project",
    description:
      "I built the original site for classes, photos, and parent resources. The studio now works with another administrator, and this link opens my preserved version.",
    action: "View Archived Site",
  },
  {
    project: projectById.aftertone,
    label: "Interactive Web App",
    description:
      "An interactive music discovery app with catalog search, audio previews, and saved favorites.",
    action: "Visit Website",
  },
];

function ExamplePreview({ href, image, title, eager = false }) {
  return (
    <a
      className="service-example-preview"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${title} in a new tab`}
    >
      <span className="service-example-browser" aria-hidden="true">
        <span className="service-browser-dots">
          <i />
          <i />
          <i />
        </span>
        <span>{title}</span>
        <span>↗</span>
      </span>
      <img
        src={image}
        alt=""
        width="960"
        height="600"
        loading={eager ? "eager" : "lazy"}
      />
    </a>
  );
}

const initial = {
  name: "",
  email: "",
  business: "",
  businessType: "",
  domain: "",
  existingSite: "",
  style: "",
  references: "",
  styleNotes: "",
  pages: "",
  features: "",
  budget: "",
  timeline: "",
  details: "",
  website: "",
};

const field = (label, id, children, hint) => (
  <label className="service-field" htmlFor={id}>
    <span>{label}</span>
    {children}
    {hint && <small>{hint}</small>}
  </label>
);

export default function WebsiteServices() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(() => {
    const direction = searchParams.get("direction");
    return {
      ...initial,
      style: examples.find((item) => item.id === direction)?.title || "",
    };
  });
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    // A concept opens this route directly. The browser may resolve the hash
    // before React has mounted the quote form.
    if (window.location.hash === "#request")
      document
        .getElementById("request")
        ?.scrollIntoView({ behavior: "instant" });

    const oldTitle = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const oldDescription = meta?.getAttribute("content");
    document.title = "Utah Website Design for Small Businesses | Masyn Nay";
    meta?.setAttribute(
      "content",
      "Utah website design and development for small businesses in Weber, Davis and Utah counties. Custom mobile-friendly websites, clear proposals and written quotes.",
    );
    return () => {
      document.title = oldTitle;
      if (meta && oldDescription !== null && oldDescription !== undefined)
        meta.setAttribute("content", oldDescription);
    };
  }, []);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  function chooseDirection(name) {
    set("style", name);
    const select = document.getElementById("service-style");
    select?.focus({ preventScroll: true });
    select?.scrollIntoView({ block: "center" });
  }

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
      await sendContactMessage(
        {
          firstName: form.name.trim(),
          lastName: "",
          email: form.email.trim(),
          phone: "",
          message,
          website: form.website,
        },
        window.location.href,
        "New website development inquiry",
      );
      setForm(initial);
      setFeedback({
        ok: true,
        text: "Thanks! Your request was sent. I'll review it and reply by email.",
      });
    } catch (error) {
      console.error("Website inquiry could not be sent", error);
      setFeedback({
        ok: false,
        text: "The request could not be sent. Your answers are still here. Please try again or use the email link below.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="glass-site website-services">
      <a className="glass-skip" href="#service-main">
        Skip to Content
      </a>
      <NavBar glass />
      <main id="service-main" tabIndex={-1}>
        <header className="service-hero">
          <div className="container">
            <span className="glass-eyebrow">
              INDEPENDENT WEBSITE DESIGN & DEVELOPMENT
            </span>
            <div className="service-hero-grid">
              <div>
                <h1>
                  Utah website design that feels like <em>your</em> business.
                </h1>
                <p>
                  Custom, mobile-friendly websites for small businesses in
                  Weber County, Davis County, Utah County, and across Utah.
                  You share what you need. I handle the design, code, domain setup, and launch.
                  Remote projects elsewhere in the United States are welcome, too.
                </p>
                <div className="service-actions">
                  <a className="service-primary" href="#request">
                    Request a Written Quote <span aria-hidden="true">↗</span>
                  </a>
                  <a className="service-secondary" href="#designs">
                    View Website Examples
                  </a>
                </div>
                <p className="service-fineprint">
                  Email-first process. No calls required. No commitment to
                  request a quote.
                </p>
              </div>
              <figure className="service-hero-example">
                <ExamplePreview
                  href={featuredProject.website}
                  image={featuredProject.imgUrl}
                  title={featuredProject.title}
                  eager
                />
                <figcaption>
                  <span>Past Client Project</span>{" "}
                  <a
                    href={featuredProject.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Archived Site <span aria-hidden="true">↗</span>
                  </a>
                </figcaption>
              </figure>
            </div>
          </div>
        </header>

        <section
          className="service-section service-design-section"
          id="designs"
        >
          <div className="container">
            <div className="service-heading">
              <span className="glass-eyebrow">WEBSITE EXAMPLES</span>
              <h2>See what your site could do.</h2>
              <p>
                Try six working concepts for fictional businesses. Each is built
                around a different goal, from getting an estimate to finding a
                class or browsing a shop.
              </p>
            </div>
            <div className="service-example-grid service-concept-grid">
              {examples.map((item) => (
                <article className="service-example-card" key={item.id}>
                  <ExamplePreview {...item} />
                  <div className="service-example-copy">
                    <span className="service-example-label">
                      Concept Site · {item.type}
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <div className="service-example-actions">
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open Example <span aria-hidden="true">↗</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => chooseDirection(item.title)}
                      >
                        Use This Direction
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <h3 className="service-work-heading">Published Work</h3>
            <div className="service-example-grid">
              {publishedWork.map(({ project, label, description, action }) => (
                <article className="service-example-card" key={project.id}>
                  <ExamplePreview
                    href={project.website}
                    image={project.imgUrl}
                    title={project.title}
                  />
                  <div className="service-example-copy">
                    <span className="service-example-label">{label}</span>
                    <h3>{project.title}</h3>
                    <p>{description}</p>
                    <div className="service-example-actions">
                      <a
                        href={project.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {action} <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="service-section" id="offer">
          <div className="container">
            <div className="service-heading">
              <span className="glass-eyebrow">WHAT'S INCLUDED</span>
              <h2>One person, from first idea to launch.</h2>
              <p>
                Whether you have an existing domain or are starting from
                scratch, you won't need to learn the technical pieces.
              </p>
            </div>
            <div className="service-benefits">
              <article>
                <strong>01</strong>
                <h3>Design & development</h3>
                <p>
                  A responsive website tailored to your business, using your
                  branding and inspiration.
                </p>
              </article>
              <article>
                <strong>02</strong>
                <h3>Domain & launch</h3>
                <p>
                  Help connecting a domain you already own, or choosing and
                  configuring a new one in your name.
                </p>
              </article>
              <article>
                <strong>03</strong>
                <h3>Written approvals</h3>
                <p>
                  Clear scope, a preview to review, agreed revisions, and
                  progress updates by email.
                </p>
              </article>
              <article>
                <strong>04</strong>
                <h3>Clean handoff</h3>
                <p>
                  Access to your site, source deliverables, and clear
                  information about ongoing third-party costs.
                </p>
              </article>
            </div>
            <div className="service-price">
              <div>
                <span className="glass-eyebrow">PRICING GUIDANCE</span>
                <h3>Small business websites typically start at $1,500.</h3>
                <p>
                  Final price depends on pages, features, and existing systems.
                  You'll receive a written proposal before any deposit, with
                  third-party costs identified separately.
                </p>
              </div>
              <a href="#request">Tell Me About Your Project ↗</a>
            </div>
          </div>
        </section>


        <section className="service-section service-areas" id="service-areas">
          <div className="container">
            <div className="service-heading">
              <span className="glass-eyebrow">UTAH WEBSITE DESIGN</span>
              <h2>Building websites for Utah businesses.</h2>
              <p>
                Based in northern Utah, I work remotely with small businesses
                across the state. Whether you're opening your first business,
                improving an outdated website, or need an easy way for customers
                to contact you, I can help plan and build a site that fits.
              </p>
            </div>
            <div className="service-area-grid">
              <article>
                <h3>Weber County</h3>
                <p>Websites for businesses around Ogden, Roy, Hooper, and surrounding Weber County communities. Clear services, fast mobile layouts, and simple ways for customers to reach you.</p>
              </article>
              <article>
                <h3>Davis County</h3>
                <p>Website design for Layton, Syracuse, Clearfield, Farmington, Bountiful, and nearby Davis County businesses. A useful online presence without a complicated maintenance workflow.</p>
              </article>
              <article>
                <h3>Utah County</h3>
                <p>Websites for Provo, Orem, Lehi, American Fork, and Utah County businesses. Present your services and portfolio, collect inquiries, and make your business easier to understand.</p>
              </article>
            </div>
            <p className="service-area-note">
              Also serving Salt Lake County, the rest of Utah, and remote clients
              throughout the United States. Projects are managed online and by email.
              No local office visits are implied or required.
            </p>
            <div className="service-area-actions">
              <a href="/utah-web-design/">Read my Utah website design guide ↗</a>
              <a href="#request">Request a free written quote ↗</a>
            </div>
          </div>
        </section>

        <section className="service-section service-process" id="process">
          <div className="container">
            <div className="service-heading">
              <span className="glass-eyebrow">HOW IT WORKS</span>
              <h2>Clear steps. No mystery fees.</h2>
            </div>
            <ol className="service-steps">
              <li>
                <strong>Tell me what you need</strong>
                <span>
                  Submit the short form below, including any websites you like.
                </span>
              </li>
              <li>
                <strong>Review the written proposal</strong>
                <span>
                  Agree on scope, timeline, ownership, revisions, and payment
                  terms before work begins.
                </span>
              </li>
              <li>
                <strong>Approve your preview</strong>
                <span>
                  Pay the agreed deposit, review the design, and send feedback
                  by email.
                </span>
              </li>
              <li>
                <strong>Launch and handoff</strong>
                <span>
                  After final approval and payment, your website goes live and
                  you receive the agreed access and files.
                </span>
              </li>
            </ol>
          </div>
        </section>

        <section className="service-section service-request" id="request">
          <div className="container service-request-layout">
            <div className="service-request-intro">
              <span className="glass-eyebrow">START A PROJECT</span>
              <h2>Tell me about your website.</h2>
              <p>
                You don't need to know technical terminology. Answer what you
                can; we'll work out the details by email.
              </p>
              <div className="service-disclosure">
                <h3>Before you submit</h3>
                <p>
                  A request is not a contract and does not require payment. We
                  agree on the scope and pricing in writing before any work
                  begins. Domain and hosting accounts remain under your control.
                </p>
                <p>
                  Form details are delivered through a third-party email form
                  service. Please don't enter passwords, payment card
                  information, or other sensitive information.
                </p>
              </div>
            </div>
            <form className="service-form" onSubmit={submit}>
              <div className="service-trap" aria-hidden="true">
                <input
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                />
              </div>
              <div className="service-form-grid">
                {field(
                  "Your name *",
                  "service-name",
                  <input
                    id="service-name"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Your name"
                  />,
                )}
                {field(
                  "Email address *",
                  "service-email",
                  <input
                    id="service-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@example.com"
                  />,
                )}
              </div>
              {field(
                "Business or project name *",
                "service-business",
                <input
                  id="service-business"
                  required
                  value={form.business}
                  onChange={(e) => set("business", e.target.value)}
                  placeholder="What should your website be called?"
                />,
              )}
              {field(
                "What does your business do?",
                "service-business-type",
                <input
                  id="service-business-type"
                  value={form.businessType}
                  onChange={(e) => set("businessType", e.target.value)}
                  placeholder="e.g. local landscaping, photography, consulting"
                />,
              )}
              <div className="service-form-grid">
                {field(
                  "Do you have a domain? *",
                  "service-domain",
                  <select
                    id="service-domain"
                    required
                    value={form.domain}
                    onChange={(e) => set("domain", e.target.value)}
                  >
                    <option value="">Select one</option>
                    <option>I already own a domain</option>
                    <option>I need help getting a domain</option>
                    <option>I'm not sure</option>
                  </select>,
                )}
                {field(
                  "Existing website (optional)",
                  "service-existing",
                  <input
                    id="service-existing"
                    type="url"
                    value={form.existingSite}
                    onChange={(e) => set("existingSite", e.target.value)}
                    placeholder="https://example.com"
                  />,
                )}
              </div>
              {field(
                "A design direction you like",
                "service-style",
                <select
                  id="service-style"
                  value={form.style}
                  onChange={(e) => set("style", e.target.value)}
                >
                  <option value="">I'd like your recommendation</option>
                  {examples.map((item) => (
                    <option value={item.title} key={item.id}>
                      {item.title} — {item.type}
                    </option>
                  ))}
                  <option value="Something else">
                    Something else entirely
                  </option>
                </select>,
              )}
              {field(
                "Websites you admire",
                "service-references",
                <textarea
                  id="service-references"
                  rows="2"
                  value={form.references}
                  onChange={(e) => set("references", e.target.value)}
                  placeholder="Links to websites you love, even if they're in another industry"
                />,
                "Tell me what you like about them. I use references for inspiration, not to copy other brands.",
              )}
              {field(
                "Colors, logo, and overall feeling",
                "service-style-notes",
                <textarea
                  id="service-style-notes"
                  rows="2"
                  value={form.styleNotes}
                  onChange={(e) => set("styleNotes", e.target.value)}
                  placeholder="Already have a logo? Want something light, dark, bold, calm?"
                />,
              )}
              <div className="service-form-grid">
                {field(
                  "Pages needed",
                  "service-pages",
                  <input
                    id="service-pages"
                    value={form.pages}
                    onChange={(e) => set("pages", e.target.value)}
                    placeholder="e.g. Home, About, Services, Contact"
                  />,
                )}
                {field(
                  "Budget range",
                  "service-budget",
                  <select
                    id="service-budget"
                    value={form.budget}
                    onChange={(e) => set("budget", e.target.value)}
                  >
                    <option value="">Not sure yet</option>
                    <option>Under $1,500</option>
                    <option>$1,500–$2,500</option>
                    <option>$2,500–$5,000</option>
                    <option>$5,000+</option>
                  </select>,
                )}
              </div>
              {field(
                "Features you need",
                "service-features",
                <textarea
                  id="service-features"
                  rows="2"
                  value={form.features}
                  onChange={(e) => set("features", e.target.value)}
                  placeholder="Contact form, gallery, booking link, links to Etsy or Shopify, etc."
                />,
              )}
              {field(
                "Ideal timeline",
                "service-timeline",
                <select
                  id="service-timeline"
                  value={form.timeline}
                  onChange={(e) => set("timeline", e.target.value)}
                >
                  <option value="">Flexible / not sure</option>
                  <option>Within 1 month</option>
                  <option>1–3 months</option>
                  <option>3+ months</option>
                </select>,
              )}
              {field(
                "Anything else?",
                "service-details",
                <textarea
                  id="service-details"
                  rows="3"
                  value={form.details}
                  onChange={(e) => set("details", e.target.value)}
                  placeholder="Goals, current frustrations, preferred flow, or questions"
                />,
              )}
              <button
                className="service-submit"
                type="submit"
                disabled={sending}
              >
                {sending ? "Sending Request…" : "Send Website Inquiry →"}
              </button>
              {feedback && (
                <p
                  role="status"
                  className={feedback.ok ? "service-success" : "service-error"}
                >
                  {feedback.text}
                  {!feedback.ok && (
                    <>
                      {" "}
                      <a href={"mailto:" + contactEmail}>Email Directly</a>.
                    </>
                  )}
                </p>
              )}
              <p className="service-form-note">
                No payment is taken here. Communication is by email unless we
                agree otherwise. Please share logo files or screenshots later by
                an agreed method.
              </p>
            </form>
          </div>
        </section>
      </main>
      <footer className="container service-footer">
        <Link to="/">← Back to Portfolio</Link>
        <span>
          Independent design & development · Written quotes · No calls required
        </span>
      </footer>
    </div>
  );
}
