const { connection, setCorsHeaders, authenticateToken } = require('../../_utils');

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
      
      // Connect to Snowflake (only if not already connected)
      if (!connection.isUp()) {
        await new Promise((resolve, reject) => {
          connection.connect((err, conn) => {
            if (err) {
              console.error('Snowflake connection failed:', err);
              reject(err);
            } else {
              resolve(conn);
            }
          });
        });
      }

      // Get user stats
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM STORIES WHERE USER_ID = ?) as total_stories,
          (SELECT COUNT(*) FROM USER_VOCABULARY WHERE USER_ID = ?) as total_vocabulary
      `;

      const result = await new Promise((resolve, reject) => {
        connection.execute({
          sqlText: statsQuery,
          binds: [userId, userId],
          complete: (err, stmt, rows) => {
            if (err) {
              console.error('Error fetching stats:', err);
              reject(err);
            } else {
              if (rows.length > 0) {
                const row = rows[0];
                resolve({
                  totalStories: row.TOTAL_STORIES || 0,
                  totalVocabulary: row.TOTAL_VOCABULARY || 0
                });
              } else {
                resolve({
                  totalStories: 0,
                  totalVocabulary: 0
                });
              }
            }
          }
        });
      });

      res.status(200).json({ 
        success: true, 
        data: result 
      });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
