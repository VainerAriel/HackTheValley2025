const { connection, setCorsHeaders } = require('../../../_utils');

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
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

    if (req.method === 'GET') {
      console.log('📖 Fetching vocabulary for user:', userId);
      
      // Get user vocabulary
      const selectQuery = `
        SELECT VOCAB_ID, WORD, STORY_ID, CREATED_AT
        FROM USER_VOCABULARY 
        WHERE USER_ID = ? 
        ORDER BY CREATED_AT DESC
      `;

      const vocabulary = await new Promise((resolve, reject) => {
        connection.execute({
          sqlText: selectQuery,
          binds: [userId],
          complete: (err, stmt, rows) => {
            if (err) {
              console.error('Error fetching vocabulary:', err);
              reject(err);
            } else {
              console.log('📖 Vocabulary query result:', rows.length, 'words found');
              const formattedVocabulary = rows.map(row => ({
                vocabId: row.VOCAB_ID,
                word: row.WORD,
                storyId: row.STORY_ID,
                createdAt: row.CREATED_AT
              }));
              resolve(formattedVocabulary);
            }
          }
        });
      });

      res.status(200).json({ 
        success: true, 
        data: vocabulary 
      });
    } else if (req.method === 'POST') {
      const { word, storyId } = req.body;
      
      console.log('📝 Adding vocabulary word:', { userId, word, storyId });
      
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
    }

  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
