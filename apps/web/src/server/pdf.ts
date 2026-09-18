import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { type CV, type CVSectionItem } from "jobai-shared";

type RGBColor = ReturnType<typeof rgb>;

function parseHexColor(hex?: string): RGBColor {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return rgb(79 / 255, 70 / 255, 229 / 255); // Default indigo
  }
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

// Standard paper dimensions in points (72 points / inch)
// A4: 210mm x 297mm (595.28 x 841.89 pt)
// Letter: 8.5in x 11in (612 x 792 pt)
const PAPER_DIMENSIONS = {
  A4: { width: 595.28, height: 841.89 },
  Letter: { width: 612, height: 792 },
} as const;

interface DrawCursor {
  page: PDFPage;
  y: number;
  margin: number;
  maxWidth: number;
  pageWidth: number;
  pageHeight: number;
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.replace(/\r\n/g, "\n").split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!word) continue;
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function ensureSpace(
  cursor: DrawCursor,
  requiredHeight: number,
  pdfDoc: PDFDocument
): void {
  if (cursor.y - requiredHeight < cursor.margin) {
    cursor.page = pdfDoc.addPage([cursor.pageWidth, cursor.pageHeight]);
    cursor.y = cursor.pageHeight - cursor.margin;
  }
}

/**
 * Generates an authentic text-selectable PDF document for a CV
 * adhering to the selected template style.
 */
export async function generateCVPdf(cv: CV, templateIdOverride?: string): Promise<Uint8Array> {
  const templateId = templateIdOverride || cv.stylePrefs?.templateId || "modern";
  const paperSize = cv.stylePrefs?.paperSize === "Letter" ? "Letter" : "A4";
  const { width: pageWidth, height: pageHeight } = PAPER_DIMENSIONS[paperSize];
  const primaryColor = parseHexColor(cv.stylePrefs?.primaryColor);
  const darkGray = rgb(0.12, 0.14, 0.18);
  const mutedGray = rgb(0.38, 0.42, 0.48);
  const lightLine = rgb(0.85, 0.88, 0.92);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`${cv.contact.name || "CV"} - JobAI Tailored CV`);
  pdfDoc.setAuthor(cv.contact.name || "JobAI");
  pdfDoc.setCreator("JobAI Server PDF Engine");

  // Load standard fonts based on template
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const times = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);
  const courierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

  const margin = templateId === "compact" ? 36 : 46;
  const maxWidth = pageWidth - margin * 2;

  const initialPage = pdfDoc.addPage([pageWidth, pageHeight]);
  const cursor: DrawCursor = {
    page: initialPage,
    y: pageHeight - margin,
    margin,
    maxWidth,
    pageWidth,
    pageHeight,
  };

  if (templateId === "executive") {
    renderExecutiveTemplate(pdfDoc, cursor, cv, primaryColor, {
      font: times,
      bold: timesBold,
      italic: timesItalic,
      darkGray,
      mutedGray,
      lightLine,
    });
  } else if (templateId === "tech") {
    renderTechTemplate(pdfDoc, cursor, cv, primaryColor, {
      font: courier,
      bold: courierBold,
      sansFont: helvetica,
      darkGray,
      mutedGray,
      lightLine,
    });
  } else if (templateId === "compact") {
    renderCompactTemplate(pdfDoc, cursor, cv, primaryColor, {
      font: helvetica,
      bold: helveticaBold,
      darkGray,
      mutedGray,
      lightLine,
    });
  } else {
    // Default: modern
    renderModernTemplate(pdfDoc, cursor, cv, primaryColor, {
      font: helvetica,
      bold: helveticaBold,
      darkGray,
      mutedGray,
      lightLine,
    });
  }

  return pdfDoc.save();
}

// 1. MODERN TEMPLATE
function renderModernTemplate(
  pdfDoc: PDFDocument,
  cursor: DrawCursor,
  cv: CV,
  primaryColor: RGBColor,
  f: { font: PDFFont; bold: PDFFont; darkGray: RGBColor; mutedGray: RGBColor; lightLine: RGBColor }
) {
  // Header: Name
  const name = cv.contact.name || "Your Name";
  cursor.page.drawText(name, {
    x: cursor.margin,
    y: cursor.y - 22,
    size: 24,
    font: f.bold,
    color: f.darkGray,
  });
  cursor.y -= 30;

  // Contact line
  const contacts: string[] = [];
  if (cv.contact.email) contacts.push(cv.contact.email);
  if (cv.contact.phone) contacts.push(cv.contact.phone);
  if (cv.contact.location) contacts.push(cv.contact.location);
  if (cv.contact.website) contacts.push(cv.contact.website);

  if (contacts.length > 0) {
    const contactText = contacts.join("   |   ");
    cursor.page.drawText(contactText, {
      x: cursor.margin,
      y: cursor.y - 10,
      size: 9.5,
      font: f.font,
      color: f.mutedGray,
    });
    cursor.y -= 18;
  }

  // Accent divider line
  cursor.page.drawLine({
    start: { x: cursor.margin, y: cursor.y },
    end: { x: cursor.margin + cursor.maxWidth, y: cursor.y },
    thickness: 2,
    color: primaryColor,
  });
  cursor.y -= 16;

  // Summary
  if (cv.summary?.trim()) {
    renderSectionTitle(cursor, "PROFESSIONAL SUMMARY", f.bold, primaryColor, 10);
    const lines = wrapText(cv.summary.trim(), f.font, 9.5, cursor.maxWidth);
    for (const line of lines) {
      ensureSpace(cursor, 14, pdfDoc);
      cursor.page.drawText(line, {
        x: cursor.margin,
        y: cursor.y - 10,
        size: 9.5,
        font: f.font,
        color: f.darkGray,
      });
      cursor.y -= 13;
    }
    cursor.y -= 8;
  }

  // Sections
  for (const section of cv.sections) {
    ensureSpace(cursor, 30, pdfDoc);
    renderSectionTitle(cursor, (section.title || section.type).toUpperCase(), f.bold, primaryColor, 10);

    for (const item of section.items) {
      renderItem(pdfDoc, cursor, item, f);
    }
    cursor.y -= 6;
  }
}

// 2. EXECUTIVE TEMPLATE
function renderExecutiveTemplate(
  pdfDoc: PDFDocument,
  cursor: DrawCursor,
  cv: CV,
  primaryColor: RGBColor,
  f: { font: PDFFont; bold: PDFFont; italic: PDFFont; darkGray: RGBColor; mutedGray: RGBColor; lightLine: RGBColor }
) {
  // Centered Header: Name
  const name = (cv.contact.name || "YOUR NAME").toUpperCase();
  const nameWidth = f.bold.widthOfTextAtSize(name, 22);
  const nameX = cursor.margin + (cursor.maxWidth - nameWidth) / 2;

  cursor.page.drawText(name, {
    x: nameX,
    y: cursor.y - 20,
    size: 22,
    font: f.bold,
    color: f.darkGray,
  });
  cursor.y -= 28;

  // Centered Contact line
  const contacts: string[] = [];
  if (cv.contact.email) contacts.push(cv.contact.email);
  if (cv.contact.phone) contacts.push(cv.contact.phone);
  if (cv.contact.location) contacts.push(cv.contact.location);
  if (cv.contact.website) contacts.push(cv.contact.website);

  if (contacts.length > 0) {
    const contactText = contacts.join("   *   ");
    const contactWidth = f.font.widthOfTextAtSize(contactText, 9.5);
    const contactX = cursor.margin + Math.max(0, (cursor.maxWidth - contactWidth) / 2);
    cursor.page.drawText(contactText, {
      x: contactX,
      y: cursor.y - 10,
      size: 9.5,
      font: f.font,
      color: f.mutedGray,
    });
    cursor.y -= 18;
  }

  // Divider
  cursor.page.drawLine({
    start: { x: cursor.margin + 40, y: cursor.y },
    end: { x: cursor.margin + cursor.maxWidth - 40, y: cursor.y },
    thickness: 1,
    color: primaryColor,
  });
  cursor.y -= 16;

  // Executive Summary (Centered Italic)
  if (cv.summary?.trim()) {
    renderSectionTitle(cursor, "EXECUTIVE SUMMARY", f.bold, f.darkGray, 10.5, true);
    const lines = wrapText(cv.summary.trim(), f.italic, 10, cursor.maxWidth - 40);
    for (const line of lines) {
      ensureSpace(cursor, 14, pdfDoc);
      const lineWidth = f.italic.widthOfTextAtSize(line, 10);
      const lineX = cursor.margin + Math.max(0, (cursor.maxWidth - lineWidth) / 2);
      cursor.page.drawText(line, {
        x: lineX,
        y: cursor.y - 10,
        size: 10,
        font: f.italic,
        color: f.darkGray,
      });
      cursor.y -= 14;
    }
    cursor.y -= 10;
  }

  // Sections
  for (const section of cv.sections) {
    ensureSpace(cursor, 30, pdfDoc);
    renderSectionTitle(cursor, (section.title || section.type).toUpperCase(), f.bold, f.darkGray, 10.5, true);

    for (const item of section.items) {
      renderItem(pdfDoc, cursor, item, { ...f, font: f.font, bold: f.bold });
    }
    cursor.y -= 8;
  }
}

// 3. TECH TEMPLATE
function renderTechTemplate(
  pdfDoc: PDFDocument,
  cursor: DrawCursor,
  cv: CV,
  primaryColor: RGBColor,
  f: { font: PDFFont; bold: PDFFont; sansFont: PDFFont; darkGray: RGBColor; mutedGray: RGBColor; lightLine: RGBColor }
) {
  // Terminal styled header
  const name = `> ${cv.contact.name || "DEVELOPER"}`;
  cursor.page.drawText(name, {
    x: cursor.margin,
    y: cursor.y - 20,
    size: 20,
    font: f.bold,
    color: primaryColor,
  });
  cursor.y -= 26;

  // Contact line
  const contacts: string[] = [];
  if (cv.contact.email) contacts.push(`email:${cv.contact.email}`);
  if (cv.contact.phone) contacts.push(`tel:${cv.contact.phone}`);
  if (cv.contact.location) contacts.push(`loc:${cv.contact.location}`);
  if (cv.contact.website) contacts.push(`web:${cv.contact.website}`);

  if (contacts.length > 0) {
    cursor.page.drawText(contacts.join("  |  "), {
      x: cursor.margin,
      y: cursor.y - 10,
      size: 9,
      font: f.font,
      color: f.mutedGray,
    });
    cursor.y -= 18;
  }

  // Thin line
  cursor.page.drawLine({
    start: { x: cursor.margin, y: cursor.y },
    end: { x: cursor.margin + cursor.maxWidth, y: cursor.y },
    thickness: 1,
    color: f.lightLine,
  });
  cursor.y -= 14;

  // Summary
  if (cv.summary?.trim()) {
    renderSectionTitle(cursor, `// OVERVIEW`, f.bold, primaryColor, 9.5);
    const lines = wrapText(cv.summary.trim(), f.font, 9, cursor.maxWidth);
    for (const line of lines) {
      ensureSpace(cursor, 13, pdfDoc);
      cursor.page.drawText(line, {
        x: cursor.margin,
        y: cursor.y - 9,
        size: 9,
        font: f.font,
        color: f.darkGray,
      });
      cursor.y -= 12;
    }
    cursor.y -= 8;
  }

  // Sections
  for (const section of cv.sections) {
    ensureSpace(cursor, 30, pdfDoc);
    renderSectionTitle(cursor, `// ${(section.title || section.type).toUpperCase()}`, f.bold, primaryColor, 9.5);

    for (const item of section.items) {
      renderItem(pdfDoc, cursor, item, { font: f.font, bold: f.bold, darkGray: f.darkGray, mutedGray: f.mutedGray, lightLine: f.lightLine }, "> ");
    }
    cursor.y -= 6;
  }
}

// 4. COMPACT TEMPLATE
function renderCompactTemplate(
  pdfDoc: PDFDocument,
  cursor: DrawCursor,
  cv: CV,
  primaryColor: RGBColor,
  f: { font: PDFFont; bold: PDFFont; darkGray: RGBColor; mutedGray: RGBColor; lightLine: RGBColor }
) {
  // Tight Header: Name on left, contacts on right
  const name = cv.contact.name || "Your Name";
  cursor.page.drawText(name, {
    x: cursor.margin,
    y: cursor.y - 18,
    size: 20,
    font: f.bold,
    color: f.darkGray,
  });

  const contacts: string[] = [];
  if (cv.contact.email) contacts.push(cv.contact.email);
  if (cv.contact.phone) contacts.push(cv.contact.phone);
  if (cv.contact.location) contacts.push(cv.contact.location);
  if (cv.contact.website) contacts.push(cv.contact.website);

  let contactY = cursor.y - 10;
  for (const c of contacts.slice(0, 3)) {
    const w = f.font.widthOfTextAtSize(c, 8.5);
    cursor.page.drawText(c, {
      x: cursor.margin + cursor.maxWidth - w,
      y: contactY,
      size: 8.5,
      font: f.font,
      color: f.mutedGray,
    });
    contactY -= 10;
  }
  cursor.y -= 32;

  // Divider
  cursor.page.drawLine({
    start: { x: cursor.margin, y: cursor.y },
    end: { x: cursor.margin + cursor.maxWidth, y: cursor.y },
    thickness: 1.5,
    color: primaryColor,
  });
  cursor.y -= 12;

  // Summary
  if (cv.summary?.trim()) {
    renderSectionTitle(cursor, "SUMMARY", f.bold, primaryColor, 9);
    const lines = wrapText(cv.summary.trim(), f.font, 8.5, cursor.maxWidth);
    for (const line of lines) {
      ensureSpace(cursor, 11, pdfDoc);
      cursor.page.drawText(line, {
        x: cursor.margin,
        y: cursor.y - 8,
        size: 8.5,
        font: f.font,
        color: f.darkGray,
      });
      cursor.y -= 10.5;
    }
    cursor.y -= 6;
  }

  // Sections
  for (const section of cv.sections) {
    ensureSpace(cursor, 24, pdfDoc);
    renderSectionTitle(cursor, (section.title || section.type).toUpperCase(), f.bold, primaryColor, 9);

    for (const item of section.items) {
      renderItem(pdfDoc, cursor, item, f, "-", 8.5);
    }
    cursor.y -= 4;
  }
}

function renderSectionTitle(
  cursor: DrawCursor,
  title: string,
  font: PDFFont,
  color: RGBColor,
  fontSize: number,
  centered = false
) {
  cursor.y -= 4;
  let x = cursor.margin;
  if (centered) {
    const width = font.widthOfTextAtSize(title, fontSize);
    x = cursor.margin + Math.max(0, (cursor.maxWidth - width) / 2);
  }
  cursor.page.drawText(title, {
    x,
    y: cursor.y - fontSize,
    size: fontSize,
    font,
    color,
  });
  cursor.y -= fontSize + 6;
}

function renderItem(
  pdfDoc: PDFDocument,
  cursor: DrawCursor,
  item: CVSectionItem,
  f: { font: PDFFont; bold: PDFFont; darkGray: RGBColor; mutedGray: RGBColor; lightLine: RGBColor },
  bulletPrefix = "* ",
  fontSize = 9
) {
  ensureSpace(cursor, 24, pdfDoc);

  // Title and date
  cursor.page.drawText(item.title, {
    x: cursor.margin,
    y: cursor.y - fontSize,
    size: fontSize + 1,
    font: f.bold,
    color: f.darkGray,
  });

  if (item.date) {
    const dateWidth = f.font.widthOfTextAtSize(item.date, fontSize);
    cursor.page.drawText(item.date, {
      x: cursor.margin + cursor.maxWidth - dateWidth,
      y: cursor.y - fontSize,
      size: fontSize,
      font: f.font,
      color: f.mutedGray,
    });
  }
  cursor.y -= fontSize + 3;

  // Subtitle
  if (item.subtitle) {
    ensureSpace(cursor, 12, pdfDoc);
    cursor.page.drawText(item.subtitle, {
      x: cursor.margin,
      y: cursor.y - fontSize,
      size: fontSize,
      font: f.font,
      color: f.mutedGray,
    });
    cursor.y -= fontSize + 3;
  }

  // Description
  if (item.description) {
    const lines = wrapText(item.description, f.font, fontSize, cursor.maxWidth);
    for (const line of lines) {
      ensureSpace(cursor, 12, pdfDoc);
      cursor.page.drawText(line, {
        x: cursor.margin,
        y: cursor.y - fontSize,
        size: fontSize,
        font: f.font,
        color: f.darkGray,
      });
      cursor.y -= fontSize + 2.5;
    }
  }

  // Bullets
  if (item.bullets && item.bullets.length > 0) {
    for (const bullet of item.bullets) {
      const bulletLines = wrapText(bullet, f.font, fontSize, cursor.maxWidth - 14);
      for (let i = 0; i < bulletLines.length; i++) {
        ensureSpace(cursor, 12, pdfDoc);
        const prefix = i === 0 ? bulletPrefix : "  ";
        cursor.page.drawText(`${prefix}${bulletLines[i]}`, {
          x: cursor.margin + 8,
          y: cursor.y - fontSize,
          size: fontSize,
          font: f.font,
          color: f.darkGray,
        });
        cursor.y -= fontSize + 2.5;
      }
    }
  }

  cursor.y -= 4;
}
