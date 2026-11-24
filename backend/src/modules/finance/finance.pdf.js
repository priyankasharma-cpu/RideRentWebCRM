import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';

const margin = 43;
const textColor = '#1c2837';
const dimColor = '#44556a';
const lineColor = '#cdd6e0';
const widths = {
  'Report information': [0.37, 0.63],
  'Financial totals': [0.55, 0.225, 0.225],
  'Vehicle revenue': [0.36, 0.4, 0.24],
  Trends: [0.19, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135],
  'Expense totals': [0.66, 0.34],
  'Filtered completed transactions': [0.66, 0.34],
};
const fontPath = (subset, weight) =>
  fileURLToPath(
    import.meta.resolve(
      '@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-' +
        subset +
        '-' +
        weight +
        '-normal.woff',
    ),
  );
const devanagari = /[\p{Script=Devanagari}₹]/u;
function drawText(doc, input, x, y, width, bold = false) {
  const text = String(input ?? '');
  const runs = text.match(
    /[\p{Script=Devanagari}\u200c-\u200d₹]+|[^\p{Script=Devanagari}\u200c-\u200d₹]+/gu,
  ) || [''];
  runs.forEach((run, index) => {
    doc.font(devanagari.test(run) ? 'Hindi' : bold ? 'Bold' : 'Regular');
    const options = { width, continued: index < runs.length - 1 };
    if (index === 0) doc.text(run, x, y, options);
    else doc.text(run, options);
  });
}
const safeValue = (value) => (value === '' || value == null ? '—' : String(value));
const available = (doc) => doc.page.width - margin * 2;
function ensureSpace(doc, space) {
  if (doc.y + space > doc.page.height - margin) doc.addPage();
}

function tableRow(doc, row, sizes, heading) {
  const width = available(doc);
  doc.font(heading ? 'Bold' : 'Regular').fontSize(8.3);
  const cells = row.map(safeValue);
  const height =
    Math.max(
      ...cells.map((value, i) => doc.heightOfString(value, { width: width * sizes[i] - 10 })),
    ) + 12;
  let x = margin;
  const y = doc.y;
  if (heading) doc.rect(x, y, width, height).fill('#e8eef5');
  doc.fillColor(textColor);
  for (const [index, cell] of cells.entries()) {
    const cellWidth = width * sizes[index];
    drawText(doc, cell, x + 5, y + 5, cellWidth - 10, heading);
    x += cellWidth;
  }
  doc
    .moveTo(margin, y + height)
    .lineTo(margin + width, y + height)
    .lineWidth(0.35)
    .stroke(lineColor);
  doc.x = margin;
  doc.y = y + height;
}
function sectionHeading(doc, name) {
  ensureSpace(doc, 65);
  doc
    .moveDown(0.65)
    .font('Bold')
    .fontSize(12)
    .fillColor(textColor)
    .text(name, { width: available(doc) });
  doc.moveDown(0.35);
}
function renderTable(doc, { name, rows }) {
  if (!rows.length) return;
  sectionHeading(doc, name);
  const sizes = widths[name] || Array(rows[0].length).fill(1 / rows[0].length);
  const header = name !== 'Report information';
  for (const [index, row] of rows.entries()) {
    doc.font('Regular').fontSize(8.3);
    const width = available(doc);
    const height =
      Math.max(
        ...row.map((cell, i) =>
          doc.heightOfString(safeValue(cell), { width: width * sizes[i] - 10 }),
        ),
      ) + 14;
    const page = doc.page;
    ensureSpace(doc, height + (header && index ? 29 : 0));
    if (page !== doc.page && header && index) tableRow(doc, rows[0], sizes, true);
    tableRow(doc, row, sizes, header && index === 0);
  }
}
function renderTransactions(doc, { name, rows }) {
  sectionHeading(doc, name);
  if (rows.length < 2) {
    doc.font('Regular').fontSize(9).text('No matching transactions.');
    return;
  }
  const [headers, ...entries] = rows;
  const fields = ['Type', 'Amount (INR)', 'Date and time (UTC)'].map((label) =>
    headers.indexOf(label),
  );
  const width = available(doc);
  for (const row of entries) {
    const [type, amount, date] = fields.map((index) => row[index]);
    const details = row
      .flatMap((value, index) =>
        value === '' || fields.includes(index) ? [] : [headers[index] + ': ' + value],
      )
      .join('  |  ');
    const title = [type || 'Transaction', 'INR ' + Number(amount).toFixed(2), date].join('  |  ');
    doc.font('Regular').fontSize(8.4);
    const height = doc.heightOfString(details, { width }) + 34;
    ensureSpace(doc, height);
    doc.fillColor(textColor).fontSize(9);
    drawText(doc, title, margin, doc.y, width, true);
    doc.fillColor(dimColor).fontSize(8.4);
    drawText(doc, details, margin, doc.y + 2, width);
    doc.moveDown(0.7);
    doc
      .moveTo(margin, doc.y)
      .lineTo(margin + width, doc.y)
      .lineWidth(0.35)
      .stroke(lineColor);
    doc.moveDown(0.45);
  }
}

export async function renderPdf(sections) {
  const doc = new PDFDocument({
    size: 'A4',
    margin,
    autoFirstPage: false,
    info: { Title: 'RideRent financial report' },
  });
  doc.registerFont('Regular', fontPath('latin', 400));
  doc.registerFont('Bold', fontPath('latin', 700));
  doc.registerFont('Hindi', fontPath('devanagari', 400));
  const chunks = [];
  const output = new Promise((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
  let page = 0;
  doc.on('pageAdded', () => {
    page++;
    doc
      .font('Regular')
      .fontSize(8)
      .fillColor(dimColor)
      .text('RideRent financial report  |  INR  |  Page ' + page, margin, 22, {
        align: 'right',
        width: available(doc),
        lineBreak: false,
      });
    doc.x = margin;
    doc.y = margin;
  });
  doc.addPage();
  doc.font('Bold').fontSize(21).fillColor(textColor).text('Financial report');
  for (const section of sections) {
    if (section.name === 'Transactions') renderTransactions(doc, section);
    else renderTable(doc, section);
  }
  doc.end();
  return { mime: 'application/pdf', bytes: await output };
}
