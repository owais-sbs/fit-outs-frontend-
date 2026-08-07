import { downloadBoqPdf } from "../../pages/boq/boqPdfExport";

export async function downloadCoverLetterPdf(
  elementId = "site-visit-cover-letter",
  filename = "JCT-Cover-Letter.pdf"
) {
  return downloadBoqPdf(elementId, filename);
}
