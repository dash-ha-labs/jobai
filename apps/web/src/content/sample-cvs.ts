import type { CV } from "jobai-shared";

export interface FictionalSample {
  id: string;
  templateId: string;
  templateName: string;
  templateDesc: string;
  personName: string;
  personRole: string;
  accentColor: string;
  cv: CV;
}

export const FICTIONAL_SAMPLES: Record<string, FictionalSample> = {
  "modern": {
  "id": "modern",
  "templateId": "modern",
  "templateName": "Modern Clean",
  "templateDesc": "Minimalist layout with clear visual hierarchy and accent header",
  "personName": "Grace Hopper",
  "personRole": "Pioneer Computer Scientist & Systems Architect",
  "accentColor": "#2457eb",
  "cv": {
    "id": "sample-modern",
    "version": "1.0.0",
    "contact": {
      "name": "Grace Hopper",
      "email": "grace.hopper@example.com",
      "phone": "+1 (555) 194-4001",
      "location": "Arlington, VA",
      "website": "gracehopper.dev"
    },
    "summary": "Pioneering computer scientist and naval systems architect with foundational contributions to compiler design, machine-independent programming languages, and scalable computing standards.",
    "sections": [
      {
        "id": "sec-mod-1",
        "type": "experience",
        "title": "Work Experience",
        "items": [
          {
            "id": "item-mod-1-1",
            "title": "Fellow & Standards Architect",
            "subtitle": "Computational Standards Bureau",
            "date": "1959 — 1986",
            "description": "Led technical committee on high-level language portability and standards.",
            "bullets": [
              "Spearheaded technical committee defining COBOL, establishing machine-independent business computing across 4,000+ mainframe installations",
              "Standardized testing frameworks for compiler validation, reducing language dialect discrepancies by 45%",
              "Mentored over 150 systems programmers in modular software design and structured flow methodology"
            ]
          },
          {
            "id": "item-mod-1-2",
            "title": "Senior Research Mathematician",
            "subtitle": "Eckert–Mauchly Computer Corporation",
            "date": "1949 — 1959",
            "description": "Directed automated programming routines for UNIVAC I and early digital mainframes.",
            "bullets": [
              "Invented the A-0 compiler system, the earliest operational compiler translating symbolic mathematical expressions into binary code",
              "Designed memory overlay techniques that increased available storage efficiency by 35% on magnetic drum systems"
            ]
          },
          {
            "id": "item-mod-1-3",
            "title": "Director of Mark I Computation",
            "subtitle": "Harvard Computation Laboratory",
            "date": "1944 — 1949",
            "description": "Programmed Mark I electromechanical computer for ballistic calculation grids.",
            "bullets": [
              "Computed naval rocket trajectory tables with 99.8% precision across 14,000 machine operating hours",
              "Documented the first recorded computing hardware bug diagnosis and standardized real-time diagnostic logging"
            ]
          }
        ]
      },
      {
        "id": "sec-mod-2",
        "type": "education",
        "title": "Education",
        "items": [
          {
            "id": "item-mod-2-1",
            "title": "Ph.D. in Mathematics",
            "subtitle": "Yale University",
            "date": "1934",
            "description": "Dissertation: New Types of Irreducibility Criteria. Focus on algebraic invariants."
          }
        ]
      },
      {
        "id": "sec-mod-3",
        "type": "skills",
        "title": "Skills & Proficiencies",
        "items": [
          {
            "id": "item-mod-3-1",
            "title": "Core Competencies",
            "description": "Compiler Design, Systems Architecture, Language Standardization, Numerical Analysis, Mathematical Logic"
          },
          {
            "id": "item-mod-3-2",
            "title": "Hardware & Environments",
            "description": "UNIVAC I, Harvard Mark I/II, Mainframe Architectures, Assembler, High-Level Intermediate Formats"
          }
        ]
      },
      {
        "id": "sec-mod-4",
        "type": "projects",
        "title": "Key Projects",
        "items": [
          {
            "id": "item-mod-4-1",
            "title": "A-0 Compiler Specification",
            "subtitle": "First Operational Compiler",
            "date": "1952",
            "description": "Engineered symbolic translation routines converting mathematical subroutines into unified executable binary blocks."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "modern",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#2457eb"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "executive": {
  "id": "executive",
  "templateId": "executive",
  "templateName": "Executive",
  "templateDesc": "Structured traditional corporate layout optimized for leadership roles",
  "personName": "Indra Nooyi",
  "personRole": "Chief Executive Officer & Board Director",
  "accentColor": "#191b20",
  "cv": {
    "id": "sample-executive",
    "version": "1.0.0",
    "contact": {
      "name": "Indra Nooyi",
      "email": "indra.nooyi@example.com",
      "phone": "+1 (555) 203-1002",
      "location": "Greenwich, CT",
      "website": "nooyi-advisory.com"
    },
    "summary": "Global business executive and transformational leader with 24+ years directing Fortune 50 consumer enterprises, orchestrating multi-billion dollar portfolio realignments, and sustaining long-term shareholder value.",
    "sections": [
      {
        "id": "sec-exec-1",
        "type": "experience",
        "title": "Executive Leadership",
        "items": [
          {
            "id": "item-exec-1-1",
            "title": "Chairman & Chief Executive Officer",
            "subtitle": "PepsiCo Global",
            "date": "2006 — 2019",
            "description": "Directed worldwide enterprise strategy, operations, and governance across 200+ countries.",
            "bullets": [
              "Grew annual global enterprise revenue from $35B to $63.5B while delivering 149% total shareholder return over 12-year tenure",
              "Reclassified product portfolio under 'Performance with Purpose', raising nutritious brand revenues from 38% to 50% of aggregate sales",
              "Directed $3.2B in annual capital investments across supply chain automation and sustainable packaging initiatives"
            ]
          },
          {
            "id": "item-exec-1-2",
            "title": "President & Chief Financial Officer",
            "subtitle": "PepsiCo Global",
            "date": "2001 — 2006",
            "description": "Led corporate finance, treasury, mergers and acquisitions, and long-range planning.",
            "bullets": [
              "Executed $13.8B strategic acquisition of Quaker Oats and merger of Tropicana, securing leadership in healthy consumer categories",
              "Structured unified corporate treasury and working capital optimization, unlocking $1.1B in operational liquidity"
            ]
          },
          {
            "id": "item-exec-1-3",
            "title": "Senior Vice President of Corporate Strategy",
            "subtitle": "Asea Brown Boveri (ABB)",
            "date": "1990 — 1994",
            "description": "Orchestrated international expansion and cross-border industrial acquisitions.",
            "bullets": [
              "Formulated worldwide industrial electrification strategy and negotiated 15 cross-border joint ventures across Europe and Asia"
            ]
          }
        ]
      },
      {
        "id": "sec-exec-2",
        "type": "education",
        "title": "Education & Credentials",
        "items": [
          {
            "id": "item-exec-2-1",
            "title": "Master of Public and Private Management (MPPM)",
            "subtitle": "Yale School of Management",
            "date": "1980",
            "description": "Concentration in Corporate Finance and Strategic Planning."
          }
        ]
      },
      {
        "id": "sec-exec-3",
        "type": "skills",
        "title": "Executive Competencies",
        "items": [
          {
            "id": "item-exec-3-1",
            "title": "Board & Governance",
            "description": "Global Enterprise Strategy, P&L Accountability ($60B+), Capital Allocation, International M&A, ESG Governance"
          }
        ]
      },
      {
        "id": "sec-exec-4",
        "type": "projects",
        "title": "Strategic Initiatives",
        "items": [
          {
            "id": "item-exec-4-1",
            "title": "Performance with Purpose Transformation",
            "subtitle": "Enterprise Realignment",
            "date": "2006 — 2018",
            "description": "Landmark organizational model aligning financial performance with environmental sustainability and nutritional integrity."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "executive",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#191b20"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "tech": {
  "id": "tech",
  "templateId": "tech",
  "templateName": "Technical",
  "templateDesc": "Skills and project focused layout designed for engineering resumes",
  "personName": "Alan Turing",
  "personRole": "Theoretical Computer Scientist & Cryptanalyst",
  "accentColor": "#475569",
  "cv": {
    "id": "sample-tech",
    "version": "1.0.0",
    "contact": {
      "name": "Alan Turing",
      "email": "alan.turing@example.com",
      "phone": "+1 (555) 412-1912",
      "location": "Wilmslow, UK",
      "website": "turing-archive.org"
    },
    "summary": "Mathematician and computer scientist foundational to computability theory, stored-program digital computers, algorithmic cryptography, and early artificial intelligence architectures.",
    "sections": [
      {
        "id": "sec-tech-1",
        "type": "experience",
        "title": "Research & Systems Engineering",
        "items": [
          {
            "id": "item-tech-1-1",
            "title": "Chief Cryptanalyst & Head of Hut 8",
            "subtitle": "Bletchley Park Research Station",
            "date": "1939 — 1945",
            "description": "Directed naval Enigma decryption operations and algorithmic electromechanical cryptanalysis.",
            "bullets": [
              "Designed electromechanical Bombe machines decrypting naval Enigma ciphers, processing thousands of coded intercepts daily",
              "Developed Banburismus, a Bayesian statistical method that reduced manual rotor-testing search space by 65%",
              "Managed Hut 8 cryptography division ensuring 24/7 intelligence dissemination to naval commands with zero-leakage security"
            ]
          },
          {
            "id": "item-tech-1-2",
            "title": "Lead Computing Architect",
            "subtitle": "National Physical Laboratory (NPL)",
            "date": "1945 — 1948",
            "description": "Authored technical blueprints for stored-program computer systems.",
            "bullets": [
              "Authored complete design specification for Automatic Computing Engine (ACE), introducing microprogrammed stored-program execution",
              "Designed high-speed acoustic mercury delay-line memory buffers optimized for sub-microsecond instruction fetch"
            ]
          },
          {
            "id": "item-tech-1-3",
            "title": "Reader in Mathematics & Computing",
            "subtitle": "University of Manchester",
            "date": "1948 — 1954",
            "description": "Programmed Ferranti Mark 1 and directed early machine learning and biological morphogenesis research.",
            "bullets": [
              "Engineered matrix algebra and differential equation subroutines for Manchester Mark 1",
              "Authored mathematical reaction-diffusion equations predicting biological pattern formation and morphogenesis"
            ]
          }
        ]
      },
      {
        "id": "sec-tech-2",
        "type": "projects",
        "title": "Theoretical Foundations & Systems",
        "items": [
          {
            "id": "item-tech-2-1",
            "title": "Universal Turing Machine Model",
            "subtitle": "Computability Landmark Paper",
            "date": "1936",
            "description": "Formulated abstract tape automaton model proving the unsolvability of the Hilbert Entscheidungsproblem."
          },
          {
            "id": "item-tech-2-2",
            "title": "The Turing Test & Computing Machinery",
            "subtitle": "AI Benchmark Specification",
            "date": "1950",
            "description": "Proposed operational imitation game benchmark evaluating machine intelligence through natural language interaction."
          }
        ]
      },
      {
        "id": "sec-tech-3",
        "type": "skills",
        "title": "Technical Proficiencies",
        "items": [
          {
            "id": "item-tech-3-1",
            "title": "Core Disciplines",
            "description": "Computability Theory, Algorithmic Cryptanalysis, Mathematical Logic, Information Theory, Morphogenesis"
          },
          {
            "id": "item-tech-3-2",
            "title": "Systems & Architectures",
            "description": "Stored-Program Architecture, Delay-Line Memory, Relay Automata, Manchester Mark 1 Assembly, ACE Systems"
          }
        ]
      },
      {
        "id": "sec-tech-4",
        "type": "education",
        "title": "Education",
        "items": [
          {
            "id": "item-tech-4-1",
            "title": "Ph.D. in Mathematical Logic",
            "subtitle": "Princeton University",
            "date": "1938",
            "description": "Doctoral advisor: Alonzo Church. Thesis: Systems of Logic Based on Ordinals."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "tech",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#475569"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "compact": {
  "id": "compact",
  "templateId": "compact",
  "templateName": "Compact",
  "templateDesc": "Dense single-page layout maximizing content per square inch",
  "personName": "Katherine Johnson",
  "personRole": "Lead Orbital Trajectory Mathematician",
  "accentColor": "#636c7a",
  "cv": {
    "id": "sample-compact",
    "version": "1.0.0",
    "contact": {
      "name": "Katherine Johnson",
      "email": "katherine.johnson@example.com",
      "phone": "+1 (555) 757-1918",
      "location": "Hampton, VA",
      "website": "katherine-johnson.space"
    },
    "summary": "Aerospace research mathematician with 33+ years computing trajectory mechanics, celestial launch windows, and emergency abort profiles for pioneering NASA manned spaceflights.",
    "sections": [
      {
        "id": "sec-comp-1",
        "type": "experience",
        "title": "Professional Experience",
        "items": [
          {
            "id": "item-comp-1-1",
            "title": "Aerospace Technologist & Trajectory Lead",
            "subtitle": "NASA Langley Research Center",
            "date": "1958 — 1986",
            "description": "Calculated mission launch geometries and re-entry trajectories for Mercury, Gemini, and Apollo programs.",
            "bullets": [
              "Calculated launch trajectory and atmospheric re-entry window for Alan Shepard's Freedom 7, the first American spaceflight",
              "Verified electronic computer orbital integration equations for John Glenn's Friendship 7 flight with zero margin of error",
              "Synchronized Apollo 11 lunar module ascent trajectory with the command module, guaranteeing successful lunar rendezvous"
            ]
          },
          {
            "id": "item-comp-1-2",
            "title": "Research Mathematician",
            "subtitle": "NACA Flight Research Division",
            "date": "1953 — 1958",
            "description": "Conducted flight trajectory and aerodynamic gust alleviation computations.",
            "bullets": [
              "Analyzed aerodynamic wake vortex parameters and trajectory verification for experimental supersonic fighter aircraft",
              "Co-authored 26 technical NASA monographs establishing mathematical standards for satellite trajectory determination"
            ]
          }
        ]
      },
      {
        "id": "sec-comp-2",
        "type": "education",
        "title": "Education",
        "items": [
          {
            "id": "item-comp-2-1",
            "title": "B.S. in Mathematics and French",
            "subtitle": "West Virginia State University",
            "date": "1937",
            "description": "Summa Cum Laude; completed advanced geometry curricula created specifically for her by Dr. W.W. Schieffelin Claytor."
          }
        ]
      },
      {
        "id": "sec-comp-3",
        "type": "skills",
        "title": "Skills & Specializations",
        "items": [
          {
            "id": "item-comp-3-1",
            "title": "Mathematics & Mechanics",
            "description": "Orbital Mechanics, Celestial Navigation, Numerical Trajectory Integration, Error Bounds Analysis, Celestial Coordinates"
          }
        ]
      },
      {
        "id": "sec-comp-4",
        "type": "projects",
        "title": "Mission Highlights",
        "items": [
          {
            "id": "item-comp-4-1",
            "title": "Apollo 11 Lunar Orbit Rendezvous Calculations",
            "subtitle": "Mission Safety Verification",
            "date": "1969",
            "description": "Critical numerical calculations governing safe ascent timing and lunar transfer orbit insertion."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "compact",
      "fontSize": "normal",
      "margin": "compact",
      "paperSize": "A4",
      "primaryColor": "#636c7a"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "creative": {
  "id": "creative",
  "templateId": "creative",
  "templateName": "Creative Studio",
  "templateDesc": "Bold color blocks and expressive section headers for design roles",
  "personName": "Leonardo da Vinci",
  "personRole": "Master Polymath, Mechanician & Visual Artist",
  "accentColor": "#9e5932",
  "cv": {
    "id": "sample-creative",
    "version": "1.0.0",
    "contact": {
      "name": "Leonardo da Vinci",
      "email": "leonardo.davinci@example.com",
      "phone": "+1 (555) 145-2005",
      "location": "Amboise, FR",
      "website": "davinci-studios.art"
    },
    "summary": "Polymath and visual designer uniting empirical anatomical observation, mechanical gear systems, and geometric perspective across grand civic, military, and studio projects.",
    "sections": [
      {
        "id": "sec-cre-1",
        "type": "experience",
        "title": "Design & Engineering Commissions",
        "items": [
          {
            "id": "item-cre-1-1",
            "title": "Premier Painter, Engineer & Architect",
            "subtitle": "Court of King Francis I",
            "date": "1516 — 1519",
            "description": "Chief royal architect and mechanical spectacle designer.",
            "bullets": [
              "Engineered mechanical robotic automaton (the mechanical lion) with internal cam-driven gear transmission",
              "Designed double-helix staircase and urban hydraulic canal network for royal estate at Romorantin"
            ]
          },
          {
            "id": "item-cre-1-2",
            "title": "Court Artist & Military Engineer",
            "subtitle": "Court of Milan (Ludovico Sforza)",
            "date": "1482 — 1499",
            "description": "Directed major civic and military engineering operations alongside monumental studio art.",
            "bullets": [
              "Executed 'The Last Supper' mural utilizing revolutionary linear perspective and innovative egg-tempera ground preparation",
              "Drafted comprehensive designs for 40+ mechanical devices including variable gear trains, miter canal locks, and aerial screws",
              "Engineered municipal canal infrastructure that increased agricultural transport throughput across the Lombardy plain by 30%"
            ]
          },
          {
            "id": "item-cre-1-3",
            "title": "General Inspector of Fortifications",
            "subtitle": "Romagna Regional Engineering Corps",
            "date": "1502 — 1503",
            "description": "Surveyed strategic defensive bastions and hydraulic defenses.",
            "bullets": [
              "Produced first modern topographical relief maps with color-coded elevation contours and defensive perimeter bastions"
            ]
          }
        ]
      },
      {
        "id": "sec-cre-2",
        "type": "education",
        "title": "Apprenticeship & Mastery",
        "items": [
          {
            "id": "item-cre-2-1",
            "title": "Master Guildsman Apprenticeship",
            "subtitle": "Bottega of Andrea del Verrocchio",
            "date": "1466 — 1472",
            "description": "Rigorous guild training in metallurgy, draftsmanship, mechanics, chemistry, and perspective geometry."
          }
        ]
      },
      {
        "id": "sec-cre-3",
        "type": "skills",
        "title": "Artistic & Technical Mastery",
        "items": [
          {
            "id": "item-cre-3-1",
            "title": "Visual Disciplines",
            "description": "Linear Perspective, Sfumato Technique, Chiaroscuro Modeling, Human Anatomical Draftsmanship, Fresco Pigmentation"
          },
          {
            "id": "item-cre-3-2",
            "title": "Mechanical Sciences",
            "description": "Hydraulic Engineering, Cam Transmissions, Aerodynamic Vortices, Fortification Architecture, Cartography"
          }
        ]
      },
      {
        "id": "sec-cre-4",
        "type": "projects",
        "title": "Selected Masterworks",
        "items": [
          {
            "id": "item-cre-4-1",
            "title": "Codex Atlanticus & Madrid Codices",
            "subtitle": "Comprehensive Mechanical Folios",
            "date": "1480 — 1518",
            "description": "Over 1,000 folios detailing mechanical gear linkages, wing aerodynamics, and automated manufacturing tools."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "creative",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#9e5932"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "academic": {
  "id": "academic",
  "templateId": "academic",
  "templateName": "Academic CV",
  "templateDesc": "Formal scholarly structure with emphasis on education and research",
  "personName": "Marie Curie",
  "personRole": "Professor of General Physics & Radiochemist",
  "accentColor": "#2a5885",
  "cv": {
    "id": "sample-academic",
    "version": "1.0.0",
    "contact": {
      "name": "Marie Curie",
      "email": "marie.curie@example.com",
      "phone": "+1 (555) 186-7006",
      "location": "Paris, FR",
      "website": "curie-institute.edu"
    },
    "summary": "Two-time Nobel laureate physicist and radiochemist who pioneered radioactivity theory, isolated radium and polonium, and established radiological medicine during international crisis.",
    "sections": [
      {
        "id": "sec-acad-1",
        "type": "experience",
        "title": "Academic & Laboratory Appointments",
        "items": [
          {
            "id": "item-acad-1-1",
            "title": "Director of the Laboratory",
            "subtitle": "Radium Institute of the University of Paris",
            "date": "1914 — 1934",
            "description": "Directed international radiochemistry research laboratory and medical physics programs.",
            "bullets": [
              "Supervised 45 doctoral dissertations in nuclear chemistry, establishing fundamental standards for isotope purification",
              "Developed international radium standard unit (the Curie) to calibrate radioactive measurements across worldwide laboratories",
              "Published 30+ peer-reviewed treatises on alpha radiation ionization, isotopic separation, and crystalline salt precipitation"
            ]
          },
          {
            "id": "item-acad-1-2",
            "title": "Director of Radiology Services",
            "subtitle": "Red Cross Ambulatory Service",
            "date": "1914 — 1918",
            "description": "Engineered and operated battlefield diagnostic radiological services.",
            "bullets": [
              "Engineered and deployed 20 mobile radiological vehicles ('Petites Curies') and 200 hospital radiological posts",
              "Supervised radiological screening for over 1,000,000 wounded soldiers, training 150 women technicians in diagnostic radiography"
            ]
          },
          {
            "id": "item-acad-1-3",
            "title": "Chair of General Physics",
            "subtitle": "Faculty of Sciences, Sorbonne University",
            "date": "1906 — 1914",
            "description": "First woman professor appointed at the Sorbonne; created graduate curriculum in radiation physics.",
            "bullets": [
              "Established dedicated postgraduate curriculum in radioactivity, quantum phenomena, and atomic spectroscopy"
            ]
          }
        ]
      },
      {
        "id": "sec-acad-2",
        "type": "education",
        "title": "Degrees & Doctoral Training",
        "items": [
          {
            "id": "item-acad-2-1",
            "title": "Ph.D. in Physical Sciences",
            "subtitle": "Sorbonne University (Faculty of Sciences)",
            "date": "1903",
            "description": "Dissertation: Recherches sur les substances radioactives (Mention Très Honorable)."
          },
          {
            "id": "item-acad-2-2",
            "title": "Licence ès Sciences Physiques & Mathématiques",
            "subtitle": "Sorbonne University",
            "date": "1893 — 1894",
            "description": "Ranked first in physics licence; second in mathematical sciences licence."
          }
        ]
      },
      {
        "id": "sec-acad-3",
        "type": "skills",
        "title": "Scientific Proficiencies",
        "items": [
          {
            "id": "item-acad-3-1",
            "title": "Experimental Methodology",
            "description": "Radiometric Measurement, Fractional Crystallization, Electrometer Calibration, Isotope Separation, Laboratory Safety Protocols"
          }
        ]
      },
      {
        "id": "sec-acad-4",
        "type": "projects",
        "title": "Landmark Discoveries",
        "items": [
          {
            "id": "item-acad-4-1",
            "title": "Discovery & Isolation of Radium and Polonium",
            "subtitle": "Nobel Prize in Physics (1903) & Chemistry (1911)",
            "date": "1898 — 1911",
            "description": "Chemically isolated pure metallic radium from tons of pitchblende ore via painstaking fractional crystallization."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "academic",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#2a5885"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "corporate": {
  "id": "corporate",
  "templateId": "corporate",
  "templateName": "Corporate Blue",
  "templateDesc": "Conservative top-band layout suited to finance and consulting",
  "personName": "Thomas Edison",
  "personRole": "Managing Director & Industrial R&D Architect",
  "accentColor": "#1e3a8a",
  "cv": {
    "id": "sample-corporate",
    "version": "1.0.0",
    "contact": {
      "name": "Thomas Edison",
      "email": "thomas.edison@example.com",
      "phone": "+1 (555) 973-1847",
      "location": "West Orange, NJ",
      "website": "edison-enterprises.com"
    },
    "summary": "Industrial leader and entrepreneur who created the first modern industrial research laboratory, commercialized central electric power utilities, and managed large-scale corporate holding syndicates.",
    "sections": [
      {
        "id": "sec-corp-1",
        "type": "experience",
        "title": "Executive & Industrial Leadership",
        "items": [
          {
            "id": "item-corp-1-1",
            "title": "President & Chief Executive Officer",
            "subtitle": "Edison Electric Light Company",
            "date": "1878 — 1892",
            "description": "Pioneered commercial electric utilities and consolidated integrated industrial supply chains.",
            "bullets": [
              "Conceived and constructed Pearl Street Station in New York, the first commercial central electric power generating utility",
              "Designed integrated parallel-circuit distribution architecture including underground conductors, safety fuses, and kilowatt-hour meters",
              "Orchestrated consolidation of manufacturing and utility subsidiaries to form General Electric Company (1892)"
            ]
          },
          {
            "id": "item-corp-1-2",
            "title": "Managing Director",
            "subtitle": "Menlo Park Industrial Research Laboratory",
            "date": "1876 — 1886",
            "description": "Created first modern commercial R&D facility with cross-functional technical teams.",
            "bullets": [
              "Established the prototype for corporate R&D by coordinating teams of physicists, chemists, and machinists on parallel commercial projects",
              "Secured 1,093 US utility patents spanning incandescent filaments, phonograph cylinders, and alkaline storage batteries"
            ]
          },
          {
            "id": "item-corp-1-3",
            "title": "Chief Telegraphic Engineer",
            "subtitle": "Gold & Stock Telegraph Company",
            "date": "1870 — 1876",
            "description": "Engineered automated stock tickers and multiplex telecommunication lines.",
            "bullets": [
              "Invented quadruplex telegraph sending 4 simultaneous signals across a single wire, yielding $500K annual wire savings"
            ]
          }
        ]
      },
      {
        "id": "sec-corp-2",
        "type": "education",
        "title": "Foundational Background",
        "items": [
          {
            "id": "item-corp-2-1",
            "title": "Self-Directed Scholar in Practical Chemistry and Electrical Physics",
            "subtitle": "Telegraphic Apprenticeship",
            "date": "1863 — 1868",
            "description": "Intensive practical experimentation with electrochemical cells, relay circuits, and telegraph instrumentation."
          }
        ]
      },
      {
        "id": "sec-corp-3",
        "type": "skills",
        "title": "Executive Competencies",
        "items": [
          {
            "id": "item-corp-3-1",
            "title": "Strategic Management",
            "description": "Corporate R&D Management, Industrial Utility Architecture, Intellectual Property Strategy, Capital Syndication, Manufacturing Operations"
          }
        ]
      },
      {
        "id": "sec-corp-4",
        "type": "projects",
        "title": "Utility Infrastructure",
        "items": [
          {
            "id": "item-corp-4-1",
            "title": "Pearl Street Central Electrical Station",
            "subtitle": "Commercial Power Grid Model",
            "date": "1882",
            "description": "First centralized utility distributing commercial power to 59 customers and 1,200 lamps in lower Manhattan."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "corporate",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#1e3a8a"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "minimal": {
  "id": "minimal",
  "templateId": "minimal",
  "templateName": "Minimal",
  "templateDesc": "Generous whitespace and quiet typography for understated profiles",
  "personName": "Dieter Rams",
  "personRole": "Head of Industrial Design & Design Ethicist",
  "accentColor": "#4b5563",
  "cv": {
    "id": "sample-minimal",
    "version": "1.0.0",
    "contact": {
      "name": "Dieter Rams",
      "email": "dieter.rams@example.com",
      "phone": "+1 (555) 611-1932",
      "location": "Kronberg, DE",
      "website": "rams-design.de"
    },
    "summary": "Pioneering industrial designer whose 'Less, but better' philosophy and Ten Principles of Good Design shaped timeless consumer electronics, modular architecture, and enduring design ethics.",
    "sections": [
      {
        "id": "sec-min-1",
        "type": "experience",
        "title": "Design Leadership",
        "items": [
          {
            "id": "item-min-1-1",
            "title": "Head of Design",
            "subtitle": "Braun AG",
            "date": "1961 — 1995",
            "description": "Directed corporate industrial design department across consumer audio and household appliances.",
            "bullets": [
              "Directed industrial design across 500+ consumer electronics, high-fidelity audio equipment, and grooming appliances",
              "Stripped non-functional decorative styling, achieving 98% usability satisfaction and iconic status in museums worldwide",
              "Co-developed Braun SK4 audio console ('Snow White's Coffin') introducing transparent acrylic housing to consumer hi-fi"
            ]
          },
          {
            "id": "item-min-1-2",
            "title": "Chief Furniture Designer",
            "subtitle": "Vitsœ",
            "date": "1959 — Present",
            "description": "Designed long-life modular furniture systems engineered for generational utility.",
            "bullets": [
              "Designed the 606 Universal Shelving System, engineered as an adaptable modular anodized aluminum extrusion system",
              "Maintained backward compatibility for 60+ years, allowing components manufactured today to integrate with 1960 originals"
            ]
          },
          {
            "id": "item-min-1-3",
            "title": "Architect & Interior Draftsman",
            "subtitle": "Otto Apel Architecture",
            "date": "1953 — 1955",
            "description": "Drafted architectural specifications and interiors for post-war civic and diplomatic buildings.",
            "bullets": [
              "Produced technical architectural drafts for consular and institutional civic buildings across the Federal Republic of Germany"
            ]
          }
        ]
      },
      {
        "id": "sec-min-2",
        "type": "education",
        "title": "Education",
        "items": [
          {
            "id": "item-min-2-1",
            "title": "Diploma in Interior Architecture & Design",
            "subtitle": "Werkkunstschule Wiesbaden",
            "date": "1953",
            "description": "Graduated with highest honors; dual credential in interior architecture and carpentry guild certification."
          }
        ]
      },
      {
        "id": "sec-min-3",
        "type": "skills",
        "title": "Design Competencies",
        "items": [
          {
            "id": "item-min-3-1",
            "title": "Principles & Practices",
            "description": "Minimalist Ergonomics, Systems Modularity, Product Design Ethics, Acoustic Housing Architecture, Material Honesty"
          }
        ]
      },
      {
        "id": "sec-min-4",
        "type": "projects",
        "title": "Design Principles",
        "items": [
          {
            "id": "item-min-4-1",
            "title": "Ten Principles for Good Design",
            "subtitle": "International Design Canon",
            "date": "1976",
            "description": "Enduring manifesto establishing that good design is innovative, useful, aesthetic, understandable, unobtrusive, honest, durable, thorough, and environmentally friendly."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "minimal",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#4b5563"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "bold": {
  "id": "bold",
  "templateId": "bold",
  "templateName": "Bold Impact",
  "templateDesc": "Oversized name and strong dividers for senior individual contributors",
  "personName": "Nikola Tesla",
  "personRole": "Principal Electrical & Power Systems Engineer",
  "accentColor": "#d97706",
  "cv": {
    "id": "sample-bold",
    "version": "1.0.0",
    "contact": {
      "name": "Nikola Tesla",
      "email": "nikola.tesla@example.com",
      "phone": "+1 (555) 212-1856",
      "location": "New York, NY",
      "website": "tesla-electric.org"
    },
    "summary": "Visionary electrical engineer and inventor who invented the polyphase alternating current power grid, induction motor, and resonant high-frequency transformer technologies.",
    "sections": [
      {
        "id": "sec-bold-1",
        "type": "experience",
        "title": "High-Voltage Systems & R&D",
        "items": [
          {
            "id": "item-bold-1-1",
            "title": "Consulting Engineer & Systems Architect",
            "subtitle": "Westinghouse Electric Corporation",
            "date": "1888 — 1896",
            "description": "Engineered large-scale AC polyphase generation and transmission grids.",
            "bullets": [
              "Licensed 40 polyphase alternating current patents, proving long-distance high-voltage transmission over direct current",
              "Engineered the Niagara Falls hydroelectric generation plant, generating 15,000 horsepower of AC power transmitted 26 miles",
              "Powered the 1893 Chicago World's Columbian Exposition with 100,000 incandescent lamps on polyphase transformers"
            ]
          },
          {
            "id": "item-bold-1-2",
            "title": "Founder & Chief Scientist",
            "subtitle": "Tesla Electric Company Laboratories",
            "date": "1887 — 1905",
            "description": "Conducted high-frequency electromagnetic resonance and wireless transmission investigations.",
            "bullets": [
              "Invented the brushless alternating current induction motor, eliminating mechanical commutators and sparking wear",
              "Invented the Tesla coil resonant transformer capable of producing multi-million-volt electrical discharges for wireless testing"
            ]
          },
          {
            "id": "item-bold-1-3",
            "title": "Electrical Systems Specialist",
            "subtitle": "Continental Edison Company (Paris & Strasbourg)",
            "date": "1882 — 1884",
            "description": "Constructed direct-current power plants and diagnosed dynamo equipment failures.",
            "bullets": [
              "Diagnosed and corrected direct-current dynamo regulation failures across railway lighting and municipal plants"
            ]
          }
        ]
      },
      {
        "id": "sec-bold-2",
        "type": "education",
        "title": "Engineering Education",
        "items": [
          {
            "id": "item-bold-2-1",
            "title": "Electrical Engineering & Mathematics",
            "subtitle": "Graz University of Technology",
            "date": "1875 — 1878",
            "description": "Completed rigorous coursework in analytical mechanics, integral calculus, and thermodynamics."
          }
        ]
      },
      {
        "id": "sec-bold-3",
        "type": "skills",
        "title": "Engineering Specializations",
        "items": [
          {
            "id": "item-bold-3-1",
            "title": "Power & Fields",
            "description": "Polyphase AC Transmission, Electromagnetic Resonance, Induction Motor Design, High-Voltage Safety, Turbine Dynamics"
          }
        ]
      },
      {
        "id": "sec-bold-4",
        "type": "projects",
        "title": "Industrial Milestones",
        "items": [
          {
            "id": "item-bold-4-1",
            "title": "Niagara Falls Polyphase Hydroelectric Plant",
            "subtitle": "World Grid Standard",
            "date": "1895",
            "description": "Scalable commercial alternating current generation installation establishing AC power as the global standard for industrial distribution."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "bold",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#d97706"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "elegant": {
  "id": "elegant",
  "templateId": "elegant",
  "templateName": "Elegant Serif",
  "templateDesc": "Refined centered header with light serif body copy",
  "personName": "Ada Lovelace",
  "personRole": "Computational Theorist & Algorithmic Pioneer",
  "accentColor": "#2457eb",
  "cv": {
    "id": "sample-elegant",
    "version": "1.0.0",
    "contact": {
      "name": "Ada Lovelace",
      "email": "ada.lovelace@example.com",
      "phone": "+1 (555) 181-5010",
      "location": "London, UK",
      "website": "lovelace-algorithms.org"
    },
    "summary": "Mathematician and computational visionary who published the world's first computer algorithm, anticipating that computing engines would manipulate symbols, art, and music beyond numerical calculation.",
    "sections": [
      {
        "id": "sec-eleg-1",
        "type": "experience",
        "title": "Mathematical & Algorithmic Research",
        "items": [
          {
            "id": "item-eleg-1-1",
            "title": "Principal Algorithmist",
            "subtitle": "Analytical Engine Collaborative Project",
            "date": "1842 — 1852",
            "description": "Formulated symbolic logic and computational program sets for general mechanical computing.",
            "bullets": [
              "Translated Luigi Menabrea's sketch and expanded it threefold with comprehensive annotations, culminating in Note G",
              "Authored complete algorithmic stepwise instructions for the mechanical Analytical Engine to calculate Bernoulli numbers",
              "Articulated the conceptual leap of 'poetical science', recognizing algorithmic manipulation of general symbolic variables"
            ]
          },
          {
            "id": "item-eleg-1-2",
            "title": "Mathematical Research Scholar",
            "subtitle": "De Morgan & Babbage Circle",
            "date": "1835 — 1842",
            "description": "Researched combinatorial analysis and punch-card instruction systems.",
            "bullets": [
              "Audited mechanical instruction card architectures adapted from Jacquard punch looms for automatic branching operations",
              "Solved differential equations and matrix algebra expressions for prototype mechanical gear calculation assemblies"
            ]
          }
        ]
      },
      {
        "id": "sec-eleg-2",
        "type": "education",
        "title": "Scholarly Mentorship",
        "items": [
          {
            "id": "item-eleg-2-1",
            "title": "Advanced Mathematics & Symbolic Logic",
            "subtitle": "Private Tutelage with Augustus De Morgan & Mary Somerville",
            "date": "1832 — 1840",
            "description": "Focused on calculus, logic algebra, and mechanical calculating device theory."
          }
        ]
      },
      {
        "id": "sec-eleg-3",
        "type": "skills",
        "title": "Mathematical Foundations",
        "items": [
          {
            "id": "item-eleg-3-1",
            "title": "Disciplines",
            "description": "Algorithmic Logic, Symbolic Computation, Combinatorics, Looping & Conditional Execution, Analytical Mechanics"
          }
        ]
      },
      {
        "id": "sec-eleg-4",
        "type": "projects",
        "title": "Published Algorithms",
        "items": [
          {
            "id": "item-eleg-4-1",
            "title": "Note G: Algorithm for Bernoulli Numbers",
            "subtitle": "First Published Computer Program",
            "date": "1843",
            "description": "First published stepwise operational table detailing variables, operations, and intermediate registers for mechanical execution."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "elegant",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#2457eb"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "startup": {
  "id": "startup",
  "templateId": "startup",
  "templateName": "Startup Friendly",
  "templateDesc": "Rounded panels and approachable rhythm for early-stage teams",
  "personName": "Steve Jobs",
  "personRole": "Co-Founder, Chief Executive & Product Visionary",
  "accentColor": "#0284c7",
  "cv": {
    "id": "sample-startup",
    "version": "1.0.0",
    "contact": {
      "name": "Steve Jobs",
      "email": "steve.jobs@example.com",
      "phone": "+1 (555) 408-1955",
      "location": "Cupertino, CA",
      "website": "apple-archive.com"
    },
    "summary": "Visionary product architect and entrepreneur who guided the personal computer revolution, modern graphical user interfaces, digital typography, and mobile computing ecosystems.",
    "sections": [
      {
        "id": "sec-start-1",
        "type": "experience",
        "title": "Venture & Product Leadership",
        "items": [
          {
            "id": "item-start-1-1",
            "title": "Co-Founder & Chief Executive Officer",
            "subtitle": "Apple Inc.",
            "date": "1997 — 2011",
            "description": "Led historic organizational revival and built premier consumer device ecosystem.",
            "bullets": [
              "Orchestrated historic corporate turnaround, scaling enterprise market valuation from $2B near-bankruptcy to over $350B",
              "Defined and shipped revolutionary product categories: iMac, iPod, iTunes ecosystem, iPhone, iPad, and MacBook Air",
              "Unified industrial design, proprietary software platforms, and supply chain logistics into a seamless consumer experience"
            ]
          },
          {
            "id": "item-start-1-2",
            "title": "Founder & Chief Executive Officer",
            "subtitle": "NeXT Computer",
            "date": "1985 — 1996",
            "description": "Built object-oriented workstation hardware and operating system software.",
            "bullets": [
              "Created NeXTSTEP object-oriented Unix operating system, later acquired by Apple to form the core architecture of macOS and iOS",
              "Shipped advanced developer workstation used by Tim Berners-Lee to build the world's first web browser and web server"
            ]
          },
          {
            "id": "item-start-1-3",
            "title": "Majority Shareholder & Chairman",
            "subtitle": "Pixar Animation Studios",
            "date": "1986 — 2006",
            "description": "Guided commercial growth of computer-animated feature film studio.",
            "bullets": [
              "Financed and directed strategic independence of computer animation studio, shipping Toy Story; negotiated $7.4B Disney merger"
            ]
          }
        ]
      },
      {
        "id": "sec-start-2",
        "type": "education",
        "title": "Education",
        "items": [
          {
            "id": "item-start-2-1",
            "title": "Typography & Aesthetic Studies",
            "subtitle": "Reed College",
            "date": "1972",
            "description": "Studied calligraphy, serif/sans-serif letterforms, and proportional font spacing that shaped modern PC fonts."
          }
        ]
      },
      {
        "id": "sec-start-3",
        "type": "skills",
        "title": "Product & Strategy Skills",
        "items": [
          {
            "id": "item-start-3-1",
            "title": "Core Pillars",
            "description": "Product Strategy, Human Interface Guidelines, Hardware-Software Synthesis, Brand Positioning, Supply Chain Operations"
          }
        ]
      },
      {
        "id": "sec-start-4",
        "type": "projects",
        "title": "Category-Defining Inventions",
        "items": [
          {
            "id": "item-start-4-1",
            "title": "Original Macintosh Human Interface",
            "subtitle": "Personal Computing Paradigm",
            "date": "1984",
            "description": "Popularized mouse-driven GUI, desktop metaphors, proportional digital fonts, and what-you-see-is-what-you-get document layout."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "startup",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#0284c7"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "legal": {
  "id": "legal",
  "templateId": "legal",
  "templateName": "Legal Professional",
  "templateDesc": "Tight margins and formal caps for law and compliance careers",
  "personName": "Ruth Bader Ginsburg",
  "personRole": "Supreme Court Associate Justice & Jurist",
  "accentColor": "#1e293b",
  "cv": {
    "id": "sample-legal",
    "version": "1.0.0",
    "contact": {
      "name": "Ruth Bader Ginsburg",
      "email": "rbg@example.com",
      "phone": "+1 (555) 202-1933",
      "location": "Washington, DC",
      "website": "ginsburg-jurisprudence.org"
    },
    "summary": "Eminent constitutional jurist and Supreme Court Associate Justice whose strategic litigation dismantled institutional gender discrimination and solidified Equal Protection jurisprudence.",
    "sections": [
      {
        "id": "sec-leg-1",
        "type": "experience",
        "title": "Judicial & Appellate Experience",
        "items": [
          {
            "id": "item-leg-1-1",
            "title": "Associate Justice",
            "subtitle": "Supreme Court of the United States",
            "date": "1993 — 2020",
            "description": "Adjudicated constitutional and federal statutory disputes across 27 terms.",
            "bullets": [
              "Authored 300+ opinions of the Court including landmark majority opinion in United States v. Virginia (1996)",
              "Penned celebrated dissents advocating statutory pay fairness (Ledbetter v. Goodyear) and Voting Rights Act protections",
              "Maintained a 100% oral argument attendance record across 27 terms of Supreme Court federal judicial service"
            ]
          },
          {
            "id": "item-leg-1-2",
            "title": "Circuit Judge",
            "subtitle": "US Court of Appeals for the DC Circuit",
            "date": "1980 — 1993",
            "description": "Adjudicated administrative, statutory, and regulatory appeals.",
            "bullets": [
              "Penned over 300 appellate decisions marked by rigorous statutory analysis, administrative law precision, and collegiate consensus"
            ]
          },
          {
            "id": "item-leg-1-3",
            "title": "General Counsel & Director",
            "subtitle": "ACLU Women's Rights Project",
            "date": "1972 — 1980",
            "description": "Crafted incremental constitutional litigation strategy under the 14th Amendment Equal Protection Clause.",
            "bullets": [
              "Argued six precedent-setting constitutional sex discrimination appeals before the Supreme Court, prevailing in five"
            ]
          },
          {
            "id": "item-leg-1-4",
            "title": "Professor of Law",
            "subtitle": "Columbia Law School",
            "date": "1972 — 1980",
            "description": "First tenured female professor at Columbia Law School.",
            "bullets": [
              "Co-authored first comprehensive American law school casebook on sex-based discrimination and equal citizenship"
            ]
          }
        ]
      },
      {
        "id": "sec-leg-2",
        "type": "education",
        "title": "Legal Education",
        "items": [
          {
            "id": "item-leg-2-1",
            "title": "LL.B. / J.D.",
            "subtitle": "Columbia Law School",
            "date": "1959",
            "description": "Tied for 1st in class; Columbia Law Review; previously Harvard Law Review (1956 — 1958)."
          }
        ]
      },
      {
        "id": "sec-leg-3",
        "type": "skills",
        "title": "Legal & Juridical Competencies",
        "items": [
          {
            "id": "item-leg-3-1",
            "title": "Practice Areas",
            "description": "Constitutional Interpretation, Appellate Advocacy, Equal Protection Litigation, Statutory Analysis, Judicial Drafting"
          }
        ]
      },
      {
        "id": "sec-leg-4",
        "type": "projects",
        "title": "Constitutional Milestones",
        "items": [
          {
            "id": "item-leg-4-1",
            "title": "United States v. Virginia (518 U.S. 515)",
            "subtitle": "Landmark Equal Protection Precedent",
            "date": "1996",
            "description": "Authored majority opinion establishing that state institutions must show an 'exceedingly persuasive justification' for sex-based classifications."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "legal",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#1e293b"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "clinical": {
  "id": "clinical",
  "templateId": "clinical",
  "templateName": "Clinical Care",
  "templateDesc": "Clean clinical palette with structured credentials sections",
  "personName": "Jonas Salk",
  "personRole": "Medical Researcher & Epidemiologist",
  "accentColor": "#0d9488",
  "cv": {
    "id": "sample-clinical",
    "version": "1.0.0",
    "contact": {
      "name": "Jonas Salk",
      "email": "jonas.salk@example.com",
      "phone": "+1 (555) 858-1914",
      "location": "La Jolla, CA",
      "website": "salk-institute.org"
    },
    "summary": "Pioneering virologist and epidemiologist who developed the first safe inactivated poliovirus vaccine and established world-class biological research institutions without personal patent royalties.",
    "sections": [
      {
        "id": "sec-clin-1",
        "type": "experience",
        "title": "Clinical & Epidemiological Leadership",
        "items": [
          {
            "id": "item-clin-1-1",
            "title": "Founding Director & Fellow",
            "subtitle": "Salk Institute for Biological Studies",
            "date": "1960 — 1995",
            "description": "Established world-class biological research institute and led viral immunology laboratories.",
            "bullets": [
              "Established premier non-profit biomedical research center convening Nobel laureates in molecular biology and neurosciences",
              "Directed research on autoimmune disease therapies, viral oncogenesis, and retroviral immunotherapy"
            ]
          },
          {
            "id": "item-clin-1-2",
            "title": "Director of the Virus Research Laboratory",
            "subtitle": "University of Pittsburgh School of Medicine",
            "date": "1947 — 1960",
            "description": "Developed and standardized inactivated poliovirus vaccine.",
            "bullets": [
              "Developed formaldehyde-inactivated poliovirus vaccine (IPV) cultivating all three virus strains in monkey kidney tissue",
              "Coordinated the largest clinical trial in history with 1.8 million children, proving 80-90% vaccine efficacy against paralytic polio",
              "Reduced US polio incidence from 45,000 annual cases in 1952 to fewer than 1,000 within five years of nationwide rollout"
            ]
          },
          {
            "id": "item-clin-1-3",
            "title": "Assistant Professor of Epidemiology",
            "subtitle": "University of Michigan School of Public Health",
            "date": "1942 — 1947",
            "description": "Conducted influenza immunization studies for the Armed Forces Epidemiological Board.",
            "bullets": [
              "Co-developed bivalent inactivated influenza A/B vaccine adopted as the standard immunization by the US military"
            ]
          }
        ]
      },
      {
        "id": "sec-clin-2",
        "type": "education",
        "title": "Medical Education & Training",
        "items": [
          {
            "id": "item-clin-2-1",
            "title": "M.D. in Medicine",
            "subtitle": "New York University College of Medicine",
            "date": "1939",
            "description": "Alpha Omega Alpha honor society; completed two-year clinical residency at Mount Sinai Hospital."
          }
        ]
      },
      {
        "id": "sec-clin-3",
        "type": "skills",
        "title": "Medical & Clinical Proficiencies",
        "items": [
          {
            "id": "item-clin-3-1",
            "title": "Specialties",
            "description": "Inactivated Vaccine Formulation, Viral Tissue Cultivation, Large-Scale Field Trials, Public Health Epidemiology, Immunology"
          }
        ]
      },
      {
        "id": "sec-clin-4",
        "type": "projects",
        "title": "Breakthrough Immunizations",
        "items": [
          {
            "id": "item-clin-4-1",
            "title": "Salk Inactivated Poliovirus Vaccine (IPV)",
            "subtitle": "Public Domain Immunization",
            "date": "1955",
            "description": "Proved that a killed virus could confer durable immunity without risk of vaccine-derived paralytic reversion; gifted without patent claim."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "clinical",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#0d9488"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "designer": {
  "id": "designer",
  "templateId": "designer",
  "templateName": "Designer Sidebar",
  "templateDesc": "Asymmetric sidebar accent highlighting contact and skills",
  "personName": "Jony Ive",
  "personRole": "Chief Design Officer & Industrial Designer",
  "accentColor": "#52525b",
  "cv": {
    "id": "sample-designer",
    "version": "1.0.0",
    "contact": {
      "name": "Jony Ive",
      "email": "jony.ive@example.com",
      "phone": "+1 (555) 415-1967",
      "location": "San Francisco, CA",
      "website": "lovefrom.com"
    },
    "summary": "Internationally celebrated industrial designer who led the design identity of personal computing devices, pioneering CNC unibody aluminum engineering, edge purity, and material clarity.",
    "sections": [
      {
        "id": "sec-des-1",
        "type": "experience",
        "title": "Industrial & Hardware Design",
        "items": [
          {
            "id": "item-des-1-1",
            "title": "Chief Design Officer",
            "subtitle": "Apple Industrial Design Group",
            "date": "1996 — 2019",
            "description": "Directed corporate industrial design and human interface teams across all hardware products.",
            "bullets": [
              "Built and directed the industrial design team responsible for iMac, iPod, iPhone, iPad, Apple Watch, and MacBook Pro",
              "Pioneered aerospace-grade aluminum unibody milling, eliminating structural joints and reducing device thickness by 40%",
              "Named inventor on 5,000+ worldwide design and utility patents celebrating precise tolerances and minimalist ergonomics"
            ]
          },
          {
            "id": "item-des-1-2",
            "title": "Co-Founder & Creative Director",
            "subtitle": "LoveFrom Creative Collective",
            "date": "2019 — Present",
            "description": "Directs multidisciplinary studio spanning industrial design, bespoke typography, and hardware craft.",
            "bullets": [
              "Consults on tactile craft, bespoke type design, and physical engineering for leading international brands and institutions"
            ]
          },
          {
            "id": "item-des-1-3",
            "title": "Senior Industrial Designer",
            "subtitle": "Tangerine Design Consultancy",
            "date": "1989 — 1992",
            "description": "Developed concept electronics and commercial fixtures.",
            "bullets": [
              "Designed ceramic fixtures, hand tools, and micro-appliances focusing on emotional connection and human grip physics"
            ]
          }
        ]
      },
      {
        "id": "sec-des-2",
        "type": "education",
        "title": "Design Education",
        "items": [
          {
            "id": "item-des-2-1",
            "title": "Bachelor of Arts in Industrial Design",
            "subtitle": "Newcastle Polytechnic",
            "date": "1989",
            "description": "First-Class Honours; recipient of multiple Royal Society of Arts design travel awards."
          }
        ]
      },
      {
        "id": "sec-des-3",
        "type": "skills",
        "title": "Design Disciplines",
        "items": [
          {
            "id": "item-des-3-1",
            "title": "Hardware Craft",
            "description": "Unibody Aluminum Machining, Surface Curvature (G2 Continuity), Material Honesty, Tactile Ergonomics, Minimalist Form"
          }
        ]
      },
      {
        "id": "sec-des-4",
        "type": "projects",
        "title": "Iconic Hardware Designs",
        "items": [
          {
            "id": "item-des-4-1",
            "title": "iPhone 4 Structural Enclosure",
            "subtitle": "Precision Engineering Benchmark",
            "date": "2010",
            "description": "Glass-and-steel sandwich architecture where the structural perimeter steel band functions as the integrated cellular antenna."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "designer",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#52525b"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "timeline": {
  "id": "timeline",
  "templateId": "timeline",
  "templateName": "Career Timeline",
  "templateDesc": "Vertical timeline rail connecting roles and education chronologically",
  "personName": "Neil Armstrong",
  "personRole": "Aeronautical Engineer & Apollo 11 Commander",
  "accentColor": "#2563eb",
  "cv": {
    "id": "sample-timeline",
    "version": "1.0.0",
    "contact": {
      "name": "Neil Armstrong",
      "email": "neil.armstrong@example.com",
      "phone": "+1 (555) 281-1930",
      "location": "Lebanon, OH",
      "website": "armstrong-aero.nasa.gov"
    },
    "summary": "Research test pilot, aeronautical engineer, and astronaut commander who flew hypersonic rocket research aircraft and manually piloted the first human lunar landing touchdown.",
    "sections": [
      {
        "id": "sec-time-1",
        "type": "experience",
        "title": "Flight Testing & Space Exploration",
        "items": [
          {
            "id": "item-time-1-1",
            "title": "Spacecraft Commander",
            "subtitle": "NASA Astronaut Corps (Apollo 11)",
            "date": "1969",
            "description": "Commanded first crewed lunar landing mission.",
            "bullets": [
              "Manually piloted the Lunar Module Eagle over boulder fields to safe touchdown in the Sea of Tranquility with under 30 seconds of fuel",
              "Conducted first lunar surface EVA, collecting 21.5 kg of geological samples and deploying early seismic monitoring packages"
            ]
          },
          {
            "id": "item-time-1-2",
            "title": "Command Pilot",
            "subtitle": "NASA Astronaut Corps (Gemini 8)",
            "date": "1966",
            "description": "Executed first orbital docking in human spaceflight history.",
            "bullets": [
              "Executed the first successful docking between two spacecraft in earth orbit with the unmanned Agena target vehicle",
              "Recovered spacecraft from a life-threatening 1-revolution-per-second tumble caused by a stuck roll thruster using reentry thrusters"
            ]
          },
          {
            "id": "item-time-1-3",
            "title": "Research Test Pilot",
            "subtitle": "NASA Flight Research Center (Edwards AFB)",
            "date": "1955 — 1962",
            "description": "Flew rocket-propelled experimental aircraft investigating hypersonic aerodynamics.",
            "bullets": [
              "Completed 7 test flights in the rocket-powered North American X-15, achieving Mach 5.74 (3,989 mph) and 207,500 feet altitude",
              "Evaluated aerodynamic cross-coupling, reaction control rockets, and hypersonic vehicle energy management techniques"
            ]
          },
          {
            "id": "item-time-1-4",
            "title": "Naval Aviator",
            "subtitle": "United States Navy (VF-51 Screaming Eagles)",
            "date": "1949 — 1952",
            "description": "Carrier-based jet fighter combat operations.",
            "bullets": [
              "Flew 78 combat missions from aircraft carriers, logging over 2,600 total flight hours in naval jet fighters"
            ]
          }
        ]
      },
      {
        "id": "sec-time-2",
        "type": "education",
        "title": "Aeronautical Degrees",
        "items": [
          {
            "id": "item-time-2-1",
            "title": "B.S. in Aeronautical Engineering",
            "subtitle": "Purdue University",
            "date": "1955",
            "description": "Specialized in aerodynamic structures and propulsion mechanics."
          },
          {
            "id": "item-time-2-2",
            "title": "M.S. in Aerospace Engineering",
            "subtitle": "University of Southern California",
            "date": "1970",
            "description": "Graduate research in hypersonic flight dynamics and spacecraft control systems."
          }
        ]
      },
      {
        "id": "sec-time-3",
        "type": "skills",
        "title": "Aviation & Engineering Skills",
        "items": [
          {
            "id": "item-time-3-1",
            "title": "Core Competencies",
            "description": "Hypersonic Flight Envelopes, Reaction Control Systems, Lunar Trajectory Navigation, Systems Cockpit Ergonomics, Aerodynamics"
          }
        ]
      },
      {
        "id": "sec-time-4",
        "type": "projects",
        "title": "Flight Test Records",
        "items": [
          {
            "id": "item-time-4-1",
            "title": "North American X-15 Rocket Plane Expansion",
            "subtitle": "Hypersonic Boundary Flight",
            "date": "1960 — 1962",
            "description": "Gathered high-enthalpy aerodynamic data that proved vital to Space Shuttle thermal protection and lifting-body designs."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "timeline",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#2563eb"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "aurora": {
  "id": "aurora",
  "templateId": "aurora",
  "templateName": "Aurora Panel",
  "templateDesc": "Gradient sidebar panel with high-contrast section labels",
  "personName": "Hedy Lamarr",
  "personRole": "Spread-Spectrum Co-Inventor & Systems Innovator",
  "accentColor": "#2457eb",
  "cv": {
    "id": "sample-aurora",
    "version": "1.0.0",
    "contact": {
      "name": "Hedy Lamarr",
      "email": "hedy.lamarr@example.com",
      "phone": "+1 (555) 310-1914",
      "location": "Los Angeles, CA",
      "website": "lamarr-telecom.org"
    },
    "summary": "Innovator and communications pioneer who co-invented frequency-hopping spread spectrum technology, the fundamental wireless protocol underlying modern Wi-Fi, Bluetooth, and cellular CDMA.",
    "sections": [
      {
        "id": "sec-aur-1",
        "type": "experience",
        "title": "Invention & Technological Research",
        "items": [
          {
            "id": "item-aur-1-1",
            "title": "Co-Inventor & Wireless Systems Architect",
            "subtitle": "Secret Communication System Group",
            "date": "1941 — 1945",
            "description": "Pioneered frequency-hopping spread-spectrum radio transmission.",
            "bullets": [
              "Co-invented and patented US Patent 2,292,387 for spread-spectrum frequency hopping using synchronized slotted rolls across 88 frequencies",
              "Designed anti-jamming RF guidance systems for radio-controlled torpedoes immune to enemy frequency interception",
              "Gifted full patent rights to the US Government to strengthen Allied wartime naval security"
            ]
          },
          {
            "id": "item-aur-1-2",
            "title": "Aerodynamic & Materials Consultant",
            "subtitle": "Howard Hughes Aviation Research",
            "date": "1938 — 1942",
            "description": "Conducted aerofoil shape studies and practical consumer chemistry experiments.",
            "bullets": [
              "Consulted on high-speed aerofoil wing designs, modeling wing curvature on aquatic predator fin dynamics",
              "Created chemical tablet prototypes for instantly carbonated field beverage rations for defense units"
            ]
          },
          {
            "id": "item-aur-1-3",
            "title": "Creative Producer & Screen Artist",
            "subtitle": "International Cinematic Arts",
            "date": "1933 — 1958",
            "description": "Managed independent film production studio, directing lighting acoustics, set architecture, and narrative design.",
            "bullets": [
              "Produced pioneering independent cinema utilizing novel studio lighting architectures and European camera staging"
            ]
          }
        ]
      },
      {
        "id": "sec-aur-2",
        "type": "education",
        "title": "Scientific Apprenticeship",
        "items": [
          {
            "id": "item-aur-2-1",
            "title": "Independent Studies in Applied Chemistry and Wireless Physics",
            "subtitle": "Vienna & London Research Circles",
            "date": "1930 — 1938",
            "description": "Self-directed investigations into telecommunications, radio telemetry, and materials formulation."
          }
        ]
      },
      {
        "id": "sec-aur-3",
        "type": "skills",
        "title": "Invention & Engineering Skills",
        "items": [
          {
            "id": "item-aur-3-1",
            "title": "Technical Domains",
            "description": "Spread-Spectrum Communications, Frequency-Hopping RF, Anti-Jamming Guidance, Aerofoil Hydrodynamics, Synchronization Mechanisms"
          }
        ]
      },
      {
        "id": "sec-aur-4",
        "type": "projects",
        "title": "Breakthrough Patents",
        "items": [
          {
            "id": "item-aur-4-1",
            "title": "US Patent 2,292,387: Secret Communication System",
            "subtitle": "Spread-Spectrum Pioneer",
            "date": "1942",
            "description": "Groundbreaking transmission design utilizing synchronized frequency hopping across 88 frequencies that laid the groundwork for Wi-Fi and CDMA."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "aurora",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#2457eb"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "classic": {
  "id": "classic",
  "templateId": "classic",
  "templateName": "Classic Print",
  "templateDesc": "Black-and-white borders reminiscent of traditional print CVs",
  "personName": "Alexander Graham Bell",
  "personRole": "Acoustic Physicist & Telephony Pioneer",
  "accentColor": "#18181b",
  "cv": {
    "id": "sample-classic",
    "version": "1.0.0",
    "contact": {
      "name": "Alexander Graham Bell",
      "email": "ag.bell@example.com",
      "phone": "+1 (555) 617-1847",
      "location": "Boston, MA",
      "website": "bell-acoustics.org"
    },
    "summary": "Acoustical engineer, inventor, and speech physiologist who patented the first electromagnetic telephone, pioneering global long-distance audio networks, sound recording, and hydrofoil craft.",
    "sections": [
      {
        "id": "sec-clas-1",
        "type": "experience",
        "title": "Acoustical & Telecommunication Engineering",
        "items": [
          {
            "id": "item-clas-1-1",
            "title": "Founder & Chief Technical Adviser",
            "subtitle": "Bell Telephone Company",
            "date": "1877 — 1898",
            "description": "Pioneered electromagnetic speech transmission and national telephone networks.",
            "bullets": [
              "Patented the electromagnetic acoustic telephone transmitter (US Patent 174,465), transmitting human speech across telegraph wires",
              "Established first commercial central telephone exchange, scaling the subscriber network from 2 to 200,000 within a decade",
              "Demonstrated long-distance voice transmission between Boston and New York, proving the viability of transcontinental telephony"
            ]
          },
          {
            "id": "item-clas-1-2",
            "title": "Research Director",
            "subtitle": "Volta Laboratory Association",
            "date": "1880 — 1890",
            "description": "Directed sound recording, photo-telephony, and biomedical instrumentation investigations.",
            "bullets": [
              "Developed wax-cylinder Graphophone phonograph records, vastly improving recording fidelity and commercial playback durability",
              "Built early electromagnetic metal detector utilized during presidential surgical trauma treatment"
            ]
          },
          {
            "id": "item-clas-1-3",
            "title": "Professor of Vocal Physiology & Elocution",
            "subtitle": "Boston University School of Oratory",
            "date": "1873 — 1877",
            "description": "Conducted phonetic speech research and resonance experiments.",
            "bullets": [
              "Instructed deaf students in physiological sound generation and conducted harmonic telegraph resonance experiments"
            ]
          }
        ]
      },
      {
        "id": "sec-clas-2",
        "type": "education",
        "title": "Anatomical & Physiological Studies",
        "items": [
          {
            "id": "item-clas-2-1",
            "title": "Studies in Anatomy & Vocal Physiology",
            "subtitle": "University College London",
            "date": "1868 — 1870",
            "description": "Advanced coursework in vocal acoustics, auditory anatomy, and German speech mechanics."
          }
        ]
      },
      {
        "id": "sec-clas-3",
        "type": "skills",
        "title": "Engineering Disciplines",
        "items": [
          {
            "id": "item-clas-3-1",
            "title": "Acoustic Sciences",
            "description": "Acoustical Physics, Electromagnetic Transduction, Telephonic Switching, Harmonic Resonance, Audio Signal Recording"
          }
        ]
      },
      {
        "id": "sec-clas-4",
        "type": "projects",
        "title": "Foundational Patents",
        "items": [
          {
            "id": "item-clas-4-1",
            "title": "US Patent 174,465: Improvement in Telegraphy",
            "subtitle": "Telephone Patent Landmark",
            "date": "1876",
            "description": "Historic patent describing the transmission of vocal sounds telegraphically by generating electrical undulations corresponding to sound vibrations."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "classic",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#18181b"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "matrix": {
  "id": "matrix",
  "templateId": "matrix",
  "templateName": "Matrix Terminal",
  "templateDesc": "Dark terminal aesthetic with monospace metadata lines",
  "personName": "Linus Torvalds",
  "personRole": "Principal Linux Kernel Architect & Git Creator",
  "accentColor": "#16a34a",
  "cv": {
    "id": "sample-matrix",
    "version": "1.0.0",
    "contact": {
      "name": "Linus Torvalds",
      "email": "linus.torvalds@example.com",
      "phone": "+1 (555) 503-1969",
      "location": "Portland, OR",
      "website": "kernel.org"
    },
    "summary": "Software engineer who created the Linux operating system kernel and Git distributed version control, powering 90%+ of global cloud servers, supercomputers, Android devices, and modern engineering workflows.",
    "sections": [
      {
        "id": "sec-mat-1",
        "type": "experience",
        "title": "Kernel & Systems Architecture",
        "items": [
          {
            "id": "item-mat-1-1",
            "title": "Fellow & Chief Kernel Maintainer",
            "subtitle": "The Linux Foundation",
            "date": "2003 — Present",
            "description": "Oversees release cycles, core architecture, and subsystem maintainers for the Linux operating system kernel.",
            "bullets": [
              "Directs release cycle and architectural merges for the Linux kernel spanning 35M+ lines of code and 20,000+ contributors",
              "Enforces rigorous zero-regression user-space ABI stability across all releases and hardware platforms",
              "Architected lockless RCU concurrency primitives and Completely Fair Scheduler (CFS) scaling to thousands of CPU cores"
            ]
          },
          {
            "id": "item-mat-1-2",
            "title": "Creator & Lead Developer",
            "subtitle": "Git Version Control System",
            "date": "2005 — 2006",
            "description": "Designed distributed version control system based on cryptographic content-addressable DAG objects.",
            "bullets": [
              "Architected distributed content-addressable directed acyclic graph (DAG) version control system in two weeks",
              "Designed cryptographic SHA-1 object immutability providing 100x speedups for branch merging and diff operations over CVS/SVN"
            ]
          },
          {
            "id": "item-mat-1-3",
            "title": "Member of Technical Staff",
            "subtitle": "Transmeta Corporation",
            "date": "1997 — 2003",
            "description": "Developed binary code-morphing software for x86-compatible microprocessors.",
            "bullets": [
              "Engineered Crusoe x86 code morphing software layer converting x86 instructions into ultra-low-power VLIW native primitives"
            ]
          },
          {
            "id": "item-mat-1-4",
            "title": "Original Kernel Author",
            "subtitle": "University of Helsinki",
            "date": "1991 — 1996",
            "description": "Wrote original Unix-like kernel targeting Intel 386 hardware; released under GNU GPL.",
            "bullets": [
              "Authored original monolithic Unix-like kernel targeting Intel 386 architecture, releasing source code under the GNU GPL v2"
            ]
          }
        ]
      },
      {
        "id": "sec-mat-2",
        "type": "education",
        "title": "Computer Science Education",
        "items": [
          {
            "id": "item-mat-2-1",
            "title": "Master of Science in Computer Science",
            "subtitle": "University of Helsinki",
            "date": "1996",
            "description": "NODES research group; Master's thesis: 'Linux: A Portable Operating System'."
          }
        ]
      },
      {
        "id": "sec-mat-3",
        "type": "skills",
        "title": "Low-Level Systems Skills",
        "items": [
          {
            "id": "item-mat-3-1",
            "title": "Kernel & Infrastructure",
            "description": "C Systems Programming, Monolithic Kernel Architecture, Memory Management Subsystems, Lockless RCU Concurrency, Distributed VCS"
          }
        ]
      },
      {
        "id": "sec-mat-4",
        "type": "projects",
        "title": "Open Source Foundations",
        "items": [
          {
            "id": "item-mat-4-1",
            "title": "The Linux Kernel Project",
            "subtitle": "Global Cloud & Device Foundation",
            "date": "1991 — Present",
            "description": "Ubiquitous operating system kernel powering top 500 supercomputers, public cloud hypervisors, internet networking, and billions of mobile devices."
          },
          {
            "id": "item-mat-4-2",
            "title": "Git Distributed Version Control",
            "subtitle": "Universal Developer Standard",
            "date": "2005",
            "description": "Cryptographic directed acyclic graph repository architecture adopted by software engineering teams worldwide."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "matrix",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#16a34a"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "global": {
  "id": "global",
  "templateId": "global",
  "templateName": "Global Mobility",
  "templateDesc": "International contact strip emphasizing location and languages",
  "personName": "Sundar Pichai",
  "personRole": "Chief Executive Officer & Global Platform Executive",
  "accentColor": "#2563eb",
  "cv": {
    "id": "sample-global",
    "version": "1.0.0",
    "contact": {
      "name": "Sundar Pichai",
      "email": "sundar.pichai@example.com",
      "phone": "+1 (555) 650-1972",
      "location": "Mountain View, CA",
      "website": "alphabet-leadership.com"
    },
    "summary": "Global platform executive who led the creation of Google Chrome, international Android ecosystem expansion, and Alphabet's global AI-first cloud infrastructure serving billions of worldwide users.",
    "sections": [
      {
        "id": "sec-glob-1",
        "type": "experience",
        "title": "Global Technology Leadership",
        "items": [
          {
            "id": "item-glob-1-1",
            "title": "Chief Executive Officer",
            "subtitle": "Alphabet Inc. & Google LLC",
            "date": "2015 — Present",
            "description": "Directs global enterprise spanning search, YouTube, Android, cloud infrastructure, and frontier AI systems.",
            "bullets": [
              "Directs global technology enterprise spanning search, YouTube, Android, Google Cloud, and Gemini AI platforms",
              "Scaled annual revenues past $300B while overseeing investments in custom Tensor Processing Units (TPUs) and subsea fiber cables",
              "Expanded Android smartphone platform to over 3 billion active devices worldwide across 190 countries"
            ]
          },
          {
            "id": "item-glob-1-2",
            "title": "Senior Vice President of Products",
            "subtitle": "Google Inc.",
            "date": "2011 — 2015",
            "description": "Led core consumer products including Chrome, Google Drive, Gmail, Maps, and Android.",
            "bullets": [
              "Oversaw product development across Chrome, Google Drive, Google Maps, Gmail, and the Android operating system",
              "Steered Chrome browser to become the dominant global web client with over 65% market share through sandboxed security"
            ]
          },
          {
            "id": "item-glob-1-3",
            "title": "Vice President of Product Management",
            "subtitle": "Google Inc.",
            "date": "2004 — 2011",
            "description": "Launched Google Toolbar, Chrome browser, and Chrome OS.",
            "bullets": [
              "Launched Google Toolbar and championed building the Chrome browser, protecting direct user access to web search"
            ]
          },
          {
            "id": "item-glob-1-4",
            "title": "Management Consultant",
            "subtitle": "McKinsey & Company",
            "date": "2002 — 2004",
            "description": "Strategic advisory for semiconductor and electronics manufacturing clients.",
            "bullets": [
              "Advised international semiconductor and engineering enterprises on global supply chain logistics and market entry"
            ]
          }
        ]
      },
      {
        "id": "sec-glob-2",
        "type": "education",
        "title": "Education",
        "items": [
          {
            "id": "item-glob-2-1",
            "title": "MBA in Business Administration",
            "subtitle": "The Wharton School, University of Pennsylvania",
            "date": "2002",
            "description": "Palmer Scholar; concentration in Strategic Management."
          },
          {
            "id": "item-glob-2-2",
            "title": "M.S. in Materials Science and Engineering",
            "subtitle": "Stanford University",
            "date": "1995",
            "description": "Semiconductor thin film physics and materials chemistry."
          },
          {
            "id": "item-glob-2-3",
            "title": "B.Tech in Metallurgical Engineering",
            "subtitle": "Indian Institute of Technology (IIT) Kharagpur",
            "date": "1993",
            "description": "Institute Silver Medal; materials science and metallurgical testing."
          }
        ]
      },
      {
        "id": "sec-glob-3",
        "type": "skills",
        "title": "Executive Competencies",
        "items": [
          {
            "id": "item-glob-3-1",
            "title": "Platform Strategy",
            "description": "Global Platform Strategy, Multi-Region Cloud Operations, Enterprise Product Governance, International Ecosystem Alliances, Frontier AI Infrastructure"
          }
        ]
      },
      {
        "id": "sec-glob-4",
        "type": "projects",
        "title": "Global Platforms",
        "items": [
          {
            "id": "item-glob-4-1",
            "title": "Google Chrome Multi-Process Architecture",
            "subtitle": "Global Web Client",
            "date": "2008",
            "description": "Multi-process browser design isolating web pages into secure sandboxes, setting the modern benchmark for web client security and speed."
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "global",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#2563eb"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

  "portfolio": {
  "id": "portfolio",
  "templateId": "portfolio",
  "templateName": "Portfolio First",
  "templateDesc": "Projects and highlights surfaced before employment history",
  "personName": "Zaha Hadid",
  "personRole": "Principal Architect & Parametric Design Pioneer",
  "accentColor": "#0f172a",
  "cv": {
    "id": "sample-portfolio",
    "version": "1.0.0",
    "contact": {
      "name": "Zaha Hadid",
      "email": "zaha.hadid@example.com",
      "phone": "+1 (555) 207-1950",
      "location": "London, UK",
      "website": "zaha-hadid.com"
    },
    "summary": "Pritzker Architecture Prize laureate celebrated for groundbreaking fluid geometry, algorithmic parametric design, and monumental civic cultural architecture across four continents.",
    "sections": [
      {
        "id": "sec-port-1",
        "type": "projects",
        "title": "Architectural Masterworks & Highlights",
        "items": [
          {
            "id": "item-port-1-1",
            "title": "Heydar Aliyev Centre",
            "subtitle": "Baku, Azerbaijan · Cultural Center",
            "date": "2012",
            "description": "Masterpiece of continuous fluid geometry bridging plaza and roof without a single interior structural column, utilizing glass-fiber reinforced concrete panels."
          },
          {
            "id": "item-port-1-2",
            "title": "London 2012 Olympic Aquatics Centre",
            "subtitle": "London, UK · Olympic Venue",
            "date": "2011",
            "description": "S-shaped undulating timber-and-steel parabolic wave roof spanning 160 meters with three structural ground support points."
          },
          {
            "id": "item-port-1-3",
            "title": "Guangzhou Opera House",
            "subtitle": "Guangzhou, CN · Performing Arts Hall",
            "date": "2010",
            "description": "Twin granite-and-glass pebble structures overlooking the Pearl River, designed with acoustic shell computer simulation."
          }
        ]
      },
      {
        "id": "sec-port-2",
        "type": "experience",
        "title": "Architectural Practice & Directorship",
        "items": [
          {
            "id": "item-port-2-1",
            "title": "Founder & Principal Architect",
            "subtitle": "Zaha Hadid Architects (ZHA)",
            "date": "1980 — 2016",
            "description": "Led international design practice delivering 950+ buildings in 44 nations.",
            "bullets": [
              "Led an international design practice of 400 architects delivering 950+ visionary cultural and civic buildings in 44 nations",
              "Pioneered computational parametric design in structural engineering, using CATIA modeling to erect gravity-defying curved shells",
              "Designed the London Aquatics Centre for the 2012 Olympic Games, Heydar Aliyev Centre in Baku, and Guangzhou Opera House"
            ]
          },
          {
            "id": "item-port-2-2",
            "title": "Professor of Architecture & Studio Master",
            "subtitle": "University of Applied Arts Vienna",
            "date": "2000 — 2015",
            "description": "Directed Studio Hadid architectural research.",
            "bullets": [
              "Directed Studio Hadid researching digital tectonics, robotic composite fabrication, and dynamic urban density topologies"
            ]
          },
          {
            "id": "item-port-2-3",
            "title": "Partner & Collaborator",
            "subtitle": "Office for Metropolitan Architecture (OMA)",
            "date": "1977 — 1980",
            "description": "Collaborated with Rem Koolhaas on experimental urban typologies.",
            "bullets": [
              "Collaborated with Rem Koolhaas and Elia Zenghelis on Dutch parliament expansion and urban masterplan competitions"
            ]
          }
        ]
      },
      {
        "id": "sec-port-3",
        "type": "education",
        "title": "Architectural Training",
        "items": [
          {
            "id": "item-port-3-1",
            "title": "Diploma in Architecture",
            "subtitle": "Architectural Association School of Architecture (London)",
            "date": "1977",
            "description": "Awarded the AA Diploma Prize; studied under Rem Koolhaas and Elia Zenghelis."
          }
        ]
      },
      {
        "id": "sec-port-4",
        "type": "skills",
        "title": "Architectural Disciplines",
        "items": [
          {
            "id": "item-port-4-1",
            "title": "Parametric Design",
            "description": "Parametric Computational Modeling, Structural Concrete Mechanics, Spatial Geometry, Dynamic Urban Masterplanning, CATIA Modeling"
          }
        ]
      }
    ],
    "stylePrefs": {
      "templateId": "portfolio",
      "fontSize": "normal",
      "margin": "normal",
      "paperSize": "A4",
      "primaryColor": "#0f172a"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
},

};

export function getSampleCv(templateId: string): FictionalSample {
  return FICTIONAL_SAMPLES[templateId] || FICTIONAL_SAMPLES.modern;
}

export const PERSONA_SAMPLES = FICTIONAL_SAMPLES;
