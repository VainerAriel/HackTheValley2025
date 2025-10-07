const { connection, setCorsHeaders } = require('../../../_utils');

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    const { word, storyId } = req.body;
    
    console.log('📝 Adding vocabulary word:', { userId, word, storyId });
    
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

    // Add vocabulary word
    const insertQuery = `
      INSERT INTO USER_VOCABULARY (VOCAB_ID, USER_ID, WORD, STORY_ID, CREATED_AT)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP())
    `;

    // Generate a unique vocab ID
    const vocabId = `vocab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: insertQuery,
        binds: [vocabId, userId, word, storyId],
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Error adding vocabulary:', err);
            reject(err);
          } else {
            console.log('✅ Vocabulary word added successfully:', word);
            resolve(rows);
          }
        }
      });
    });

    res.status(200).json({ 
      success: true, 
      message: 'Vocabulary word added successfully' 
    });

  } catch (error) {
    console.error('Error adding vocabulary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
