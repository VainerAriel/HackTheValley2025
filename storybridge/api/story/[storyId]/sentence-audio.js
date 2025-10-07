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
    console.log('🔍 Retrieving sentence audio for story:', storyId);
    
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

    const sql = `SELECT SENTENCE_AUDIO_DATA FROM stories WHERE STORY_ID = ?`;
    const result = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: sql,
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
    
    console.log('📊 Query result:', result.length, 'rows found');
    
    if (!result[0]) {
      console.log('❌ No story found with ID:', storyId);
      return res.status(404).json({ error: 'Story not found' });
    }
    
    if (!result[0].SENTENCE_AUDIO_DATA) {
      console.log('❌ No sentence audio data found for story:', storyId);
      return res.status(404).json({ error: 'Sentence audio not found' });
    }
    
    console.log('✅ Sentence audio data found, length:', result[0].SENTENCE_AUDIO_DATA.length);
    
    // Decode base64 JSON and parse the sentence audio data
    const decodedJson = Buffer.from(result[0].SENTENCE_AUDIO_DATA, 'base64').toString('utf8');
    const sentenceAudioData = JSON.parse(decodedJson);
    console.log('✅ Decoded and parsed sentence audio data successfully');
    
    res.json({
      success: true,
      data: sentenceAudioData
    });
  } catch (error) {
    console.error('❌ Error retrieving sentence audio:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
}
