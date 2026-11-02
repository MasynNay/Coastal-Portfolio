import "react-multi-carousel/lib/styles.css";
import colorSharp from "../assets/images/color1.png";

export const Skills = () => {
  return (
    <section className="skill" id="skills">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="skill-bx zoom">
              <h2>Skills</h2>
              <p>
                One of my greatest passions is learning and mastering new
                skills. Here’s an overview of my expertise:
                <br />
                <br />
                <b>Web Development:</b> HTML5, CSS, JavaScript, Node.js,
                Express, MVC, ORM
                <br />
                <b>Graphic Design:</b> Adobe Photoshop, Adobe After Effects,
                Adobe Illustrator
                <br />
                <b>Networking & Security:</b> TCP/IP, DNS, WAN, VPN, Information
                Security, Network Firewalls
                <br />
                <b>Technical Support:</b> Microsoft Windows, Linux, MacOS, iOS,
                Android
                <br />
                <b>Technical Skills:</b> LAN, VoIP, Ethernet
                <br />
                <b>Operating Systems:</b> Microsoft Windows, Windows Server,
                Linux, MacOS
                <br />
                <b>Support & Troubleshooting:</b> Help Desk, Desktop Support, IT
                Support
                <br />
                <b>Virtualization & Security:</b> VMware, Citrix, Disaster
                Recovery
                <br />
                <b>Database & Scripting:</b> SQL, Shell Scripting
                <br />
                <b>Additional Tools:</b> SharePoint, Google Suite, Google Docs,
                SCCM
              </p>
            </div>
          </div>
        </div>
      </div>
      <img className="background-image-left" src={colorSharp} alt="" />
    </section>
  );
};
