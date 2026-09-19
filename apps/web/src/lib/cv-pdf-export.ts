/**
 * Client-side PDF export from the live #cv-paper DOM (WYSIWYG with all template layouts).
 */
export async function exportCvPaperToPdf(
  element: HTMLElement,
  filename: string,
  paperSize: "A4" | "Letter" = "A4"
): Promise<void> {
  const format = paperSize === "Letter" ? "letter" : "a4";
  const html2pdf = (await import("html2pdf.js")).default;

  await html2pdf()
    .set({
      margin: [0, 0, 0, 0],
      filename,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      },
      jsPDF: { unit: "mm", format, orientation: "portrait" },
    })
    .from(element)
    .save();
}
