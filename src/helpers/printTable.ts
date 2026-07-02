export interface PrintColumn<T> {
  key: keyof T & string;
  label: string;
  print?: (value: any, item: T) => string;
}

export function printTable<T extends Record<string, any>>(
  data: T[],
  columns: PrintColumn<T>[],
  title?: string,
) {
  const rows = data
    .map(
      (item) =>
        `<tr>${columns
          .map((col) => {
            const value = item[col.key];
            const cell = col.print ? col.print(value, item) : (value ?? "");
            return `<td>${cell}</td>`;
          })
          .join("")}</tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title ?? "Print"}</title>
  <style>
    body { font-family: sans-serif; font-size: 12px; margin: 20px; }
    h1 { font-size: 15px; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; }
    tr:nth-child(even) { background: #f9fafb; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  ${title ? `<h1>${title}</h1>` : ""}
  <table>
    <thead><tr>${columns.map((col) => `<th>${col.label}</th>`).join("")}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}
