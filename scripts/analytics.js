const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./conversations.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Erro ao abrir banco de dados:', err.message);
    process.exit(1);
  }
});

function generateAnalytics() {
  console.log('\n📊 RELATÓRIO DE ANÁLISE DE MENSAGENS\n');
  console.log('='.repeat(60));

  db.get('SELECT COUNT(*) as total FROM conversations', [], (err, row) => {
    console.log(`\n📨 Total de Mensagens: ${row.total}`);

    db.get('SELECT COUNT(*) as total FROM conversations WHERE message_type = "received"', [], (err, row) => {
      console.log(`   ↓ Recebidas: ${row.total}`);
    });

    db.get('SELECT COUNT(*) as total FROM conversations WHERE message_type = "sent"', [], (err, row) => {
      console.log(`   ↑ Enviadas: ${row.total}`);
    });
  });

  db.get('SELECT COUNT(DISTINCT phone_number) as total FROM conversations', [], (err, row) => {
    console.log(`\n👥 Total de Contatos Únicos: ${row.total}`);
  });

  db.all(`
    SELECT
      DATE(timestamp) as date,
      COUNT(*) as total
    FROM conversations
    GROUP BY DATE(timestamp)
    ORDER BY date DESC
    LIMIT 7
  `, [], (err, rows) => {
    console.log('\n📅 Mensagens por Dia (últimos 7 dias):');
    rows.forEach(row => {
      const bar = '█'.repeat(Math.floor(row.total / 5));
      console.log(`   ${row.date}: ${row.total.toString().padStart(4)} ${bar}`);
    });
  });

  db.all(`
    SELECT
      phone_number,
      contact_name,
      COUNT(*) as total
    FROM conversations
    GROUP BY phone_number
    ORDER BY total DESC
    LIMIT 10
  `, [], (err, rows) => {
    console.log('\n🔥 Top 10 Contatos Mais Ativos:');
    rows.forEach((row, idx) => {
      console.log(`   ${(idx + 1).toString().padStart(2)}. ${row.contact_name} (${row.phone_number}): ${row.total} mensagens`);
    });
  });

  db.all(`
    SELECT
      CASE
        WHEN CAST(strftime('%H', timestamp) AS INTEGER) BETWEEN 0 AND 5 THEN '00-05h'
        WHEN CAST(strftime('%H', timestamp) AS INTEGER) BETWEEN 6 AND 11 THEN '06-11h'
        WHEN CAST(strftime('%H', timestamp) AS INTEGER) BETWEEN 12 AND 17 THEN '12-17h'
        ELSE '18-23h'
      END as period,
      COUNT(*) as total
    FROM conversations
    GROUP BY period
    ORDER BY
      CASE period
        WHEN '00-05h' THEN 1
        WHEN '06-11h' THEN 2
        WHEN '12-17h' THEN 3
        ELSE 4
      END
  `, [], (err, rows) => {
    console.log('\n🕐 Distribuição por Período:');
    const maxTotal = Math.max(...rows.map(r => r.total));
    rows.forEach(row => {
      const percentage = ((row.total / maxTotal) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(percentage / 2));
      console.log(`   ${row.period}: ${row.total.toString().padStart(4)} ${bar} ${percentage}%`);
    });
  });

  db.all(`
    SELECT
      strftime('%w', timestamp) as day_of_week,
      CASE strftime('%w', timestamp)
        WHEN '0' THEN 'Domingo'
        WHEN '1' THEN 'Segunda'
        WHEN '2' THEN 'Terça'
        WHEN '3' THEN 'Quarta'
        WHEN '4' THEN 'Quinta'
        WHEN '5' THEN 'Sexta'
        WHEN '6' THEN 'Sábado'
      END as day_name,
      COUNT(*) as total
    FROM conversations
    GROUP BY day_of_week
    ORDER BY day_of_week
  `, [], (err, rows) => {
    console.log('\n📆 Mensagens por Dia da Semana:');
    const maxTotal = Math.max(...rows.map(r => r.total));
    rows.forEach(row => {
      const percentage = ((row.total / maxTotal) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(percentage / 2));
      console.log(`   ${row.day_name.padEnd(8)}: ${row.total.toString().padStart(4)} ${bar} ${percentage}%`);
    });
  });

  db.get(`
    SELECT
      AVG(msg_per_contact) as avg_messages
    FROM (
      SELECT COUNT(*) as msg_per_contact
      FROM conversations
      GROUP BY phone_number
    )
  `, [], (err, row) => {
    console.log(`\n📊 Média de Mensagens por Contato: ${row.avg_messages ? row.avg_messages.toFixed(2) : 0}`);
  });

  db.all(`
    SELECT
      status,
      COUNT(*) as total
    FROM conversations
    GROUP BY status
  `, [], (err, rows) => {
    console.log('\n✅ Status das Mensagens:');
    rows.forEach(row => {
      console.log(`   ${row.status}: ${row.total}`);
    });
  });

  db.get(`
    SELECT
      AVG(LENGTH(message)) as avg_length,
      MAX(LENGTH(message)) as max_length,
      MIN(LENGTH(message)) as min_length
    FROM conversations
  `, [], (err, row) => {
    console.log('\n📝 Análise de Tamanho das Mensagens:');
    console.log(`   Tamanho Médio: ${row.avg_length ? row.avg_length.toFixed(0) : 0} caracteres`);
    console.log(`   Maior Mensagem: ${row.max_length || 0} caracteres`);
    console.log(`   Menor Mensagem: ${row.min_length || 0} caracteres`);
  });

  db.get(`
    SELECT
      timestamp,
      phone_number,
      contact_name
    FROM conversations
    ORDER BY timestamp DESC
    LIMIT 1
  `, [], (err, row) => {
    if (row) {
      const date = new Date(row.timestamp);
      console.log('\n⏰ Última Mensagem:');
      console.log(`   Data: ${date.toLocaleString('pt-BR')}`);
      console.log(`   Contato: ${row.contact_name} (${row.phone_number})`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✓ Análise concluída!\n');
    db.close();
  });
}

function searchMessages(keyword) {
  console.log(`\n🔍 Buscando mensagens com: "${keyword}"\n`);

  db.all(
    `SELECT * FROM conversations
     WHERE message LIKE ?
     ORDER BY timestamp DESC
     LIMIT 50`,
    [`%${keyword}%`],
    (err, rows) => {
      if (err) {
        console.error('Erro ao buscar:', err.message);
        db.close();
        return;
      }

      if (rows.length === 0) {
        console.log('Nenhuma mensagem encontrada.');
        db.close();
        return;
      }

      console.log(`Encontradas ${rows.length} mensagens:\n`);
      rows.forEach((row, idx) => {
        console.log(`${idx + 1}. [${row.timestamp}] ${row.contact_name} (${row.phone_number})`);
        console.log(`   ${row.message_type === 'received' ? '↓' : '↑'} ${row.message.substring(0, 100)}${row.message.length > 100 ? '...' : ''}`);
        console.log('');
      });

      db.close();
    }
  );
}

function exportTrainingData(filename = 'training-data.jsonl') {
  const fs = require('fs');

  console.log('\n🤖 Exportando dados para treinamento de IA...\n');

  db.all(`
    SELECT
      c1.message as user_message,
      c2.message as assistant_response,
      c1.phone_number,
      c1.timestamp
    FROM conversations c1
    LEFT JOIN conversations c2
      ON c1.phone_number = c2.phone_number
      AND c2.timestamp > c1.timestamp
      AND c2.message_type = 'sent'
    WHERE c1.message_type = 'received'
      AND c2.message IS NOT NULL
    ORDER BY c1.timestamp
  `, [], (err, rows) => {
    if (err) {
      console.error('Erro:', err.message);
      db.close();
      return;
    }

    const trainingData = rows.map(row => ({
      messages: [
        { role: 'user', content: row.user_message },
        { role: 'assistant', content: row.assistant_response }
      ],
      metadata: {
        phone_number: row.phone_number,
        timestamp: row.timestamp
      }
    }));

    const jsonl = trainingData.map(item => JSON.stringify(item)).join('\n');
    fs.writeFileSync(filename, jsonl);

    console.log(`✓ Exportados ${trainingData.length} pares de conversação para ${filename}`);
    console.log('\nEste arquivo pode ser usado para:');
    console.log('  - Fine-tuning de modelos de IA (GPT, Claude, etc)');
    console.log('  - Análise de padrões de conversação');
    console.log('  - Melhorar respostas automáticas\n');

    db.close();
  });
}

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'search':
    if (!args[1]) {
      console.error('Uso: node analytics.js search <palavra-chave>');
      process.exit(1);
    }
    searchMessages(args[1]);
    break;

  case 'training':
    exportTrainingData(args[1]);
    break;

  case 'report':
  default:
    generateAnalytics();
}
