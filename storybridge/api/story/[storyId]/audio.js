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

    // First try to get sentence audio data
    const sentenceSql = `SELECT SENTENCE_AUDIO_DATA FROM stories WHERE STORY_ID = ?`;
    const sentenceResult = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: sentenceSql,
        binds: [storyId],
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Error fetching sentence audio:', err);
            reject(err);
          } else {
            resolve(rows);
          }
        }
      });
    });
    
    if (sentenceResult[0] && sentenceResult[0].SENTENCE_AUDIO_DATA && sentenceResult[0].SENTENCE_AUDIO_DATA.length > 10) {
      // Extract combined audio from sentence data
      const decodedJson = Buffer.from(sentenceResult[0].SENTENCE_AUDIO_DATA, 'base64').toString('utf8');
      
      // Check if decoded JSON is valid
      if (decodedJson.length > 10) {
        let sentenceAudioData;
        try {
          sentenceAudioData = JSON.parse(decodedJson);
          
          if (sentenceAudioData && sentenceAudioData.combinedAudio) {
            const audioBuffer = Buffer.from(sentenceAudioData.combinedAudio, 'base64');
            
            res.set({
              'Content-Type': 'audio/mpeg',
              'Content-Length': audioBuffer.length,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            });
            
            res.send(audioBuffer);
            return;
          }
        } catch (parseError) {
          console.error('❌ Audio endpoint - JSON parsing error:', parseError.message);
          console.error('❌ Audio endpoint - Invalid JSON content:', decodedJson);
          // Fall through to old audio data
        }
      } else {
      }
    }
    
    // Fallback to old AUDIO_DATA column
    const sql = `SELECT AUDIO_DATA FROM stories WHERE STORY_ID = ?`;
    const result = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: sql,
        binds: [storyId],
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Error fetching audio:', err);
            reject(err);
          } else {
            resolve(rows);
          }
        }
      });
    });
    
    if (!result[0] || !result[0].AUDIO_DATA) {
      return res.status(404).json({ error: 'Audio not found' });
    }
    
    // Convert base64 string back to buffer
    const base64Audio = result[0].AUDIO_DATA;
    const audioBuffer = Buffer.from(base64Audio, 'base64');
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.send(audioBuffer);
  } catch (error) {
    console.error('Error retrieving audio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
