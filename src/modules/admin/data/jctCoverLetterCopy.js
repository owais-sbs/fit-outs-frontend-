/** Static copy from JCT Cover Letter sheet (Docs/JCT (1).xlsx) */

export const JCT_COVER_LETTER = {
  companyName: "JCT Contracting",
  signatoryName: "Grigoris Georgiou",
  signatoryTitle: "Projects Director",
  defaultCityCountry: "Dubai, United Arab Emirates",
  body: [
    "We are pleased to submit our quotation for the above project for your review and kind approval.",
    "The above mentioned prices are exclusive of Value Added Tax.",
    "Please refer to the attached rough estimate / BoQ summary for a breakdown of the above mentioned cost.",
    "We are at your disposal for any further information or clarification you might require during the review and evaluation of our quotation.",
    "Again, we would like to thank you for this opportunity and we hope that our quotation meet your requirements.",
    "Looking forward to hear back from you.",
  ],
  closing: "Respectfully,",
  footerThanks: "Thank you for your business!",
};

export function buildDefaultSubject(locationLabel) {
  const location = (locationLabel || "").trim();
  if (location) {
    return `TURNKEY RENOVATION FOR VILLA AT ${location.toUpperCase()}, DUBAI, UAE`;
  }
  return "TURNKEY RENOVATION, DUBAI, UAE";
}

export function formatEstimateAmount(amount, currency = "AED") {
  const n = Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  return `${currency} ${safe.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatEstimateDate(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}
