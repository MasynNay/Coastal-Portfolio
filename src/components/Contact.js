import { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import contactImg from "../assets/images/contact.svg";
import "animate.css";
import TrackVisibility from "react-on-screen";
import { contactEmail, sendContactMessage } from "./ContactMail";

export const Contact = () => {
  const formInitialDetails = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
    website: "",
  };
  const [formDetails, setFormDetails] = useState(formInitialDetails);
  const [buttonText, setButtonText] = useState("Send");
  const [status, setStatus] = useState({});
  const [isSending, setIsSending] = useState(false);

  const onFormUpdate = (category, value) => {
    setFormDetails((details) => ({ ...details, [category]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSending) return;
    setIsSending(true);
    setButtonText("Sending...");
    setStatus({});

    try {
      await sendContactMessage(formDetails);

      setButtonText("Send");
      setFormDetails(formInitialDetails);
      setStatus({ success: true, message: "Message sent successfully!" });
    } catch (error) {
      console.error(error);
      setButtonText("Send");
      setStatus({
        success: false,
        message:
          "Your message couldn’t be sent. Your details are still here—please try again, or email me directly.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="contact" id="contact">
      <Container>
        <Row className="align-items-center">
          <Col size={12} md={6}>
            <TrackVisibility>
              {({ isVisible }) => (
                <img
                  className={
                    isVisible ? "animate__animated animate__zoomIn" : ""
                  }
                  src={contactImg}
                  alt=""
                />
              )}
            </TrackVisibility>
          </Col>
          <Col size={12} md={6}>
            <TrackVisibility>
              {({ isVisible }) => (
                <div
                  className={
                    isVisible ? "animate__animated animate__fadeIn" : ""
                  }
                >
                  <h2>Contact Me</h2>
                  {/* Shared by the website, desktop window, and Game Mode contact room. */}
                  <p className="contact-description">
                    I’m open to what’s next. If you’re hiring, have a project in
                    mind, or could use a hand figuring something out, send me a
                    message. You’re welcome to just say hello, too.
                  </p>
                  <div className="contact-services-cta">
                    <div>
                      <strong>Looking to have a website built?</strong>
                      <p>
                        Explore design examples, learn about the process, and
                        request a written quote with no phone call required.
                      </p>
                    </div>
                    <a href="/services">Explore website services <span aria-hidden="true">↗</span></a>
                  </div>
                  <form onSubmit={handleSubmit}>
                    {/* This hidden field is only a spam trap; it is never a
                        keyboard or screen-reader destination. */}
                    <div className="contact-trap" aria-hidden="true">
                      <input
                        type="text"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={formDetails.website}
                        onChange={(e) =>
                          onFormUpdate("website", e.target.value)
                        }
                      />
                    </div>
                    <Row>
                      <Col size={12} sm={6} className="px-1">
                        <input
                          type="text"
                          name="firstName"
                          disabled={isSending}
                          aria-label="First name"
                          autoComplete="given-name"
                          required
                          value={formDetails.firstName}
                          placeholder="First Name"
                          onChange={(e) =>
                            onFormUpdate("firstName", e.target.value)
                          }
                        />
                      </Col>
                      <Col size={12} sm={6} className="px-1">
                        <input
                          type="text"
                          name="lastName"
                          disabled={isSending}
                          aria-label="Last name"
                          autoComplete="family-name"
                          value={formDetails.lastName}
                          placeholder="Last Name"
                          onChange={(e) =>
                            onFormUpdate("lastName", e.target.value)
                          }
                        />
                      </Col>
                      <Col size={12} sm={6} className="px-1">
                        <input
                          type="email"
                          name="email"
                          disabled={isSending}
                          aria-label="Email address"
                          autoComplete="email"
                          required
                          value={formDetails.email}
                          placeholder="Email Address"
                          onChange={(e) =>
                            onFormUpdate("email", e.target.value)
                          }
                        />
                      </Col>
                      <Col size={12} sm={6} className="px-1">
                        <input
                          type="tel"
                          name="phone"
                          disabled={isSending}
                          aria-label="Phone number"
                          autoComplete="tel"
                          value={formDetails.phone}
                          placeholder="Phone Number"
                          onChange={(e) =>
                            onFormUpdate("phone", e.target.value)
                          }
                        />
                      </Col>
                      <Col size={12} className="px-1">
                        <textarea
                          rows="6"
                          name="message"
                          disabled={isSending}
                          aria-label="Message"
                          required
                          value={formDetails.message}
                          placeholder="Message"
                          onChange={(e) =>
                            onFormUpdate("message", e.target.value)
                          }
                        ></textarea>
                        {status.message && (
                          <p
                            role="status"
                            className={
                              status.success === false
                                ? "text-danger"
                                : "text-success"
                            }
                          >
                            {status.message}
                            {status.success === false && (
                              <>
                                {" "}
                                <a href={`mailto:${contactEmail}`}>
                                  {contactEmail}
                                </a>
                              </>
                            )}
                          </p>
                        )}
                        <div className="button-container">
                          <button type="submit" disabled={isSending}>
                            <span>{buttonText}</span>
                          </button>
                        </div>
                      </Col>
                    </Row>
                  </form>
                </div>
              )}
            </TrackVisibility>
          </Col>
        </Row>
      </Container>
    </section>
  );
};
