const { connection, setCorsHeaders } = require('../../_utils');

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
    const { storyId } = req.query;
    
    // Connect to Snowflake
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

    // Get story by ID
    const selectQuery = `
      SELECT ID, USER_ID, TITLE, CONTENT, VOCABULARY_WORDS, CREATED_AT, UPDATED_AT, AUDIO_URL, SENTENCE_AUDIO_URLS
      FROM STORIES 
      WHERE ID = ?
    `;

    const result = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: selectQuery,
        binds: [storyId],
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Error fetching story:', err);
            reject(err);
          } else {
            if (rows.length === 0) {
              resolve(null);
            } else {
              const row = rows[0];
              const story = {
                id: row.ID,
                userId: row.USER_ID,
                title: row.TITLE,
                content: row.CONTENT,
                vocabularyWords: JSON.parse(row.VOCABULARY_WORDS || '[]'),
                createdAt: row.CREATED_AT,
                updatedAt: row.UPDATED_AT,
                audioUrl: row.AUDIO_URL,
                sentenceAudioUrls: JSON.parse(row.SENTENCE_AUDIO_URLS || '{}')
              };
              resolve(story);
            }
          }
        }
      });
    });

    if (!result) {
      return res.status(404).json({ error: 'Story not found' });
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
