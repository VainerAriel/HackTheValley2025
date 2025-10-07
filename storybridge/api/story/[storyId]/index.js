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

  // Authenticate the request
  const authResult = await authenticateToken(req, res);
  if (!authResult.success) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = authResult.userId;

  try {
    const { storyId } = req.query;
    console.log('📖 Fetching story:', storyId);
    
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

    // Get story by ID (only if it belongs to the authenticated user)
    const selectQuery = `
      SELECT STORY_ID, USER_ID, STORY_TITLE, STORY_TEXT, VOCAB_WORDS, VOCAB_DEFINITIONS, CREATED_AT, AUDIO_URL, SENTENCE_AUDIO_DATA
      FROM STORIES 
      WHERE STORY_ID = ? AND USER_ID = ?
    `;

    const result = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: selectQuery,
        binds: [storyId, userId],
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Error fetching story:', err);
            reject(err);
          } else {
            if (rows.length === 0) {
              resolve(null);
            } else {
              const row = rows[0];
              
              // Parse vocabulary words and definitions
              let vocabularyWords = [];
              let vocabularyDefinitions = {};
              
              if (row.VOCAB_WORDS) {
                try {
                  vocabularyWords = JSON.parse(row.VOCAB_WORDS);
                } catch (e) {
                  vocabularyWords = row.VOCAB_WORDS.split(',').map(word => word.trim()).filter(word => word);
                }
              }
              
              if (row.VOCAB_DEFINITIONS) {
                try {
                  vocabularyDefinitions = JSON.parse(row.VOCAB_DEFINITIONS);
                } catch (e) {
                  console.error('Error parsing vocabulary definitions:', e);
                }
              }
              
              const story = {
                id: row.STORY_ID,
                userId: row.USER_ID,
                title: row.STORY_TITLE,
                content: row.STORY_TEXT,
                vocabularyWords: vocabularyWords,
                vocabularyDefinitions: vocabularyDefinitions,
                createdAt: row.CREATED_AT,
                audioUrl: row.AUDIO_URL,
                sentenceAudioData: row.SENTENCE_AUDIO_DATA ? JSON.parse(row.SENTENCE_AUDIO_DATA) : {}
              };
              resolve(story);
            }
          }
        }
      });
    });

    if (!result) {
      return res.status(404).json({ error: 'Story not found or you do not have permission to view this story' });
    }

    res.status(200).json({ 
      success: true, 
      data: result 
    });

  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
