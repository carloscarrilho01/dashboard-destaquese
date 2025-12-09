const { getDb, initializeDatabase } = require('./db');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initializeDatabase();
    const db = getDb();

    const { phone_number, contact_name, message, message_type, metadata } = req.body;

    if (!phone_number || !message) {
      return res.status(400).json({
        error: 'phone_number e message são obrigatórios'
      });
    }

    // Inserir mensagem
    const result = await db.execute(
      `INSERT INTO conversations (phone_number, contact_name, message, message_type, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [
        phone_number,
        contact_name || 'Desconhecido',
        message,
        message_type || 'received',
        JSON.stringify(metadata || {})
      ]
    );

    // Atualizar ou criar contato
    await db.execute(
      `INSERT INTO contacts (phone_number, name, last_interaction, total_messages)
       VALUES (?, ?, CURRENT_TIMESTAMP, 1)
       ON CONFLICT(phone_number) DO UPDATE SET
       name = excluded.name,
       last_interaction = CURRENT_TIMESTAMP,
       total_messages = total_messages + 1`,
      [phone_number, contact_name || 'Desconhecido']
    );

    res.status(200).json({
      success: true,
      message_id: result.lastInsertRowid
    });

  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
    res.status(500).json({
      error: 'Erro ao salvar mensagem',
      details: error.message
    });
  }
};
