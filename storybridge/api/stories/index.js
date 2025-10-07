const { connection, setCorsHeaders } = require('../_utils');

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const storyData = req.body;
    console.log('💾 Saving story:', storyData.title, 'for user:', storyData.userId);
    
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

    // Insert story into database
    const insertQuery = `
      INSERT INTO STORIES (
        STORY_ID, USER_ID, STORY_TITLE, STORY_TEXT, VOCAB_WORDS, VOCAB_DEFINITIONS,
        CREATED_AT, AUDIO_URL, SENTENCE_AUDIO_DATA
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(), ?, ?)
    `;

    const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: insertQuery,
        binds: [
          storyId,
          storyData.userId,
          storyData.title,
          storyData.storyText || storyData.content,
          JSON.stringify(storyData.vocabWords || storyData.vocabularyWords || []),
          JSON.stringify(storyData.vocabDefinitions || {}),
          storyData.audioUrl || null,
          JSON.stringify(storyData.sentenceAudioData || storyData.sentenceAudioUrls || {})
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
