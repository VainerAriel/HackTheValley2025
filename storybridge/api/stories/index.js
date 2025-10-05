const { connection, setCorsHeaders } = require('../_utils');

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
    const { storyData } = req.body;
    
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

    // Insert story into database
    const insertQuery = `
      INSERT INTO STORIES (
        ID, USER_ID, TITLE, CONTENT, VOCABULARY_WORDS, 
        CREATED_AT, UPDATED_AT, AUDIO_URL, SENTENCE_AUDIO_URLS
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), ?, ?)
    `;

    const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: insertQuery,
        binds: [
          storyId,
          storyData.userId,
          storyData.title,
          storyData.content,
          JSON.stringify(storyData.vocabularyWords || []),
          storyData.audioUrl || null,
          JSON.stringify(storyData.sentenceAudioUrls || {})
        ],
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Error inserting story:', err);
            reject(err);
          } else {
            resolve(rows);
          }
        }
      });
    });

    res.status(200).json({ 
      success: true, 
      data: { 
        id: storyId,
        message: 'Story saved successfully' 
      } 
    });

  } catch (error) {
    console.error('Error saving story:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
