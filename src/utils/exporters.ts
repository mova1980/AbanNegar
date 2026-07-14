import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";

/**
 * Exports Persian text to a beautifully formatted Word (.docx) file with RTL support
 */
export async function exportToDocx(
  text: string,
  fileName: string,
  fileMeta?: { size: string; date: string; duration?: string }
) {
  try {
    // Split text by lines to construct paragraphs
    const lines = text.split("\n");
    const docParagraphs: Paragraph[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.length === 0) return;

      // Detect if it is a heading or markdown-style title
      const isHeading1 = trimmed.startsWith("# ");
      const isHeading2 = trimmed.startsWith("## ");
      const isHeading3 = trimmed.startsWith("### ");
      const cleanLineText = trimmed
        .replace(/^#\s+/, "")
        .replace(/^##\s+/, "")
        .replace(/^###\s+/, "")
        .replace(/^\*\*\s+/, "")
        .replace(/\*\*/g, ""); // strip bold indicators

      if (isHeading1) {
        docParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: cleanLineText,
                bold: true,
                size: 32, // 16pt
                font: "Arial",
                color: "1A365D", // Dark Blue
              }),
            ],
            spacing: { before: 200, after: 120 },
          })
        );
      } else if (isHeading2) {
        docParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: cleanLineText,
                bold: true,
                size: 28, // 14pt
                font: "Arial",
                color: "2B6CB0", // Medium Blue
              }),
            ],
            spacing: { before: 160, after: 100 },
          })
        );
      } else if (isHeading3) {
        docParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            heading: HeadingLevel.HEADING_3,
            children: [
              new TextRun({
                text: cleanLineText,
                bold: true,
                size: 24, // 12pt
                font: "Arial",
                color: "4A5568", // Gray
              }),
            ],
            spacing: { before: 120, after: 80 },
          })
        );
      } else {
        // Standard bullet list detection
        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
        const bulletCleanText = trimmed.replace(/^-\s+/, "").replace(/^\*\s+/, "");

        docParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            children: [
              new TextRun({
                text: isBullet ? `•  ${bulletCleanText}` : trimmed,
                size: 23, // ~11.5pt
                font: "Arial",
              }),
            ],
            spacing: { after: 140 }, // 7pt spacing after
          })
        );
      }
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title Header
            new Paragraph({
              alignment: AlignmentType.CENTER,
              bidirectional: true,
              children: [
                new TextRun({
                  text: "گزارش پیاده‌سازی هوشمند صوت به متن",
                  bold: true,
                  size: 36, // 18pt
                  font: "Arial",
                  color: "1A202C",
                }),
              ],
              spacing: { after: 200 },
            }),

            // File Details Metadata Box
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              children: [
                new TextRun({
                  text: `نام فایل صوتی: ${fileName}`,
                  bold: true,
                  size: 20, // 10pt
                  font: "Arial",
                }),
              ],
            }),
            ...(fileMeta
              ? [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    bidirectional: true,
                    children: [
                      new TextRun({
                        text: `تاریخ پردازش: ${fileMeta.date}`,
                        size: 18,
                        font: "Arial",
                        color: "718096",
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    bidirectional: true,
                    children: [
                      new TextRun({
                        text: `اندازه فایل: ${fileMeta.size}`,
                        size: 18,
                        font: "Arial",
                        color: "718096",
                      }),
                    ],
                  }),
                  ...(fileMeta.duration
                    ? [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          bidirectional: true,
                          children: [
                            new TextRun({
                              text: `مدت زمان فایل صوتی: ${fileMeta.duration}`,
                              size: 18,
                              font: "Arial",
                              color: "718096",
                            }),
                          ],
                          spacing: { after: 300 },
                        }),
                      ]
                    : [
                        new Paragraph({
                          spacing: { after: 300 },
                        }),
                      ]),
                ]
              : [
                  new Paragraph({
                    spacing: { after: 300 },
                  }),
                ]),

            // Decorative separator line
            new Paragraph({
              alignment: AlignmentType.CENTER,
              bidirectional: true,
              children: [
                new TextRun({
                  text: "________________________________________________________",
                  color: "CBD5E0",
                  font: "Arial",
                }),
              ],
              spacing: { after: 400 },
            }),

            // The transcribed text body paragraphs
            ...docParagraphs,
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanBaseName = fileName.replace(/\.[^/.]+$/, "");
    a.download = `${cleanBaseName}_تبدیل_متن.docx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export Word document:", error);
    alert("خطایی در ساخت فایل ورد رخ داد.");
  }
}

/**
 * Exports Persian text to a basic Plain Text (.txt) file with UTF-8 BOM encoding (for correct Persian display in Notepad)
 */
export function exportToTxt(text: string, fileName: string) {
  try {
    // Add UTF-8 BOM (Byte Order Mark) to force Windows Notepad and other editors to open it in UTF-8
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanBaseName = fileName.replace(/\.[^/.]+$/, "");
    a.download = `${cleanBaseName}_تبدیل_متن.txt`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export text file:", error);
    alert("خطایی در ساخت فایل متنی رخ داد.");
  }
}

/**
 * Triggers native high-fidelity printing / Save as PDF
 * This is the most bulletproof way to generate a Persian PDF in the client browser with perfect RTL word wrapping and font shaping.
 */
export function triggerPrintPDF(
  text: string,
  fileName: string,
  fileMeta?: { size: string; date: string; duration?: string }
) {
  // Create a temporary iframe or window to print
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("لطفاً مسدودکننده پاپ‌آپ (Pop-up Blocker) مرورگر خود را غیرفعال کنید.");
    return;
  }

  // Format the text into HTML paragraphs
  const htmlContent = text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.length === 0) return "";
      
      if (trimmed.startsWith("# ")) {
        return `<h1 style="color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px;">${trimmed.replace(/^#\s+/, "")}</h1>`;
      }
      if (trimmed.startsWith("## ")) {
        return `<h2 style="color: #2b6cb0; margin-top: 18px;">${trimmed.replace(/^##\s+/, "")}</h2>`;
      }
      if (trimmed.startsWith("### ")) {
        return `<h3 style="color: #4a5568; margin-top: 14px;">${trimmed.replace(/^###\s+/, "")}</h3>`;
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return `<li style="margin-right: 20px; margin-bottom: 8px;">${trimmed.replace(/^[-\*]\s+/, "")}</li>`;
      }
      return `<p style="line-height: 1.8; margin-bottom: 12px; text-align: justify;">${trimmed}</p>`;
    })
    .join("\n");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>خروجی PDF - ${fileName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap');
        
        body {
          font-family: 'Vazirmatn', Arial, sans-serif;
          color: #2d3748;
          padding: 40px;
          margin: 0;
          direction: rtl;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px double #cbd5e0;
          padding-bottom: 20px;
        }
        .header h1 {
          font-size: 24px;
          margin-bottom: 10px;
          color: #1a202c;
        }
        .meta-info {
          text-align: right;
          font-size: 13px;
          color: #718096;
          line-height: 1.6;
        }
        .content {
          font-size: 15px;
          color: #2d3748;
        }
        @media print {
          body {
            padding: 20px;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>گزارش پیاده‌سازی هوشمند صوت به متن</h1>
        <div class="meta-info">
          <div><strong>نام فایل صوتی:</strong> ${fileName}</div>
          ${fileMeta ? `<div><strong>تاریخ پردازش:</strong> ${fileMeta.date}</div>` : ""}
          ${fileMeta ? `<div><strong>اندازه فایل:</strong> ${fileMeta.size}</div>` : ""}
          ${fileMeta && fileMeta.duration ? `<div><strong>مدت زمان فایل صوتی:</strong> ${fileMeta.duration}</div>` : ""}
        </div>
      </div>
      <div class="content">
        ${htmlContent}
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.close();
          }, 500);
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}
