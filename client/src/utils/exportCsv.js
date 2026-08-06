/**
 * Utility to export JavaScript array of objects to CSV format with UTF-8 BOM
 * @param {Array<Object>} data Array of objects to export
 * @param {Array<{key: string, label: string}>} columns Column definitions
 * @param {string} filename Output filename without extension
 */
export function exportToCSV(data, columns, filename = 'export') {
  if (!data || !data.length) {
    alert('Nenhum dado disponível para exportar.');
    return;
  }

  // Header line
  const headers = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(';');

  // Data lines
  const rows = data.map(row => {
    return columns
      .map(c => {
        let val = row[c.key];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        // Escape quotes
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(';');
  });

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
