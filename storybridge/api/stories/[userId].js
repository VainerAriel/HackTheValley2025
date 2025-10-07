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
      SELECT STORY_ID, STORY_TITLE, STORY_TEXT, VOCAB_WORDS, CREATED_AT, AUDIO_URL, SENTENCE_AUDIO_DATA
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
              if (row.VOCAB_WORDS) {
                try {
                  vocabularyWords = JSON.parse(row.VOCAB_WORDS);
                } catch (e) {
                  vocabularyWords = row.VOCAB_WORDS.split(',').map(item => item.trim()).filter(item => item);
                }
              }

              // Handle sentence audio data
              let sentenceAudioData = {};
              if (row.SENTENCE_AUDIO_DATA) {
                try {
                  sentenceAudioData = JSON.parse(row.SENTENCE_AUDIO_DATA);
                } catch (e) {
                  sentenceAudioData = {};
                }
              }

              return {
                id: row.STORY_ID,
                title: row.STORY_TITLE,
                content: row.STORY_TEXT,
                vocabularyWords: vocabularyWords,
                createdAt: row.CREATED_AT,
                audioUrl: row.AUDIO_URL,
                sentenceAudioData: sentenceAudioData
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
