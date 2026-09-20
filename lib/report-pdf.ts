import type { ReportPdfData } from "@/components/shared/report-types";

/**
 * Renders the spending report as a clean, print-ready A4 PDF using jsPDF.
 * Loaded via dynamic import so the (substantial) pdf-lib stays out of the
 * initial page bundle and only ships when the user actually exports.
 */
export async function exportReportPdf(data: ReportPdfData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const M = 48; // margin
  let y = M;

  const money = (n: number) =>
    new Intl.NumberFormat("en", { style: "currency", currency: data.currency, currencyDisplay: "narrowSymbol" }).format(n);
  const pct = (n: number, total: number) => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "0%");

  // ── Header ──────────────────────────────────────────────
  doc.setTextColor(22, 63, 46);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("SpendWise", M, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 118, 124);
  doc.text(`Spending Report · ${data.periodLabel}`, PAGE_W - M, y + 4, { align: "right" });
  y += 22;
  doc.text(`Generated ${new Date().toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}`, PAGE_W - M, y, { align: "right" });
  y += 18;
  doc.setDrawColor(222, 226, 224);
  doc.setLineWidth(1);
  doc.line(M, y, PAGE_W - M, y);
  y += 28;

  // ── Summary stats ───────────────────────────────────────
  const stats: { label: string; value: string }[] = [
    { label: "Total spent", value: money(data.totals.spent) },
    { label: "Total income", value: money(data.totals.income) },
    { label: "Net", value: money(data.totals.income - data.totals.spent) },
    { label: "Daily average", value: money(data.totals.avgDaily) },
  ];
  const colW = (PAGE_W - M * 2) / stats.length;
  stats.forEach((s, i) => {
    const x = M + i * colW;
    doc.setFillColor(246, 248, 247);
    doc.roundedRect(x, y - 14, colW - 10, 58, 6, 6, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(110, 118, 124);
    doc.text(s.label.toUpperCase(), x + 12, y + 2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 38);
    doc.text(s.value, x + 12, y + 26);
  });
  y += 76;

  const ensureRoom = (needed: number) => {
    if (y + needed > PAGE_H - M) {
      doc.addPage();
      y = M;
    }
  };

  // ── Largest expense ─────────────────────────────────────
  if (data.totals.largest.amount > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(110, 118, 124);
    const txt = `Largest expense: ${data.totals.largest.description} — ${money(data.totals.largest.amount)}`;
    doc.text(doc.splitTextToSize(txt, PAGE_W - M * 2), M, y);
    y += 24;
  }

  // ── Category breakdown ──────────────────────────────────
  ensureRoom(80);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 38);
  doc.text("Spending by category", M, y);
  y += 8;
  doc.setDrawColor(222, 226, 224);
  doc.line(M, y, PAGE_W - M, y);
  y += 18;

  if (data.categories.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110, 118, 124);
    doc.text("No expenses in this period.", M, y);
    y += 20;
  }
  for (const cat of data.categories) {
    ensureRoom(26);
    // color dot
    const [r, g, b] = hexToRgb(cat.color);
    doc.setFillColor(r, g, b);
    doc.circle(M + 4, y - 3, 4, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 38);
    doc.text(cat.name, M + 16, y);
    doc.text(pct(cat.value, data.totals.spent), M + 200, y);
    doc.setFont("helvetica", "bold");
    doc.text(money(cat.value), PAGE_W - M, y, { align: "right" });
    // share bar
    doc.setFillColor(238, 241, 239);
    doc.roundedRect(M + 230, y - 6, PAGE_W - M * 2 - 320, 6, 3, 3, "F");
    const share = data.totals.spent > 0 ? cat.value / data.totals.spent : 0;
    doc.setFillColor(r, g, b);
    if (share > 0) doc.roundedRect(M + 230, y - 6, Math.max(4, (PAGE_W - M * 2 - 320) * share), 6, 3, 3, "F");
    y += 22;
  }
  y += 16;

  // ── Monthly trend ───────────────────────────────────────
  if (data.months.length > 0) {
    ensureRoom(90);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 38);
    doc.text("Monthly spending", M, y);
    y += 8;
    doc.setDrawColor(222, 226, 224);
    doc.line(M, y, PAGE_W - M, y);
    y += 16;

    const maxV = Math.max(...data.months.map((m) => m.value), 1);
    const barAreaW = PAGE_W - M * 2;
    const slot = barAreaW / data.months.length;
    const barW = Math.min(36, slot * 0.55);
    const chartH = 90;
    ensureRoom(chartH + 40);
    const baseY = y + chartH;
    data.months.forEach((m, i) => {
      const x = M + i * slot + (slot - barW) / 2;
      const h = Math.max(2, (m.value / maxV) * chartH);
      doc.setFillColor(74, 124, 89);
      doc.roundedRect(x, baseY - h, barW, h, 3, 3, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(110, 118, 124);
      doc.text(m.month, x + barW / 2, baseY + 12, { align: "center" });
      doc.setFontSize(7.5);
      doc.text(money(m.value), x + barW / 2, baseY - h - 5, { align: "center" });
    });
    y = baseY + 28;
  }

  // ── Footer ──────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 156, 152);
    doc.text("SpendWise — personal spending report", M, PAGE_H - 24);
    doc.text(`${p} / ${pages}`, PAGE_W - M, PAGE_H - 24, { align: "right" });
  }

  const fname = `spendwise-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fname);
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [110, 118, 124];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}
