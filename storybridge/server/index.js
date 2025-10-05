const express = require('express');
const cors = require('cors');
const snowflake = require('snowflake-sdk');
require('dotenv').config({ path: '../.env.local' });

const app = express();
const PORT = 5000;

// Enable CORS
app.use(cors({ 
  origin: 'http://localhost:3000',
  credentials: true
}));
// Increase body parser limit for large audio files
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Remove quotes from env variables
const cleanEnv = (str) => str ? str.replace(/^["']|["']$/g, '') : str;

// Snowflake connection configuration
const connectionConfig = {
  account: cleanEnv(process.env.REACT_APP_SNOWFLAKE_ACCOUNT),
  username: cleanEnv(process.env.REACT_APP_SNOWFLAKE_USER),
  password: cleanEnv(process.env.REACT_APP_SNOWFLAKE_PASSWORD),
  warehouse: cleanEnv(process.env.REACT_APP_SNOWFLAKE_WAREHOUSE),
  database: cleanEnv(process.env.REACT_APP_SNOWFLAKE_DATABASE),
  schema: cleanEnv(process.env.REACT_APP_SNOWFLAKE_SCHEMA),
  clientSessionKeepAlive: true,
  clientSessionKeepAliveHeartbeatFrequency: 3600
};

let connection = null;

// Connect to Snowflake
function connectToSnowflake() {
  return new Promise((resolve, reject) => {
    console.log('🔌 Connecting to Snowflake...');
    
    connection = snowflake.createConnection(connectionConfig);
    
    connection.connect((err, conn) => {
      if (err) {
        console.error('❌ Unable to connect:', err.message);
        reject(err);
      } else {
        console.log('✅ Connected to Snowflake!');
        resolve(conn);
      }
    });
  });
}

// Ensure connection is alive
async function ensureConnection() {
  if (!connection || !connection.isUp()) {
    console.log('⚠️  Reconnecting to Snowflake...');
    await connectToSnowflake();
  }
  return connection;
}

// Execute query
async function executeQuery(sqlText) {
  const conn = await ensureConnection();
  
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText: sqlText,
      complete: (err, stmt, rows) => {
        if (err) {
          console.error('❌ Query failed:', err.message);
          reject(err);
        } else {
          console.log('✅ Query success');
          resolve(rows || []);
        }
      }
    });
  });
}

// === API ROUTES ===

app.post('/api/stories', async (req, res) => {
  try {
    console.log('📝 Saving story...');
    console.log('Request body:', req.body);
    const { userId, storyText, audioUrl, interests, vocabWords, childName, age, vocabDefinitions } = req.body;
    
    const escapedStory = storyText.replace(/'/g, "''");
    const escapedAudioUrl = (audioUrl || '').replace(/'/g, "''");
    const escapedChildName = (childName || '').replace(/'/g, "''");
    const escapedVocabDefinitions = vocabDefinitions ? JSON.stringify(vocabDefinitions).replace(/'/g, "''") : '';
    
    // Audio will be generated on-demand to avoid payload size issues
    console.log('📝 Saving story without audio (audio will be generated on-demand)');
    
    const sql = `
      INSERT INTO stories (USER_ID, STORY_TEXT, AUDIO_URL, INTERESTS, VOCAB_WORDS, VOCAB_DEFINITIONS, CREATED_AT) 
      VALUES ('${userId}', '${escapedStory}', '${escapedAudioUrl}', '${interests.join(',')}', '${vocabWords.join(',')}', '${escapedVocabDefinitions}', CURRENT_TIMESTAMP)
    `;
    
    console.log('SQL Query:', sql);
    console.log('Data being saved:', { userId, storyText: storyText.substring(0, 100) + '...', interests, vocabWords, childName, age });
    
    try {
      await executeQuery(sql);
      console.log('✅ Story saved successfully!\n');
      
      // Get the storyId of the newly created story
      const getStoryIdSql = `SELECT STORY_ID FROM stories WHERE USER_ID = '${userId}' ORDER BY CREATED_AT DESC LIMIT 1`;
      const storyRows = await executeQuery(getStoryIdSql);
      const storyId = storyRows[0]?.STORY_ID;
      
      res.json({ 
        success: true, 
        message: 'Story saved successfully',
        storyId: storyId
      });
    } catch (sqlError) {
      console.error('❌ SQL Error:', sqlError.message);
      console.error('SQL Query that failed:', sql);
      res.status(500).json({ error: `Database error: ${sqlError.message}` });
      return;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stories/:userId', async (req, res) => {
  try {
    console.log('📖 Loading stories...');
    
    const sql = `
      SELECT * FROM stories 
      WHERE USER_ID = '${req.params.userId}' 
      ORDER BY CREATED_AT DESC
    `;
    
    const rows = await executeQuery(sql);
    console.log('✅ Found', rows.length, 'stories\n');
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/story/:storyId', async (req, res) => {
  try {
    const sql = `SELECT * FROM stories WHERE STORY_ID = '${req.params.storyId}'`;
    const rows = await executeQuery(sql);
    res.json({ success: true, data: rows[0] || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate and store audio for a story
app.post('/api/story/:storyId/generate-audio', async (req, res) => {
  try {
    console.log('🎵 Generating audio for story:', req.params.storyId);
    
    // Get story text from database
    const storySql = `SELECT STORY_TEXT FROM stories WHERE STORY_ID = '${req.params.storyId}'`;
    const storyRows = await executeQuery(storySql);
    
    if (!storyRows[0] || !storyRows[0].STORY_TEXT) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    const storyText = storyRows[0].STORY_TEXT;
    console.log('Story text length:', storyText.length, 'characters');
    
    // Check if audio already exists
    const audioCheckSql = `SELECT AUDIO_DATA FROM stories WHERE STORY_ID = '${req.params.storyId}' AND AUDIO_DATA IS NOT NULL`;
    const audioRows = await executeQuery(audioCheckSql);
    
    if (audioRows[0] && audioRows[0].AUDIO_DATA) {
      console.log('✅ Audio already exists for this story');
      return res.json({ success: true, message: 'Audio already exists' });
    }
    
    // Generate audio using ElevenLabs (this will use credits)
    const { convertTextToSpeech } = require('./elevenLabsService');
    const audioBlob = await convertTextToSpeech(storyText);
    
    // Convert blob to base64 for storage (safer approach)
    const audioBuffer = Buffer.from(await audioBlob.arrayBuffer());
    const base64Audio = audioBuffer.toString('base64');
    
    // Store audio as base64 string in database (avoiding binary issues)
    const escapedAudio = base64Audio.replace(/'/g, "''");
    const updateSql = `UPDATE stories SET AUDIO_DATA = '${escapedAudio}' WHERE STORY_ID = '${req.params.storyId}'`;
    await executeQuery(updateSql);
    
    console.log('✅ Audio generated and stored successfully, size:', audioBuffer.length, 'bytes, base64 length:', base64Audio.length, 'characters');
    res.json({ success: true, message: 'Audio generated and stored successfully' });
    
  } catch (error) {
    console.error('❌ Error generating audio:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get audio data for a story
app.get('/api/story/:storyId/audio', async (req, res) => {
  try {
    const sql = `SELECT AUDIO_DATA FROM stories WHERE STORY_ID = '${req.params.storyId}'`;
    const rows = await executeQuery(sql);
    
    if (!rows[0] || !rows[0].AUDIO_DATA) {
      return res.status(404).json({ error: 'Audio not found' });
    }
    
    // Convert base64 string back to buffer
    const base64Audio = rows[0].AUDIO_DATA;
    const audioBuffer = Buffer.from(base64Audio, 'base64');
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate', // Always fetch from database
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.send(audioBuffer);
  } catch (error) {
    console.error('Error retrieving audio:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    snowflake: connection && connection.isUp() ? 'connected' : 'disconnected'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// === START SERVER ===

console.log('Starting server...');

// Start Express FIRST
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Server running on http://localhost:' + PORT);
  console.log('='.repeat(50) + '\n');
  
  // THEN connect to Snowflake
  connectToSnowflake()
    .then(() => {
      console.log('📊 Account:', connection.getAccount());
      console.log('👤 User:', connection.getUsername());
      console.log('\n✅ Ready to accept requests!\n');
    })
    .catch(err => {
      console.error('❌ Snowflake connection failed:', err.message);
      console.log('⚠️  Server running but Snowflake unavailable\n');
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  if (connection) {
    connection.destroy(() => {
      console.log('✅ Connection closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});