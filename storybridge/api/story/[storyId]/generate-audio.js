const { connection, setCorsHeaders } = require('../../_utils');

// Import ElevenLabs service (we'll need to create this)
const { convertTextToSpeech } = require('../../elevenLabsService');

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
    const { storyId } = req.query;
    console.log('🎵 Generating sentence-based audio for story:', storyId);
    
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

    // Get story text from database
    const storySql = `SELECT STORY_TEXT FROM stories WHERE STORY_ID = ?`;
    const storyResult = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: storySql,
        binds: [storyId],
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Error fetching story:', err);
            reject(err);
          } else {
            resolve(rows);
          }
        }
      });
    });
    
    if (!storyResult[0] || !storyResult[0].STORY_TEXT) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    const storyText = storyResult[0].STORY_TEXT;
    console.log('Story text length:', storyText.length, 'characters');
    
    // Always regenerate to fix any corrupted data
    console.log('🔄 Regenerating sentence audio (clearing any existing data)...');
    
    // Clear any existing sentence audio data first
    const clearSql = `UPDATE stories SET SENTENCE_AUDIO_DATA = NULL WHERE STORY_ID = ?`;
    await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: clearSql,
        binds: [storyId],
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Error clearing existing audio:', err);
            reject(err);
          } else {
            console.log('✅ Cleared existing sentence audio data');
            resolve(rows);
          }
        }
      });
    });
    
    // Split story into sentences
    const sentences = splitIntoSentences(storyText);
    console.log('Split into', sentences.length, 'sentences');
    
    // Generate combined audio using ElevenLabs (this will use credits)
    const combinedAudioBlob = await convertTextToSpeech(storyText);
    
    // Convert combined audio to buffer for processing
    const combinedAudioBuffer = Buffer.from(await combinedAudioBlob.arrayBuffer());
    
    // For now, we'll store the combined audio and split it on the client side
    // In a production system, you'd want to use ffmpeg or similar to split server-side
    const base64CombinedAudio = combinedAudioBuffer.toString('base64');
    
    // Create sentence audio data structure
    const sentenceAudioData = {
      combinedAudio: base64CombinedAudio,
      sentences: sentences,
      sentenceCount: sentences.length,
      totalDuration: null // Will be calculated on client side
    };
    
    // Store sentence audio data as JSON string
    const jsonString = JSON.stringify(sentenceAudioData);
    console.log('💾 Storing sentence audio data, JSON length:', jsonString.length);
    
    // Use a more robust approach - store as base64 encoded JSON to avoid SQL injection and character issues
    const base64Json = Buffer.from(jsonString, 'utf8').toString('base64');
    const updateSql = `UPDATE stories SET SENTENCE_AUDIO_DATA = ? WHERE STORY_ID = ?`;
    
    await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: updateSql,
        binds: [base64Json, storyId],
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Error updating sentence audio:', err);
            reject(err);
          } else {
            resolve(rows);
          }
        }
      });
    });
    
    console.log('✅ Sentence audio data stored successfully');
    console.log('✅ Sentence audio generated and stored successfully, combined size:', combinedAudioBuffer.length, 'bytes');
    
    res.json({ 
      success: true, 
      message: 'Sentence audio generated and stored successfully',
      sentenceCount: sentences.length 
    });
    
  } catch (error) {
    console.error('❌ Error generating sentence audio:', error);
    res.status(500).json({ error: error.message });
  }
}

// Helper function to split text into sentences
function splitIntoSentences(text) {
  // Simple sentence splitting - you might want to improve this
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const lastMatch = sentences.join('');
  const remaining = text.slice(lastMatch.length).trim();
  if (remaining) {
    sentences.push(remaining);
  }
  return sentences.length > 0 ? sentences : [text];
}
