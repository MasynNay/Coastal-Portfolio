import { Container, Row, Col } from "react-bootstrap";
import BrandMark from "./BrandMark";
import nav1 from "../assets/images/nav1.svg";
import nav2 from "../assets/images/nav2.svg";
import nav3 from "../assets/images/nav3.svg";

export const Footer = () => {
  return (
    <footer className="footer">
      <Container>
        <Row className="align-items-center">
          <Col size={12} sm={6}>
            <div className="footerlogo">
              <a href="/" className="brand-link" aria-label="Masyn Nay home">
                <BrandMark size="footer" decorative />
              </a>
            </div>
          </Col>
          <Col size={12} sm={6} className="text-center text-sm-end">
            <div className="social-icon">
              <a href="https://www.linkedin.com/in/masyn-nay-290225201/">
                <img src={nav1} alt="Icon" />
              </a>
              <a href="https://github.com/MasynNay">
                <img src={nav2} alt="Icon" />
              </a>
              <a href="https://www.instagram.com/masynnay/">
                <img src={nav3} alt="Icon" />
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};
