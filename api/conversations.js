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

    const { phone_number, limit = '100', offset = '0' } = req.query;

    let sql = 'SELECT * FROM conversations';
    let params = [];

    if (phone_number) {
      sql += ' WHERE phone_number = ?';
      params.push(phone_number);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.execute(sql, params);

    res.status(200).json(result.rows || []);

  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({
      error: 'Erro ao buscar conversas',
      details: error.message
    });
  }
};
