const { connection, setCorsHeaders } = require('../_utils');

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

    // Get user stories
    const selectQuery = `
      SELECT ID, TITLE, CONTENT, VOCABULARY_WORDS, CREATED_AT, UPDATED_AT, AUDIO_URL, SENTENCE_AUDIO_URLS
      FROM STORIES 
      WHERE USER_ID = ? 
      ORDER BY CREATED_AT DESC
    `;

    const stories = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: selectQuery,
        binds: [userId],
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Error fetching stories:', err);
            reject(err);
          } else {
            const formattedStories = rows.map(row => ({
              id: row.ID,
              title: row.TITLE,
              content: row.CONTENT,
              vocabularyWords: JSON.parse(row.VOCABULARY_WORDS || '[]'),
              createdAt: row.CREATED_AT,
              updatedAt: row.UPDATED_AT,
              audioUrl: row.AUDIO_URL,
              sentenceAudioUrls: JSON.parse(row.SENTENCE_AUDIO_URLS || '{}')
            }));
            resolve(formattedStories);
          }
        }
      });
    });

    res.status(200).json({ 
      success: true, 
      data: stories 
    });

  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
