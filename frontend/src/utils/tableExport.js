// src/utils/tableExport.js

export function copyToClipboard(rows, columns) {
  const header = columns.join('\t');
  const body   = rows.map(r => columns.map(c => r[c] ?? '').join('\t')).join('\n');
  navigator.clipboard.writeText(`${header}\n${body}`)
    .then(() => alert('Copied to clipboard!'))
    .catch(() => alert('Copy failed'));
}

export function downloadCSV(rows, columns, filename = 'export.csv') {
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = columns.join(',');
  const body   = rows.map(r => columns.map(c => escape(r[c])).join(',')).join('\n');
  const blob   = new Blob([`${header}\n${body}`], { type: 'text/csv' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function printTable(rows, columns, title = '') {
  const header = columns.map(c => `<th>${c}</th>`).join('');
  const body   = rows.map(r =>
    `<tr>${columns.map(c => `<td>${r[c] ?? ''}</td>`).join('')}</tr>`
  ).join('');

  const html = `
    <html><head><title>${title}</title>
    <style>
      body { font-family: sans-serif; padding: 20px; }
      h2   { margin-bottom: 16px; }
      table{ border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; font-size: 13px; }
      th { background: #f0f2f5; font-weight: 700; }
      tr:nth-child(even) { background: #f9f9f9; }
    </style></head>
    <body>
      <h2>${title}</h2>
      <table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>
    </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.print();
}

// ── Special Dates ─────────────────────────────────────────────────────────────
export const getSpecialDates = () =>
  fetch(`${BASE}/special-dates`).then(r => r.json());

export const saveSpecialDate = (data) =>
  fetch(`${BASE}/special-dates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json());

export const updateSpecialDate = (id, data) =>
  fetch(`${BASE}/special-dates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json());

export const deleteSpecialDate = (id) =>
  fetch(`${BASE}/special-dates/${id}`, {
    method: 'DELETE'
  }).then(r => r.json());