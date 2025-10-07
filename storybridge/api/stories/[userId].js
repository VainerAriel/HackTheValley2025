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
    console.log('📚 Fetching stories for user:', userId);
    
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
            const formattedStories = rows.map(row => {
              // Handle vocabulary words - could be JSON array or comma-separated string
              let vocabularyWords = [];
              if (row.VOCABULARY_WORDS) {
                try {
                  vocabularyWords = JSON.parse(row.VOCABULARY_WORDS);
                } catch (e) {
                  vocabularyWords = row.VOCABULARY_WORDS.split(',').map(item => item.trim()).filter(item => item);
                }
              }

              // Handle sentence audio URLs
              let sentenceAudioUrls = {};
              if (row.SENTENCE_AUDIO_URLS) {
                try {
                  sentenceAudioUrls = JSON.parse(row.SENTENCE_AUDIO_URLS);
                } catch (e) {
                  sentenceAudioUrls = {};
                }
              }

              return {
                id: row.ID,
                title: row.TITLE,
                content: row.CONTENT,
                vocabularyWords: vocabularyWords,
                createdAt: row.CREATED_AT,
                updatedAt: row.UPDATED_AT,
                audioUrl: row.AUDIO_URL,
                sentenceAudioUrls: sentenceAudioUrls
              };
            });
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
