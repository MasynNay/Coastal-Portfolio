import { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import contactImg from "../assets/images/contact.svg";
import "animate.css";
import TrackVisibility from "react-on-screen";
import emailjs from "emailjs-com";

export const Contact = () => {
  const formInitialDetails = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
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

    try {
      const serviceID = "service_qgcqxfq";
      const templateID = "template_3kptr7o";
      const userID = "chpuBHqXeXXq-CaCF";

      await emailjs.send(
        serviceID,
        templateID,
        {
          firstName: formDetails.firstName,
          lastName: formDetails.lastName,
          email: formDetails.email,
          phone: formDetails.phone,
          message: formDetails.message,
        },
        userID,
      );

      setButtonText("Send");
      setFormDetails(formInitialDetails);
      setStatus({ success: true, message: "Message sent successfully!" });
    } catch (error) {
      console.error(error);
      setButtonText("Send");
      setStatus({
        success: false,
        message: "Failed to send message. Please try again later.",
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
                  <form onSubmit={handleSubmit}>
                    <Row>
                      <Col size={12} sm={6} className="px-1">
                        <input
                          type="text"
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
