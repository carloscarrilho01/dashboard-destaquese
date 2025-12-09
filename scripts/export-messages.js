const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('./conversations.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Erro ao abrir banco de dados:', err.message);
    process.exit(1);
  }
});

function exportToJSON(filename = 'export-messages.json') {
  db.all('SELECT * FROM conversations ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar mensagens:', err.message);
      return;
    }

    const exportData = {
      exported_at: new Date().toISOString(),
      total_messages: rows.length,
      messages: rows
    };

    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    console.log(`✓ Exportadas ${rows.length} mensagens para ${filename}`);
    db.close();
  });
}

function exportToCSV(filename = 'export-messages.csv') {
  db.all('SELECT * FROM conversations ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar mensagens:', err.message);
      return;
    }

    if (rows.length === 0) {
      console.log('Nenhuma mensagem para exportar');
      db.close();
      return;
    }

    const headers = Object.keys(rows[0]).join(',');
    const csvRows = rows.map(row => {
      return Object.values(row).map(value => {
        if (value === null) return '';
        const str = String(value).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',');
    });

    const csv = [headers, ...csvRows].join('\n');
    fs.writeFileSync(filename, csv);
    console.log(`✓ Exportadas ${rows.length} mensagens para ${filename}`);
    db.close();
  });
}

function exportByContact(phoneNumber, filename) {
  db.all(
    'SELECT * FROM conversations WHERE phone_number = ? ORDER BY timestamp DESC',
    [phoneNumber],
    (err, rows) => {
      if (err) {
        console.error('Erro ao buscar mensagens:', err.message);
        return;
      }

      if (rows.length === 0) {
        console.log(`Nenhuma mensagem encontrada para ${phoneNumber}`);
        db.close();
        return;
      }

      const outputFile = filename || `export-${phoneNumber}.json`;
      const exportData = {
        phone_number: phoneNumber,
        exported_at: new Date().toISOString(),
        total_messages: rows.length,
        messages: rows
      };

      fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2));
      console.log(`✓ Exportadas ${rows.length} mensagens de ${phoneNumber} para ${outputFile}`);
      db.close();
    }
  );
}

function exportByDateRange(startDate, endDate, filename = 'export-date-range.json') {
  db.all(
    'SELECT * FROM conversations WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
    [startDate, endDate],
    (err, rows) => {
      if (err) {
        console.error('Erro ao buscar mensagens:', err.message);
        return;
      }

      const exportData = {
        date_range: { start: startDate, end: endDate },
        exported_at: new Date().toISOString(),
        total_messages: rows.length,
        messages: rows
      };

      fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
      console.log(`✓ Exportadas ${rows.length} mensagens de ${startDate} a ${endDate} para ${filename}`);
      db.close();
    }
  );
}

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'json':
    exportToJSON(args[1]);
    break;

  case 'csv':
    exportToCSV(args[1]);
    break;

  case 'contact':
    if (!args[1]) {
      console.error('Uso: node export-messages.js contact <numero> [arquivo]');
      process.exit(1);
    }
    exportByContact(args[1], args[2]);
    break;

  case 'date':
    if (!args[1] || !args[2]) {
      console.error('Uso: node export-messages.js date <inicio> <fim> [arquivo]');
      console.error('Exemplo: node export-messages.js date "2024-01-01" "2024-12-31"');
      process.exit(1);
    }
    exportByDateRange(args[1], args[2], args[3]);
    break;

  default:
    console.log('Uso:');
    console.log('  node export-messages.js json [arquivo]              - Exportar todas para JSON');
    console.log('  node export-messages.js csv [arquivo]               - Exportar todas para CSV');
    console.log('  node export-messages.js contact <numero> [arquivo]  - Exportar por contato');
    console.log('  node export-messages.js date <inicio> <fim> [arq]  - Exportar por período');
    console.log('\nExemplos:');
    console.log('  node export-messages.js json mensagens.json');
    console.log('  node export-messages.js csv mensagens.csv');
    console.log('  node export-messages.js contact 5511999999999');
    console.log('  node export-messages.js date "2024-01-01" "2024-12-31"');
    db.close();
}
