import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
    projectId: "clawjob",
  });
}

const db = getFirestore();

interface SeedJob {
  company: string;
  role: string;
  location: string;
  salary: string;
  manager: { name: string; title: string; tagline: string; photo: string };
  hr: { name: string; title: string; photo: string; email: string; phone: string };
  tags: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  companyLogo: string;
  teamSize: string;
  culture: string[];
}

const jobs: SeedJob[] = [
  {
    company: "Apex Robotics",
    role: "Senior Frontend Engineer",
    location: "San Francisco, CA",
    salary: "$165,000 - $210,000",
    manager: {
      name: "Sarah Chen",
      title: "VP of Engineering",
      tagline: "Building the future of human-robot interaction",
      photo: "/assets/managers/sarah.jpg",
    },
    hr: {
      name: "David Park",
      title: "Senior Recruiter",
      photo: "/assets/hr/david.jpg",
      email: "david.park@apexrobotics.com",
      phone: "(415) 555-0142",
    },
    tags: ["React", "TypeScript", "WebGL", "Robotics"],
    description:
      "Join our team to build the control interfaces for next-generation industrial robots. You will design and implement real-time dashboards that operators use to manage fleets of autonomous machines across factory floors worldwide.",
    requirements: [
      "5+ years of experience with React and TypeScript",
      "Experience with real-time data visualization (D3, WebGL, or Three.js)",
      "Strong understanding of WebSocket and streaming protocols",
      "Familiarity with design systems and component libraries",
      "Bonus: exposure to robotics, IoT, or industrial automation",
    ],
    benefits: [
      "Equity package with 4-year vesting",
      "Unlimited PTO with 3-week minimum",
      "$5,000 annual learning stipend",
      "On-site gym and catered lunches",
      "Relocation assistance up to $15,000",
    ],
    companyLogo: "/assets/logos/apex-robotics.png",
    teamSize: "12 engineers",
    culture: ["Innovation-driven", "Collaborative", "Fast-paced", "Hands-on"],
  },
  {
    company: "MedVault Health",
    role: "Backend Engineer",
    location: "Boston, MA",
    salary: "$140,000 - $185,000",
    manager: {
      name: "James Okoro",
      title: "Director of Platform Engineering",
      tagline: "Making healthcare data accessible and secure",
      photo: "/assets/managers/james.jpg",
    },
    hr: {
      name: "Emily Santos",
      title: "People Operations Lead",
      photo: "/assets/hr/emily.jpg",
      email: "emily.santos@medvault.com",
      phone: "(617) 555-0198",
    },
    tags: ["Go", "HIPAA", "PostgreSQL", "gRPC"],
    description:
      "Build the secure backend infrastructure that powers health records for over 2 million patients. You will work on our HIPAA-compliant APIs, data pipelines, and access-control systems that hospitals and clinics rely on daily.",
    requirements: [
      "3+ years of backend development in Go, Java, or Python",
      "Experience designing RESTful or gRPC APIs at scale",
      "Knowledge of relational databases and query optimization",
      "Understanding of security best practices and compliance (HIPAA preferred)",
      "Experience with cloud infrastructure (GCP or AWS)",
    ],
    benefits: [
      "100% employer-paid health, dental, and vision",
      "401(k) with 6% match",
      "$3,000 home office setup budget",
      "16 weeks parental leave",
      "Annual company retreat",
    ],
    companyLogo: "/assets/logos/medvault.png",
    teamSize: "8 engineers",
    culture: ["Mission-driven", "Security-first", "Empathetic", "Detail-oriented"],
  },
  {
    company: "NovaPay Financial",
    role: "Full Stack Developer",
    location: "New York, NY",
    salary: "$155,000 - $200,000",
    manager: {
      name: "Rachel Kim",
      title: "Engineering Manager",
      tagline: "Reimagining payments for the modern economy",
      photo: "/assets/managers/rachel.jpg",
    },
    hr: {
      name: "Marcus Johnson",
      title: "Talent Acquisition Partner",
      photo: "/assets/hr/marcus.jpg",
      email: "marcus.johnson@novapay.com",
      phone: "(212) 555-0237",
    },
    tags: ["Node.js", "React", "PostgreSQL", "Fintech"],
    description:
      "Work across the stack to build payment processing features used by thousands of businesses. From merchant dashboards to transaction reconciliation engines, you will ship code that moves real money safely and quickly.",
    requirements: [
      "4+ years of full stack experience with Node.js and React",
      "Experience with payment systems, billing, or financial APIs",
      "Strong SQL skills and database design experience",
      "Familiarity with PCI compliance and fraud detection",
      "Experience writing comprehensive test suites",
    ],
    benefits: [
      "Competitive equity in a Series C startup",
      "Hybrid schedule: 3 days in office, 2 remote",
      "$2,500 annual wellness benefit",
      "Commuter benefits and bike storage",
      "Free lunch on in-office days",
    ],
    companyLogo: "/assets/logos/novapay.png",
    teamSize: "15 engineers",
    culture: ["High-ownership", "Data-driven", "Transparent", "Customer-obsessed"],
  },
  {
    company: "Terraform Studios",
    role: "Game Engine Developer",
    location: "Austin, TX",
    salary: "$130,000 - $175,000",
    manager: {
      name: "Carlos Rivera",
      title: "Lead Engine Programmer",
      tagline: "Crafting worlds players never want to leave",
      photo: "/assets/managers/carlos.jpg",
    },
    hr: {
      name: "Aisha Thompson",
      title: "Recruiting Coordinator",
      photo: "/assets/hr/aisha.jpg",
      email: "aisha.thompson@terrastudios.com",
      phone: "(512) 555-0314",
    },
    tags: ["C++", "Vulkan", "ECS", "Game Dev"],
    description:
      "Help build our proprietary game engine used by a team of 80+ developers. You will optimize rendering pipelines, implement physics simulations, and develop tools that empower artists and designers to create stunning open-world environments.",
    requirements: [
      "3+ years of C++ development in a game engine or graphics context",
      "Experience with Vulkan, DirectX 12, or Metal",
      "Understanding of entity-component-system architecture",
      "Strong math fundamentals: linear algebra, quaternions, spatial algorithms",
      "Experience profiling and optimizing performance-critical code",
    ],
    benefits: [
      "Royalty bonus on shipped titles",
      "Flexible hours with core overlap 11am-4pm",
      "Game library and console allowance",
      "Dog-friendly office",
      "Annual game jam week (paid)",
    ],
    companyLogo: "/assets/logos/terraform-studios.png",
    teamSize: "22 engineers",
    culture: ["Creative", "Passionate", "Iterative", "Player-focused"],
  },
  {
    company: "Canopy Climate",
    role: "ML Engineer",
    location: "Seattle, WA",
    salary: "$175,000 - $240,000",
    manager: {
      name: "Priya Nair",
      title: "Head of AI Research",
      tagline: "Using AI to fight the climate crisis",
      photo: "/assets/managers/priya.jpg",
    },
    hr: {
      name: "Tom Brennan",
      title: "HR Business Partner",
      photo: "/assets/hr/tom.jpg",
      email: "tom.brennan@canopyclimate.org",
      phone: "(206) 555-0421",
    },
    tags: ["Python", "PyTorch", "Satellite Data", "Climate Tech"],
    description:
      "Develop machine learning models that analyze satellite imagery and sensor data to monitor deforestation, predict wildfire risk, and measure carbon sequestration. Your work will directly inform conservation decisions affecting millions of acres.",
    requirements: [
      "MS or PhD in Computer Science, Remote Sensing, or related field",
      "3+ years training and deploying ML models in production",
      "Experience with geospatial data and satellite imagery (Sentinel, Landsat)",
      "Proficiency with PyTorch or TensorFlow and experiment tracking tools",
      "Strong background in computer vision or time-series analysis",
    ],
    benefits: [
      "Mission-aligned 1% climate pledge bonus",
      "4-day work week (Fridays off)",
      "Annual carbon offset for your household",
      "Conference travel budget of $5,000",
      "Sabbatical after 4 years",
    ],
    companyLogo: "/assets/logos/canopy-climate.png",
    teamSize: "10 researchers + engineers",
    culture: ["Purpose-driven", "Research-oriented", "Sustainable", "Inclusive"],
  },
  {
    company: "ShopStream",
    role: "Mobile Engineer (iOS)",
    location: "Remote (US)",
    salary: "$145,000 - $190,000",
    manager: {
      name: "Alex Wu",
      title: "Mobile Team Lead",
      tagline: "Live shopping, reimagined for mobile-first",
      photo: "/assets/managers/alex.jpg",
    },
    hr: {
      name: "Nina Petrovic",
      title: "Recruiter",
      photo: "/assets/hr/nina.jpg",
      email: "nina.petrovic@shopstream.io",
      phone: "(800) 555-0583",
    },
    tags: ["Swift", "SwiftUI", "AVFoundation", "E-commerce"],
    description:
      "Build the iOS app for our live-commerce platform where creators sell products through real-time video streams. You will work on video playback, in-stream purchasing, and real-time chat features used by millions of shoppers.",
    requirements: [
      "4+ years of native iOS development with Swift",
      "Experience with SwiftUI and Combine/async-await",
      "Familiarity with AVFoundation or live video streaming SDKs",
      "Understanding of App Store review guidelines and release processes",
      "Experience with CI/CD for mobile (Fastlane, Xcode Cloud)",
    ],
    benefits: [
      "Fully remote with $500/month coworking stipend",
      "Home office equipment budget of $3,500",
      "Quarterly team offsites in fun cities",
      "Employee discount on all ShopStream products",
      "Stock options with early exercise allowed",
    ],
    companyLogo: "/assets/logos/shopstream.png",
    teamSize: "6 mobile engineers",
    culture: ["Remote-first", "Move fast", "Creator-centric", "Experimental"],
  },
  {
    company: "Bastion Security",
    role: "Security Engineer",
    location: "Washington, DC",
    salary: "$160,000 - $220,000",
    manager: {
      name: "Daniel Osei",
      title: "CISO",
      tagline: "Defending what matters most",
      photo: "/assets/managers/daniel.jpg",
    },
    hr: {
      name: "Laura Mendez",
      title: "Talent Partner",
      photo: "/assets/hr/laura.jpg",
      email: "laura.mendez@bastionsec.com",
      phone: "(202) 555-0672",
    },
    tags: ["AppSec", "Pen Testing", "Kubernetes", "Zero Trust"],
    description:
      "Lead application security initiatives for our enterprise platform. You will conduct penetration tests, build automated security scanning pipelines, implement zero-trust networking policies, and mentor developers on secure coding practices.",
    requirements: [
      "5+ years in application or infrastructure security",
      "Experience with SAST/DAST tools and vulnerability management",
      "Proficiency in at least one scripting language (Python, Go, Bash)",
      "Knowledge of container security and Kubernetes hardening",
      "Relevant certifications preferred (OSCP, CEH, or similar)",
    ],
    benefits: [
      "Top-of-market compensation with annual refresh",
      "Clearance sponsorship available",
      "Paid training and certification costs",
      "$4,000 annual security conference budget",
      "Flexible hybrid schedule",
    ],
    companyLogo: "/assets/logos/bastion.png",
    teamSize: "9 security engineers",
    culture: ["Rigorous", "Trust-based", "Continuous learning", "Ethical"],
  },
  {
    company: "BrightPath Education",
    role: "Product Engineer",
    location: "Chicago, IL",
    salary: "$125,000 - $165,000",
    manager: {
      name: "Monica Li",
      title: "Head of Product Engineering",
      tagline: "Every student deserves a personalized path",
      photo: "/assets/managers/monica.jpg",
    },
    hr: {
      name: "Ryan Foster",
      title: "People & Culture Manager",
      photo: "/assets/hr/ryan.jpg",
      email: "ryan.foster@brightpath.edu",
      phone: "(312) 555-0789",
    },
    tags: ["React", "Python", "EdTech", "A/B Testing"],
    description:
      "Build features for our adaptive learning platform used by 500+ school districts. You will work closely with product managers and learning scientists to design experiments, ship features, and analyze student outcomes to improve educational equity.",
    requirements: [
      "3+ years of product-oriented engineering (React + Python preferred)",
      "Experience with A/B testing frameworks and data analysis",
      "Comfort working directly with non-technical stakeholders",
      "Understanding of accessibility standards (WCAG 2.1 AA)",
      "Interest in education, learning science, or social impact",
    ],
    benefits: [
      "Impact bonus tied to student outcome metrics",
      "Summer Fridays (half-day Fridays June-August)",
      "Professional development budget of $2,500",
      "$1,500 annual volunteer time-off stipend",
      "Pet insurance",
    ],
    companyLogo: "/assets/logos/brightpath.png",
    teamSize: "11 engineers",
    culture: ["Impact-first", "Learner-centered", "Collaborative", "Data-informed"],
  },
  {
    company: "Stratos Cloud",
    role: "DevOps / Platform Engineer",
    location: "Remote (US / EU)",
    salary: "$150,000 - $200,000",
    manager: {
      name: "Viktor Sokolov",
      title: "Director of Infrastructure",
      tagline: "Infrastructure so good, developers forget it exists",
      photo: "/assets/managers/viktor.jpg",
    },
    hr: {
      name: "Grace Adeyemi",
      title: "Global Recruiter",
      photo: "/assets/hr/grace.jpg",
      email: "grace.adeyemi@stratoscloud.dev",
      phone: "+1 (650) 555-0845",
    },
    tags: ["Terraform", "Kubernetes", "AWS", "CI/CD"],
    description:
      "Design and maintain the cloud infrastructure powering a multi-region SaaS platform. You will build self-service developer tooling, manage Kubernetes clusters, optimize cloud spend, and ensure 99.99% uptime across three continents.",
    requirements: [
      "4+ years in DevOps, SRE, or platform engineering roles",
      "Deep experience with Terraform, Ansible, or Pulumi",
      "Expertise managing Kubernetes clusters in production (EKS, GKE, or AKS)",
      "Experience building CI/CD pipelines (GitHub Actions, GitLab CI, or Jenkins)",
      "Strong Linux administration and networking fundamentals",
    ],
    benefits: [
      "Async-first culture with flexible hours",
      "Home internet and phone reimbursement",
      "Annual company summit (past locations: Lisbon, Kyoto, Vancouver)",
      "On-call compensation: $500/week on-call + $200 per incident",
      "Generous equity refresh grants",
    ],
    companyLogo: "/assets/logos/stratos.png",
    teamSize: "7 platform engineers",
    culture: ["Async-first", "Engineering excellence", "Ownership", "Blameless"],
  },
  {
    company: "Luminary AI",
    role: "Research Scientist (NLP)",
    location: "San Francisco, CA",
    salary: "$200,000 - $310,000",
    manager: {
      name: "Dr. Elena Volkov",
      title: "VP of Research",
      tagline: "Pushing the boundaries of language understanding",
      photo: "/assets/managers/elena.jpg",
    },
    hr: {
      name: "Chris Tanaka",
      title: "Research Recruiting Lead",
      photo: "/assets/hr/chris.jpg",
      email: "chris.tanaka@luminaryai.com",
      phone: "(415) 555-0912",
    },
    tags: ["NLP", "Transformers", "Python", "Research"],
    description:
      "Conduct original research in natural language processing to advance our foundation models. You will design experiments, publish at top venues, and collaborate with engineering teams to bring research breakthroughs into production systems used by enterprise customers.",
    requirements: [
      "PhD in NLP, Machine Learning, or Computational Linguistics",
      "Published papers at ACL, EMNLP, NeurIPS, ICML, or similar venues",
      "Deep experience with transformer architectures and training at scale",
      "Proficiency in Python and PyTorch",
      "Strong communication skills for cross-functional collaboration",
    ],
    benefits: [
      "Competitive research salary with signing bonus",
      "Dedicated GPU cluster access for personal research",
      "20% time for exploratory research projects",
      "Visa sponsorship and immigration support",
      "Catered meals and on-site wellness rooms",
    ],
    companyLogo: "/assets/logos/luminary.png",
    teamSize: "18 researchers",
    culture: ["Intellectually curious", "Open research", "Rigorous", "Collaborative"],
  },
  {
    company: "GreenCart",
    role: "Data Engineer",
    location: "Portland, OR",
    salary: "$135,000 - $180,000",
    manager: {
      name: "Jordan Blake",
      title: "Head of Data Platform",
      tagline: "Turning grocery data into sustainable supply chains",
      photo: "/assets/managers/jordan.jpg",
    },
    hr: {
      name: "Megan O'Brien",
      title: "Recruiting Manager",
      photo: "/assets/hr/megan.jpg",
      email: "megan.obrien@greencart.com",
      phone: "(503) 555-1024",
    },
    tags: ["Spark", "Airflow", "BigQuery", "dbt"],
    description:
      "Build and maintain the data infrastructure behind our sustainable grocery delivery platform. You will design ETL pipelines, model warehouse data, and enable analytics teams to track food waste reduction, delivery efficiency, and supplier sustainability scores.",
    requirements: [
      "3+ years of data engineering experience",
      "Proficiency with Apache Spark, Airflow, or Dagster",
      "Experience with BigQuery, Snowflake, or Redshift",
      "Strong SQL skills and experience with dbt or similar transformation tools",
      "Familiarity with data quality frameworks and observability",
    ],
    benefits: [
      "Free weekly GreenCart grocery delivery",
      "Bike-to-work incentive ($100/month)",
      "Flexible 4.5-day work week",
      "Composting and sustainability workshops",
      "Stock options in a mission-driven company",
    ],
    companyLogo: "/assets/logos/greencart.png",
    teamSize: "5 data engineers",
    culture: ["Sustainability-first", "Pragmatic", "Curious", "Team-oriented"],
  },
  {
    company: "Nexon Biotech",
    role: "Bioinformatics Software Engineer",
    location: "Cambridge, MA",
    salary: "$150,000 - $200,000",
    manager: {
      name: "Dr. Fatima Hassan",
      title: "Director of Computational Biology",
      tagline: "Code that accelerates drug discovery",
      photo: "/assets/managers/fatima.jpg",
    },
    hr: {
      name: "Ben Crawford",
      title: "Scientific Recruiter",
      photo: "/assets/hr/ben.jpg",
      email: "ben.crawford@nexonbio.com",
      phone: "(617) 555-1138",
    },
    tags: ["Python", "Bioinformatics", "AWS", "Genomics"],
    description:
      "Develop computational pipelines that analyze genomic and proteomic data to identify drug targets. You will work alongside biologists and chemists, building tools that reduce the time from hypothesis to clinical candidate by months.",
    requirements: [
      "3+ years of software engineering with Python",
      "Experience with bioinformatics tools (BWA, GATK, Nextflow, or Snakemake)",
      "Understanding of genomics concepts: variant calling, RNA-seq, protein structures",
      "Experience with cloud-based batch processing (AWS Batch, GCP Life Sciences)",
      "MS or PhD in bioinformatics, computational biology, or related field preferred",
    ],
    benefits: [
      "Publication support and conference attendance",
      "On-site lab access for cross-disciplinary learning",
      "Tuition reimbursement up to $10,000/year",
      "Comprehensive health coverage including fertility benefits",
      "Shuttle service from Boston and surrounding areas",
    ],
    companyLogo: "/assets/logos/nexon-biotech.png",
    teamSize: "14 computational scientists",
    culture: ["Scientific rigor", "Cross-disciplinary", "Patient-focused", "Innovative"],
  },
  {
    company: "Velvet Audio",
    role: "Creative Technologist",
    location: "Los Angeles, CA",
    salary: "$120,000 - $160,000",
    manager: {
      name: "Kai Nakamura",
      title: "Creative Director of Technology",
      tagline: "Where art meets code, magic happens",
      photo: "/assets/managers/kai.jpg",
    },
    hr: {
      name: "Sophia Reyes",
      title: "Studio HR Coordinator",
      photo: "/assets/hr/sophia.jpg",
      email: "sophia.reyes@velvetaudio.com",
      phone: "(323) 555-1255",
    },
    tags: ["Web Audio API", "Three.js", "Creative Coding", "Music Tech"],
    description:
      "Design and build immersive audio-visual web experiences for musicians, labels, and brands. You will prototype interactive album releases, AR concert experiences, and generative art installations that blur the line between music and technology.",
    requirements: [
      "3+ years building creative or interactive web experiences",
      "Proficiency with Web Audio API, Tone.js, or similar audio frameworks",
      "Experience with Three.js, WebGL, or creative coding tools (p5.js, TouchDesigner)",
      "Strong visual design sense and portfolio of creative work",
      "Comfort working in fast-paced creative environments with evolving briefs",
    ],
    benefits: [
      "Access to recording studio and creative equipment",
      "Tickets to concerts and industry events",
      "$3,000 annual creative tools budget",
      "Flexible schedule with project-based deadlines",
      "Collaborative workspace in Arts District",
    ],
    companyLogo: "/assets/logos/velvet-audio.png",
    teamSize: "4 creative technologists",
    culture: ["Artistically bold", "Experimental", "Music-obsessed", "Interdisciplinary"],
  },
  {
    company: "Ironclad Legal Tech",
    role: "Senior Backend Engineer",
    location: "New York, NY",
    salary: "$170,000 - $225,000",
    manager: {
      name: "Ananya Gupta",
      title: "Staff Engineer",
      tagline: "Making contracts less painful, one API at a time",
      photo: "/assets/managers/ananya.jpg",
    },
    hr: {
      name: "Patrick Sullivan",
      title: "Head of Talent",
      photo: "/assets/hr/patrick.jpg",
      email: "patrick.sullivan@ironcladlt.com",
      phone: "(646) 555-1367",
    },
    tags: ["Java", "Elasticsearch", "Microservices", "Legal Tech"],
    description:
      "Build the backend systems that power our contract lifecycle management platform. You will design document storage and search services, implement workflow automation engines, and scale our microservices architecture to support Fortune 500 clients.",
    requirements: [
      "5+ years of backend engineering with Java or Kotlin",
      "Experience designing and operating microservices at scale",
      "Proficiency with Elasticsearch, Kafka, or similar distributed systems",
      "Familiarity with document processing and OCR pipelines",
      "Experience mentoring junior engineers and conducting code reviews",
    ],
    benefits: [
      "Top-quartile base salary with annual bonus",
      "Hybrid work with beautiful Flatiron office",
      "Legal education stipend (CLE credits, law courses)",
      "Comprehensive mental health coverage",
      "Generous parental leave (20 weeks)",
    ],
    companyLogo: "/assets/logos/ironclad.png",
    teamSize: "20 backend engineers",
    culture: ["Craft-focused", "Thoughtful", "Customer-driven", "Diverse"],
  },
  {
    company: "Orbit Aerospace",
    role: "Embedded Systems Engineer",
    location: "Denver, CO",
    salary: "$140,000 - $190,000",
    manager: {
      name: "Lt. Col. Mark Jensen (Ret.)",
      title: "VP of Avionics Software",
      tagline: "Reliable software for unreliable environments",
      photo: "/assets/managers/mark.jpg",
    },
    hr: {
      name: "Diana Kowalski",
      title: "Technical Recruiter",
      photo: "/assets/hr/diana.jpg",
      email: "diana.kowalski@orbitaero.com",
      phone: "(720) 555-1489",
    },
    tags: ["C", "RTOS", "Embedded", "Aerospace"],
    description:
      "Develop flight software for our satellite constellation. You will write real-time embedded code, implement fault-tolerant communication protocols, and work with hardware engineers to integrate software with custom avionics boards destined for orbit.",
    requirements: [
      "4+ years of embedded C/C++ development",
      "Experience with RTOS (FreeRTOS, VxWorks, or RTEMS)",
      "Understanding of communication protocols (CAN, SPI, I2C, UART)",
      "Familiarity with DO-178C or similar safety-critical standards",
      "Experience with hardware-in-the-loop testing and debugging",
    ],
    benefits: [
      "Watch your code launch into space (literally)",
      "Relocation package for Denver move",
      "Clearance sponsorship available",
      "Outdoor recreation stipend ($1,500/year)",
      "9/80 schedule (every other Friday off)",
    ],
    companyLogo: "/assets/logos/orbit-aerospace.png",
    teamSize: "16 embedded engineers",
    culture: ["Mission-critical", "Precision", "Team trust", "Adventure"],
  },
  {
    company: "Fable Interactive",
    role: "Narrative Designer / Developer",
    location: "Austin, TX",
    salary: "$95,000 - $130,000",
    manager: {
      name: "Lena Dvorak",
      title: "Lead Narrative Director",
      tagline: "Stories that play back",
      photo: "/assets/managers/lena.jpg",
    },
    hr: {
      name: "Jesse Morales",
      title: "Studio Recruiter",
      photo: "/assets/hr/jesse.jpg",
      email: "jesse.morales@fableinteractive.com",
      phone: "(512) 555-1523",
    },
    tags: ["Ink", "Unity", "Narrative", "Game Writing"],
    description:
      "Craft branching narratives and dialogue systems for our story-driven adventure games. You will write scripts in Ink, implement dialogue trees in Unity, and collaborate with game designers to create emotionally resonant player experiences with meaningful choices.",
    requirements: [
      "2+ years of narrative design or interactive fiction development",
      "Proficiency with Ink, Twine, Yarn Spinner, or similar narrative scripting tools",
      "Basic Unity or Unreal Engine experience for integrating narrative systems",
      "Published writing portfolio (games, interactive fiction, or screenwriting)",
      "Understanding of branching narrative structures and player agency",
    ],
    benefits: [
      "Royalty participation on shipped titles",
      "Creative writing workshops and guest speaker series",
      "Flexible work hours with core hours 11am-3pm",
      "Game library and media subscription allowance",
      "Annual narrative design retreat",
    ],
    companyLogo: "/assets/logos/fable-interactive.png",
    teamSize: "8 narrative + tech team",
    culture: ["Story-first", "Empathetic", "Playful", "Craft-driven"],
  },
  {
    company: "Kinetic Fitness",
    role: "Android Engineer",
    location: "Miami, FL",
    salary: "$130,000 - $170,000",
    manager: {
      name: "Diego Fernandez",
      title: "Mobile Engineering Manager",
      tagline: "Tech that moves with you",
      photo: "/assets/managers/diego.jpg",
    },
    hr: {
      name: "Hannah Liu",
      title: "People Operations Specialist",
      photo: "/assets/hr/hannah.jpg",
      email: "hannah.liu@kineticfit.com",
      phone: "(305) 555-1645",
    },
    tags: ["Kotlin", "Jetpack Compose", "Wearables", "Health Tech"],
    description:
      "Build the Android app and Wear OS companion for our AI-powered fitness coaching platform. You will implement workout tracking, wearable sensor integration, and real-time form analysis features that help users exercise safely and effectively.",
    requirements: [
      "3+ years of Android development with Kotlin",
      "Experience with Jetpack Compose and modern Android architecture (MVVM, MVI)",
      "Familiarity with Health Connect API and wearable device SDKs",
      "Understanding of Bluetooth LE for sensor communication",
      "Experience with camera and ML Kit for on-device inference",
    ],
    benefits: [
      "Free Kinetic Fitness subscription and equipment",
      "On-site fitness center with personal training sessions",
      "Beach-adjacent office in Wynwood",
      "Wellness reimbursement ($200/month)",
      "Flexible PTO with 2-week minimum vacation",
    ],
    companyLogo: "/assets/logos/kinetic-fitness.png",
    teamSize: "5 Android engineers",
    culture: ["Health-conscious", "Active lifestyle", "User-first", "Agile"],
  },
  {
    company: "Atlas Logistics",
    role: "Staff Software Engineer",
    location: "Chicago, IL",
    salary: "$190,000 - $260,000",
    manager: {
      name: "Olamide Adeyinka",
      title: "CTO",
      tagline: "Optimizing the world's supply chains",
      photo: "/assets/managers/olamide.jpg",
    },
    hr: {
      name: "Catherine Bell",
      title: "VP of People",
      photo: "/assets/hr/catherine.jpg",
      email: "catherine.bell@atlaslogistics.com",
      phone: "(312) 555-1778",
    },
    tags: ["Rust", "Distributed Systems", "Optimization", "Supply Chain"],
    description:
      "Architect and build the next generation of our route optimization and fleet management platform. As a staff engineer, you will make critical technical decisions, design systems that process millions of shipments daily, and set engineering standards across the organization.",
    requirements: [
      "8+ years of software engineering with systems-level languages (Rust, C++, Go)",
      "Experience designing distributed systems handling high-throughput workloads",
      "Background in optimization algorithms, OR, or computational geometry",
      "Track record of leading large technical initiatives across multiple teams",
      "Strong written communication for RFCs and architectural decision records",
    ],
    benefits: [
      "Staff-level equity grant with accelerated vesting",
      "Flexible work arrangement (office, hybrid, or remote)",
      "$10,000 annual professional development budget",
      "Executive coaching and leadership development",
      "First-class travel for team collaboration",
    ],
    companyLogo: "/assets/logos/atlas-logistics.png",
    teamSize: "45 engineers (you lead a pod of 8)",
    culture: ["Engineering-led", "High-bar", "Autonomous", "Impact-oriented"],
  },
  {
    company: "Mosaic Design Systems",
    role: "Design Engineer",
    location: "Remote (US)",
    salary: "$135,000 - $175,000",
    manager: {
      name: "Yuki Tanaka",
      title: "Design Systems Lead",
      tagline: "Components that bring products to life",
      photo: "/assets/managers/yuki.jpg",
    },
    hr: {
      name: "Andre Williams",
      title: "Remote Talent Partner",
      photo: "/assets/hr/andre.jpg",
      email: "andre.williams@mosaicds.com",
      phone: "(888) 555-1856",
    },
    tags: ["React", "Figma", "Storybook", "Design Systems"],
    description:
      "Build and maintain a design system used by 12 product teams. You will bridge the gap between design and engineering, creating accessible React components, writing documentation, and ensuring visual consistency across a suite of enterprise SaaS products.",
    requirements: [
      "4+ years building UI components in React with TypeScript",
      "Experience maintaining a design system or component library at scale",
      "Proficiency with Figma and design-to-code workflows",
      "Deep understanding of accessibility (ARIA, screen readers, keyboard navigation)",
      "Experience with Storybook, Chromatic, or visual regression testing",
    ],
    benefits: [
      "Fully remote with quarterly in-person design sprints",
      "Latest MacBook Pro and design peripherals",
      "$2,000 annual home office upgrade budget",
      "Design conference attendance (Config, Clarity, An Event Apart)",
      "Flexible schedule across US time zones",
    ],
    companyLogo: "/assets/logos/mosaic.png",
    teamSize: "6 design engineers",
    culture: ["Craft-obsessed", "Accessible-by-default", "Systematic", "Empowering"],
  },
  {
    company: "Zenith Space Mining",
    role: "Simulation Engineer",
    location: "Houston, TX",
    salary: "$155,000 - $215,000",
    manager: {
      name: "Dr. Amara Okonkwo",
      title: "Chief Simulation Architect",
      tagline: "Simulating the future before we build it",
      photo: "/assets/managers/amara.jpg",
    },
    hr: {
      name: "Kevin Choi",
      title: "Technical Talent Lead",
      photo: "/assets/hr/kevin.jpg",
      email: "kevin.choi@zenithsm.com",
      phone: "(281) 555-1934",
    },
    tags: ["Python", "C++", "Physics Simulation", "Space Tech"],
    description:
      "Build high-fidelity simulations of asteroid mining operations including orbital mechanics, robotic arm dynamics, and resource extraction processes. Your simulations will validate mission plans before hardware is ever built, saving months and millions in development costs.",
    requirements: [
      "4+ years in simulation, physics modeling, or scientific computing",
      "Strong C++ and Python skills for numerical simulation",
      "Background in physics, aerospace engineering, or mechanical engineering",
      "Experience with simulation frameworks (Gazebo, MuJoCo, or custom engines)",
      "Familiarity with visualization tools for simulation output (VTK, ParaView)",
    ],
    benefits: [
      "Front-row seat to the space resource revolution",
      "Relocation assistance to Houston",
      "Access to NASA JSC collaboration programs",
      "Annual space industry conference attendance",
      "Comprehensive benefits with HSA contribution",
    ],
    companyLogo: "/assets/logos/zenith.png",
    teamSize: "9 simulation engineers",
    culture: ["Frontier-minded", "Scientifically rigorous", "Ambitious", "Collaborative"],
  },
];

async function clearCollection(collectionPath: string) {
  const snapshot = await db.collection(collectionPath).get();
  if (snapshot.empty) {
    console.log(`Collection "${collectionPath}" is already empty.`);
    return;
  }
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`Cleared ${snapshot.size} documents from "${collectionPath}".`);
}

async function seed() {
  console.log("Starting seed...\n");

  console.log("Clearing existing jobs collection...");
  await clearCollection("jobs");

  console.log(`\nSeeding ${jobs.length} jobs...\n`);

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const docRef = db.collection("jobs").doc();
    await docRef.set({ ...job, id: docRef.id });
    console.log(`  [${i + 1}/${jobs.length}] ${job.role} at ${job.company}`);
  }

  console.log(`\nDone! Seeded ${jobs.length} jobs into Firestore.`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
