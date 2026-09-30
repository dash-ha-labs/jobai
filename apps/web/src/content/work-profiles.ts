import type { CVSection } from "jobai-shared";

export interface WorkProfile {
  id: string;
  label: string;
  role: string;
  name: string;
  initials: string;
  template: string;
  templateName: string;
  focus: string;
  help: string;
  skills: string[];
  before: string;
  after: string;
  context: string;
  section: string;
  starterSections: { type: CVSection["type"]; title: string }[];
}

export const WORK_PROFILES: WorkProfile[] = [
  {
    id: "first-job", label: "First job", role: "Entry-level applicant", name: "Jamie Wilson", initials: "JW", template: "modern", templateName: "Modern Clean",
    focus: "Your first CV. More to say than you think.",
    help: "Coursework, volunteering, weekend work and personal projects all count. Start with what you’ve learned and contributed.",
    skills: ["Teamwork", "Organisation", "Customer service"],
    before: "Helped at a community event. Set up tables and welcomed visitors.",
    after: "Supported a community event by setting up the venue and welcoming visitors.",
    context: "Community event · Volunteer", section: "VOLUNTEERING & PROJECTS",
    starterSections: [{ type: "education", title: "Education" }, { type: "projects", title: "Projects & Volunteering" }, { type: "experience", title: "Work Experience" }, { type: "skills", title: "Skills" }],
  },
  {
    id: "professional", label: "Business", role: "Operations coordinator", name: "Alex Morgan", initials: "AM", template: "executive", templateName: "Executive",
    focus: "Make your contribution easy to see.",
    help: "Show the projects you supported, the problems you solved and the responsibilities you held. Add results where you can verify them.",
    skills: ["Coordination", "Reporting", "Stakeholder support"],
    before: "Organised weekly team meetings and kept track of project actions.",
    after: "Coordinated weekly team meetings and tracked project actions to keep responsibilities visible.",
    context: "Operations team · Coordinator", section: "WORK EXPERIENCE",
    starterSections: [{ type: "experience", title: "Work Experience" }, { type: "skills", title: "Core Skills" }, { type: "education", title: "Education" }],
  },
  {
    id: "creative", label: "Creative", role: "Graphic designer", name: "Robin Chen", initials: "RC", template: "portfolio", templateName: "Portfolio",
    focus: "Give your work the context it deserves.",
    help: "Pair your portfolio with the brief, your role and the decisions behind the work. Make your contribution clear, even on team projects.",
    skills: ["Visual identity", "Layout", "Figma"],
    before: "Designed posters and social posts for a community arts festival.",
    after: "Created print posters and social graphics for a community arts festival.",
    context: "Community arts festival · Design project", section: "SELECTED PROJECTS",
    starterSections: [{ type: "projects", title: "Selected Projects" }, { type: "experience", title: "Work Experience" }, { type: "skills", title: "Tools & Skills" }, { type: "education", title: "Education" }],
  },
  {
    id: "developer", label: "Tech", role: "Software developer", name: "Sam Rivera", initials: "SR", template: "tech", templateName: "Technical",
    focus: "Show what you built. Explain why it mattered.",
    help: "Connect your tools to real projects and responsibilities. Include personal or open-source work and explain your part in the solution.",
    skills: ["TypeScript", "React", "Testing"],
    before: "Built a booking form in React and wrote tests for the validation.",
    after: "Built a React booking form with automated tests for input validation.",
    context: "Booking application · Development project", section: "PROJECTS & EXPERIENCE",
    starterSections: [{ type: "skills", title: "Technical Skills" }, { type: "experience", title: "Work Experience" }, { type: "projects", title: "Projects" }, { type: "education", title: "Education" }],
  },
  {
    id: "logistics", label: "Logistics", role: "Warehouse operative", name: "Jordan Ellis", initials: "JE", template: "compact", templateName: "Compact",
    focus: "Practical experience. Clearly presented.",
    help: "Show the work you do: stock handling, equipment, shift responsibilities and safety procedures. List licences only if you hold them.",
    skills: ["Stock handling", "Order picking", "Safety procedures"],
    before: "Picked orders, checked them against packing lists and prepared them for dispatch.",
    after: "Picked and checked orders against packing lists before preparing them for dispatch.",
    context: "Distribution centre · Warehouse operative", section: "WORK EXPERIENCE",
    starterSections: [{ type: "experience", title: "Work Experience" }, { type: "skills", title: "Practical Skills" }, { type: "custom", title: "Licences & Training" }, { type: "education", title: "Education" }],
  },
  {
    id: "service", label: "Retail & service", role: "Customer service assistant", name: "Taylor Ahmed", initials: "TA", template: "modern", templateName: "Modern Clean",
    focus: "People skills are real skills.",
    help: "Describe how you help customers, work with a team and handle busy periods. Include paid, part-time and voluntary experience.",
    skills: ["Customer support", "Teamwork", "Stock replenishment"],
    before: "Helped customers find products and restocked shelves during busy shifts.",
    after: "Assisted customers with product queries and replenished stock during busy shifts.",
    context: "Retail team · Customer service assistant", section: "WORK EXPERIENCE",
    starterSections: [{ type: "experience", title: "Work Experience" }, { type: "skills", title: "Customer & Team Skills" }, { type: "education", title: "Education & Training" }],
  },
];
export function getWorkProfile(id?: string) { return WORK_PROFILES.find(profile => profile.id === id); }
