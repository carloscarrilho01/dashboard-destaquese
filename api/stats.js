const { getDb, initializeDatabase } = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initializeDatabase();
    const db = getDb();

    const stats = {};

    // Total de mensagens
    const totalMessages = await db.execute('SELECT COUNT(*) as total FROM conversations', []);
    stats.total_messages = totalMessages.rows[0]?.total || 0;

    // Total de contatos
    const totalContacts = await db.execute('SELECT COUNT(*) as total FROM contacts', []);
    stats.total_contacts = totalContacts.rows[0]?.total || 0;

    // Mensagens de hoje
    const today = await db.execute(
      'SELECT COUNT(*) as total FROM conversations WHERE DATE(timestamp) = DATE("now")',
      []
    );
    stats.messages_today = today.rows[0]?.total || 0;

    // Mensagens pendentes
    const pending = await db.execute(
      'SELECT COUNT(*) as total FROM conversations WHERE message_type = "received" AND status = "pending"',
      []
    );
    stats.pending_messages = pending.rows[0]?.total || 0;

    res.status(200).json(stats);

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      error: 'Erro ao buscar estatísticas',
      details: error.message
    });
  }
};
