/**
 * Milestone payment percentages and headings sourced from the VetroBuild ERP
 * functional specification (Modules 43, 20, and 13+).
 *
 * Client payment splits align with Part B5 programme gates (Template A — 90-day
 * villa renovation). Retention percentages are taken verbatim from Part C8.
 */

/** Part B5 — client billing milestones linked to schedule programme gates */
export const CLIENT_PAYMENT_SCHEDULE_PRESETS = [
  {
    id: "template-a-90",
    label: "Turnkey villa renovation — 90 day (Part B5, Template A)",
    specRef: "Module 43 · Part B5",
    milestones: [
      {
        heading: "Contract & mobilisation",
        name: "Mobilisation — contract award & kick-off",
        paymentPercent: 10,
        percentCompleteRequired: null,
        activityKeywords: ["contract award", "kick-off", "r010"],
        specActivity: "R010",
      },
      {
        heading: "Permits & site establishment",
        name: "Pre-construction — community NOC & mobilisation",
        paymentPercent: 15,
        percentCompleteRequired: 15,
        activityKeywords: ["community noc", "site mobilisation", "r060", "r070"],
        specActivity: "R060–R080",
      },
      {
        heading: "Wet works & tiling",
        name: "Structure & wet works — tiling complete",
        paymentPercent: 25,
        percentCompleteRequired: 50,
        activityKeywords: ["tiling", "wet areas", "r410"],
        specActivity: "R300–R410",
      },
      {
        heading: "Envelope & ceilings",
        name: "Envelope watertight — aluminium & gypsum",
        paymentPercent: 15,
        percentCompleteRequired: 70,
        activityKeywords: ["aluminium", "glazing", "gypsum", "r440", "r450"],
        specActivity: "R430–R450",
      },
      {
        heading: "Fit-out & finishes",
        name: "Fit-out installation — joinery & second fix",
        paymentPercent: 20,
        percentCompleteRequired: 90,
        activityKeywords: ["joinery", "second fix", "r490", "r540"],
        specActivity: "R490–R540",
      },
      {
        heading: "Handover & DLP start",
        name: "Practical completion — handover",
        paymentPercent: 10,
        percentCompleteRequired: 100,
        activityKeywords: ["handover", "dlp", "r600"],
        specActivity: "R600",
      },
      {
        heading: "Retention release (Part C8: 5–10%)",
        name: "Retention release — defect liability period",
        paymentPercent: 5,
        percentCompleteRequired: 100,
        activityKeywords: [],
        specActivity: "Part C8 typical retention",
        isRetention: true,
      },
    ],
  },
  {
    id: "template-a2-60",
    label: "Turnkey villa renovation — 60 day fast track (Part B6, Template A2)",
    specRef: "Module 43 · Part B6",
    note: "Part B4: 60-day programmes carry a 12–18% cost premium over the 90-day baseline.",
    milestones: [
      {
        heading: "Contract & fast-track mobilisation",
        name: "Mobilisation — contract & specification pack",
        paymentPercent: 15,
        percentCompleteRequired: null,
        activityKeywords: ["contract", "specification", "f010"],
        specActivity: "F010",
      },
      {
        heading: "Permits & zone mobilisation",
        name: "Fast-track permits & site mobilisation",
        paymentPercent: 15,
        percentCompleteRequired: 15,
        activityKeywords: ["permit", "mobilisation", "f020", "f100"],
        specActivity: "F020–F100",
      },
      {
        heading: "Zone A wet works",
        name: "Demolition & MEP first fix — Zone A",
        paymentPercent: 20,
        percentCompleteRequired: 40,
        activityKeywords: ["zone a", "demolition", "f110", "f130"],
        specActivity: "F110–F130",
      },
      {
        heading: "Envelope & joinery",
        name: "Aluminium installation & joinery delivery",
        paymentPercent: 25,
        percentCompleteRequired: 70,
        activityKeywords: ["aluminium", "joinery", "f220", "f270"],
        specActivity: "F220–F270",
      },
      {
        heading: "Testing & handover",
        name: "Commissioning, snagging & handover",
        paymentPercent: 15,
        percentCompleteRequired: 100,
        activityKeywords: ["testing", "handover", "f330", "f370"],
        specActivity: "F330–F370",
      },
      {
        heading: "Retention release (Part C8: 5–10%)",
        name: "Retention release — defect liability period",
        paymentPercent: 10,
        percentCompleteRequired: 100,
        activityKeywords: [],
        specActivity: "Part C8 typical retention (upper range for fast track)",
        isRetention: true,
      },
    ],
  },
];

/** Part C8 — subcontractor retention percentages by trade package */
export const SUBCONTRACTOR_RETENTION_BY_HEADING = [
  {
    heading: "5% retention",
    percent: "5%",
    packages: [
      { code: "PKG-DEM", name: "Demolition and waste removal" },
      { code: "PKG-SCF", name: "Scaffolding and access" },
    ],
    paymentTerms: "30 days",
  },
  {
    heading: "5–10% retention",
    percent: "5–10%",
    packages: [
      { code: "PKG-CIV", name: "Civil, blockwork and plaster" },
      { code: "PKG-TIL", name: "Tiling and stone" },
      { code: "PKG-MAR", name: "Marble, quartz and solid surface" },
      { code: "PKG-GYP", name: "Gypsum and false ceiling" },
      { code: "PKG-PNT", name: "Painting and decorative finishes" },
      { code: "PKG-DOR", name: "Doors and ironmongery" },
      { code: "PKG-SPC", name: "Specialist finishes" },
    ],
    paymentTerms: "45 days",
  },
  {
    heading: "10% retention",
    percent: "10%",
    packages: [
      { code: "PKG-WPF", name: "Waterproofing" },
      { code: "PKG-JOI", name: "Joinery and carpentry" },
      { code: "PKG-ALU", name: "Aluminium, glazing and steel" },
      { code: "PKG-ELE", name: "Electrical and low current" },
      { code: "PKG-PLB", name: "Plumbing and drainage" },
      { code: "PKG-HVA", name: "HVAC" },
      { code: "PKG-FIR", name: "Fire alarm and fire fighting" },
      { code: "PKG-SEC", name: "CCTV, access control and security" },
      { code: "PKG-SMT", name: "Smart home and AV" },
      { code: "PKG-POO", name: "Swimming pool" },
      { code: "PKG-LAN", name: "Landscape and irrigation" },
    ],
    paymentTerms: "45 days",
  },
  {
    heading: "0–5% retention",
    percent: "0–5%",
    packages: [{ code: "PKG-CLN", name: "Cleaning" }],
    paymentTerms: "30 days",
  },
];

/** Part C9 — performance scorecard weightings (subcontractor rating, not client billing) */
export const PERFORMANCE_SCORECARD_WEIGHTS = [
  { heading: "Quality", percent: 25 },
  { heading: "Programme", percent: 25 },
  { heading: "Safety", percent: 20 },
  { heading: "Commercial", percent: 15 },
  { heading: "Responsiveness", percent: 15 },
];

/** Part B4 — 60-day programme commercial note */
export const FAST_TRACK_ACCELERATION_PREMIUM = {
  heading: "60-day programme acceleration premium (Part B4)",
  percentRange: "12–18%",
  note: "Additional manpower, expedited procurement, premium freight, and out-of-hours rates.",
};

export function findScheduleActivity(activities, keywords = []) {
  if (!keywords.length) return null;
  const needles = keywords.map((k) => k.toLowerCase());
  return (
    activities.find((a) => {
      const name = (a.name || "").toLowerCase();
      return needles.some((n) => name.includes(n));
    }) || null
  );
}

export function buildMilestonesFromPreset(preset, budget, activities = []) {
  const contractValue = Number(budget) || 0;
  return preset.milestones.map((item) => {
    const linked = findScheduleActivity(activities, item.activityKeywords);
    const amount =
      contractValue > 0
        ? Math.round((contractValue * item.paymentPercent) / 100)
        : 0;
    return {
      name: item.name,
      amount,
      paymentPercent: item.paymentPercent,
      heading: item.heading,
      percentCompleteRequired: item.percentCompleteRequired,
      linkedActivityUuid: linked?.uuid || null,
      specActivity: item.specActivity,
    };
  });
}

export function totalPaymentPercent(preset) {
  return preset.milestones.reduce((sum, m) => sum + m.paymentPercent, 0);
}
