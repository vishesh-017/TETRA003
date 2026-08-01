import type { ReportPayload } from "./types";

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(cell: string): string {
  if (/[",\n]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

export function exportReportCsv(report: ReportPayload) {
  const lines: string[] = [
    escapeCsv(report.title),
    escapeCsv(report.period_label),
    "",
    "KPI,Value",
    ...report.kpis.map((k) => `${escapeCsv(k.label)},${escapeCsv(k.value)}`),
    "",
    "AI Summary",
    escapeCsv(report.ai_summary),
    "",
    "Key Insights",
    ...report.key_insights.map((i) => escapeCsv(i)),
    "",
    "Recommendations",
    ...report.recommendations.map((r) => escapeCsv(r)),
  ];

  for (const table of report.tables) {
    lines.push("");
    lines.push(escapeCsv(table.title));
    lines.push(table.headers.map(escapeCsv).join(","));
    for (const row of table.rows) {
      lines.push(row.map(escapeCsv).join(","));
    }
  }

  downloadBlob(
    `healnexus-${report.kind}-report.csv`,
    new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }),
  );
}

/** Opens a print-ready report window (Save as PDF from the browser). */
export function exportReportPdf(report: ReportPayload) {
  const tablesHtml = report.tables
    .map(
      (t) => `
      <h3>${escapeHtml(t.title)}</h3>
      <table>
        <thead><tr>${t.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
        <tbody>
          ${t.rows
            .map(
              (row) =>
                `<tr>${row.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`,
            )
            .join("")}
        </tbody>
      </table>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    body { font-family: "Segoe UI", system-ui, sans-serif; color: #14201c; padding: 32px; max-width: 820px; margin: 0 auto; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 16px; margin: 28px 0 8px; }
    h3 { font-size: 14px; margin: 22px 0 8px; }
    p, li { font-size: 13px; line-height: 1.5; color: #33443d; }
    .meta { color: #667870; font-size: 12px; margin-bottom: 20px; }
    .kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .kpi { border: 1px solid #d7e0db; border-radius: 10px; padding: 10px 12px; }
    .kpi strong { display: block; font-size: 18px; }
    .kpi span { font-size: 11px; color: #667870; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #d7e0db; padding: 6px 8px; text-align: left; }
    th { background: #f3f7f5; }
    .disclaimer { margin-top: 28px; font-size: 11px; color: #889890; }
    @media print { body { padding: 12px; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.title)}</h1>
  <p class="meta">HealNexus · ${escapeHtml(report.period_label)} · Generated ${escapeHtml(new Date(report.generated_at).toLocaleString())}</p>

  <h2>Key performance indicators</h2>
  <div class="kpis">
    ${report.kpis
      .map(
        (k) =>
          `<div class="kpi"><span>${escapeHtml(k.label)}</span><strong>${escapeHtml(k.value)}</strong></div>`,
      )
      .join("")}
  </div>

  <h2>AI summary</h2>
  <p>${escapeHtml(report.ai_summary)}</p>

  <h2>Key insights</h2>
  <ul>${report.key_insights.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>

  <h2>Recommendations</h2>
  <ul>${report.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>

  ${tablesHtml}

  <p class="disclaimer">Assistive analytics only — does not diagnose, prescribe, or replace clinical judgement.</p>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!win) {
    downloadBlob(
      `healnexus-${report.kind}-report.html`,
      new Blob([html], { type: "text/html;charset=utf-8" }),
    );
    return;
  }
  win.document.write(html);
  win.document.close();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
