import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('backup/supabase_data_backup.json', 'utf8'));
const oldRef = 'qkgvgrscjlijajuzouke';

for (const [table, rows] of Object.entries(data)) {
  if (Array.isArray(rows)) {
    rows.forEach((row, idx) => {
      for (const [col, val] of Object.entries(row)) {
        const str = JSON.stringify(val);
        if (str && str.includes(oldRef)) {
          const rowId = row.id || row.key || idx;
          console.log(`[${table}] col: ${col} (id: ${rowId}) -> ${str.slice(0, 160)}`);
        }
      }
    });
  }
}
