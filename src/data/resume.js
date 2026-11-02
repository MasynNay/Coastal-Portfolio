// Transcribed from Masyn's supplied 2026 resume screenshot.
// Keep the website and desktop resume views in sync through this shared data.
export const profile = {
  name: "Masyn Nay",
  headline: "Systems Administrator | IT Infrastructure | Automation",
  location: "Roy, Utah",
  phone: "(801) 941-3063",
  email: "MasynNay33@gmail.com",
  summary:
    "Resourceful IT professional with 9 years of experience supporting municipal government, healthcare, and business technology. Combines hands-on systems administration with creative problem-solving, automation, and infrastructure project ownership. Experienced in Active Directory, endpoint management, networking, and delivering dependable technology for public safety operations.",
  introduction:
    "I’m an IT professional with nine years of experience supporting municipal government, healthcare, and business technology. My work combines systems administration, creative problem-solving, automation, and infrastructure project ownership, with a focus on dependable technology for public safety operations.",
  interestsIntroduction:
    "Outside work, I enjoy photography, videography, music, exploring AI and emerging technology, and gaming on PC and console. I value time with family and pets, hands-on DIY projects, repairs, and learning new skills.",
  coreSkills: [
    "Active Directory",
    "Microsoft 365",
    "Windows Server",
    "PowerShell",
    "NinjaOne RMM",
    "Group Policy",
    "BitLocker",
    "Sophos Firewalls",
    "DNS / TCP/IP",
    "VPN",
    "VLANs",
    "WAN Failover",
    "Mosyle MDM",
  ],
};

export const experience = [
  {
    employer: "Syracuse City",
    title: "IT Technician",
    location: "Syracuse, UT",
    dates: "September 2023 – Present",
    bullets: [
      "Administer Active Directory accounts, permissions, and employee lifecycle processes across city departments.",
      "Build PowerShell automation and NinjaOne remediation tools for account administration, endpoint configuration, and software deployment.",
      "Support Microsoft 365, endpoint security, network connectivity, and critical police and fire applications.",
      "Coordinate infrastructure troubleshooting and technical work with internal departments and external vendors.",
    ],
  },
  {
    employer: "Peak Homes",
    title: "Information Technology Specialist",
    location: "Ogden, UT",
    dates: "September 2022 – September 2023",
    bullets: [
      "Managed Active Directory access and provided Tier 2 support for office and remote staff.",
      "Troubleshot hardware, applications, and connectivity; maintained inventory and technical documentation.",
      "Supported secure iOS and Android device integration and employee technology needs.",
    ],
  },
  {
    employer: "Steward Health Care",
    title: "Information Systems Specialist",
    location: "Layton, UT",
    dates: "November 2021 – July 2022",
    bullets: [
      "Supported workstations, clinical applications, and network connectivity across four clinics and a satellite ER.",
      "Resolved time-sensitive technical issues to minimize disruption to patient-care operations.",
      "Assisted with healthcare software deployments and HIPAA-conscious system configurations.",
      "Deployed managed mobile devices for clinical staff and supported secure communication.",
    ],
  },
];

export const education = [
  { title: "CompTIA A+", institution: "CompTIA", year: "2024" },
  {
    title: "Full-Stack Software Development Certificate",
    institution: "University of Utah / edX",
    year: "2023",
    detail: "4.0 GPA",
  },
];

export const achievements = [
  {
    title: "Fire Station 32",
    description:
      "Took primary ownership of IT planning and delivery for a new fire station, coordinating cost-conscious equipment selection, vendors, VLANs, wireless, and facility technology.",
    iconLabel: "32",
    tools: "Infrastructure · VLANs · Wireless",
  },
  {
    title: "Starlink Primary Failover",
    description:
      "Deployed Starlink as the city’s primary network failover connection, integrating it into the redundancy plan to keep essential city services and public safety connected during outages.",
    iconLabel: "↗",
    tools: "Primary failover · Network resilience · Public safety",
  },
  {
    title: "Custom AD Administration Tool",
    description:
      "Created a PowerShell application that simplifies onboarding, terminations, account changes, and other recurring IT administration tasks.",
    iconLabel: ">_",
    tools: "PowerShell · Active Directory · Automation",
  },
];

export const interests = [
  {
    title: "Creative Pursuits",
    description:
      "Photography, videography, and music offer opportunities to explore creativity and new perspectives.",
  },
  {
    title: "Technology & Gaming",
    description:
      "Enjoy exploring artificial intelligence, emerging technology, and gaming across PC and console platforms.",
  },
  {
    title: "Life Outside of IT",
    description:
      "Value time with family and pets, hands-on DIY projects, repairs, and learning new skills.",
  },
];
