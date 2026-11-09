// Shared facts for the website, Mac apps and game rooms; layouts live in each mode.
import { achievements } from "../data/resume";
import { webProjects } from "../data/projects";
export const projects = [
  ...webProjects,
  ...achievements.map((item) => ({
    ...item,
    category: "IT",
    label: "IT / KEY ACHIEVEMENT",
  })),
  {
    title: "CompTIA A+",
    category: "IT",
    label: "05 / CERTIFICATION",
    description:
      "Completed in May 2024, covering the foundations of computer hardware, software, networking, and technical support.",
    tools: "Hardware · Software · Networking",
  },
];

// These groups expand existing resume and project evidence; they are not new experience claims.
const skillGroups = [
  {
    title: "Front-end development",
    items: [
      "HTML5",
      "CSS",
      "JavaScript",
      "React",
      "jQuery",
      "Bootstrap",
      "Tailwind CSS",
      "Responsive design",
      "State management",
      "Browser audio",
      "Browser storage",
    ],
  },
  {
    title: "Back-end & APIs",
    items: [
      "Node.js",
      "Express.js",
      "Python",
      "WebSockets",
      "Third-party API integration",
      "REST APIs",
      "JSON",
      "GraphQL",
      "Apollo",
      "MVC",
      "ORM",
    ],
  },
  {
    title: "Desktop apps & interactive systems",
    items: [
      "Tkinter",
      "OpenCV color tracking",
      "Libretro integration",
      "Cross-platform application packaging",
      "PyInstaller",
      "Real-time multiplayer",
    ],
  },
  {
    title: "Databases",
    items: ["SQL", "MySQL", "MongoDB", "Mongoose", "Database theory"],
  },
  {
    title: "IT support & operations",
    items: [
      "Help desk",
      "Desktop support",
      "Remote support",
      "Hardware troubleshooting",
      "Software troubleshooting",
      "Software deployment",
      "Device inventory",
      "Technical documentation",
      "Tier 2 support",
      "Public safety applications",
    ],
  },
  {
    title: "Systems & virtualization",
    items: [
      "Windows",
      "Windows Server",
      "Linux (Mint & Ubuntu)",
      "macOS",
      "iOS",
      "Android",
      "VMware",
      "Citrix",
      "Backup & recovery",
      "Endpoint management",
      "Mosyle MDM",
    ],
  },
  {
    title: "Networks & security",
    items: [
      "TCP/IP",
      "DNS",
      "LAN",
      "WAN",
      "VPN",
      "Ethernet",
      "VoIP",
      "Network firewalls",
      "Information security",
      "Network troubleshooting",
      "VLANs",
      "WAN failover",
      "Starlink backup connectivity",
      "BitLocker",
      "Sophos firewalls",
      "Endpoint security",
    ],
  },
  {
    title: "Automation & administration",
    items: [
      "PowerShell",
      "Shell scripting",
      "Active Directory",
      "User accounts & permissions",
      "SCCM",
      "SharePoint",
      "Group Policy",
      "NinjaOne RMM",
      "NinjaOne remediation",
      "Employee lifecycle administration",
    ],
  },
  {
    title: "Design & motion",
    items: [
      "Adobe Photoshop",
      "Adobe Illustrator",
      "Adobe After Effects",
      "Graphic design",
      "UI/UX design",
    ],
  },
  {
    title: "Tools & collaboration",
    items: [
      "Git",
      "GitHub",
      "GitHub Actions",
      "GitHub Pages",
      "Agile methodologies",
      "Postman",
      "QA testing",
      "Heroku",
      "SEO",
      "Google Suite",
      "Google Docs",
      "Microsoft Office",
      "Microsoft 365",
    ],
  },
  {
    // Based on Masyn's own description of using and correcting AI, not an ML engineering claim.
    title: "AI-assisted workflows",
    items: [
      "Prompt engineering & iteration",
      "AI output evaluation",
      "Fact-checking & verification",
      "Identifying AI errors",
      "AI-assisted troubleshooting",
      "AI-assisted coding & review",
      "Task decomposition",
      "Human-in-the-loop quality control",
    ],
  },
];

export const skills = skillGroups.map((skill) => ({
  ...skill,
  detail: skill.items.join(", "),
}));
