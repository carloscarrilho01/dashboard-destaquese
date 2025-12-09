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

    const result = await db.execute(
      'SELECT * FROM contacts ORDER BY last_interaction DESC',
      []
    );

    res.status(200).json(result.rows || []);

  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    res.status(500).json({
      error: 'Erro ao buscar contatos',
      details: error.message
    });
  }
};
