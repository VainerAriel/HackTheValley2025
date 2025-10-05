const express = require('express');
const cors = require('cors');
const snowflake = require('snowflake-sdk');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
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

// Auth0 JWT verification setup
const client = jwksClient({
  jwksUri: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Auth0 middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, getKey, {
    audience: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/`,
    issuer: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      console.error('JWT verification failed:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

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
    
    const escapedTitle = (req.body.title || 'Adventure Story').replace(/'/g, "''");
    
    const sql = `
      INSERT INTO stories (USER_ID, STORY_TEXT, STORY_TITLE, AUDIO_URL, INTERESTS, VOCAB_WORDS, VOCAB_DEFINITIONS, CREATED_AT) 
      VALUES ('${userId}', '${escapedStory}', '${escapedTitle}', '${escapedAudioUrl}', '${interests.join(',')}', '${vocabWords.join(',')}', '${escapedVocabDefinitions}', CURRENT_TIMESTAMP)
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
      
      // Add vocabulary words to user vocabulary tracking table
      if (vocabWords && vocabWords.length > 0 && storyId) {
        console.log('📚 Adding vocabulary words to tracking table...');
        const vocabInsertPromises = vocabWords.map(word => {
          const escapedWord = word.replace(/'/g, "''");
          const vocabSql = `
            INSERT INTO user_vocabulary (USER_ID, WORD, STORY_ID) 
            VALUES ('${userId}', '${escapedWord}', '${storyId}')
          `;
          return executeQuery(vocabSql);
        });
        
        await Promise.all(vocabInsertPromises);
        console.log('✅ Vocabulary words added to tracking table');
      }
      
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
    const userId = decodeURIComponent(req.params.userId);
    console.log('📖 Loading stories...');
    
    const sql = `
      SELECT * FROM stories 
      WHERE USER_ID = '${userId}' 
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

app.delete('/api/story/:storyId', async (req, res) => {
  console.log('🔥 DELETE route hit for storyId:', req.params.storyId);
  try {
    console.log('🗑️ Deleting story:', req.params.storyId);
    
    // First, get the story to find the user ID for vocabulary cleanup
    const getStorySql = `SELECT USER_ID FROM stories WHERE STORY_ID = '${req.params.storyId}'`;
    const storyRows = await executeQuery(getStorySql);
    
    if (storyRows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    const userId = storyRows[0].USER_ID;
    
    // Remove vocabulary words associated with this story
    console.log('🗑️ Removing vocabulary words for story:', req.params.storyId);
    const vocabDeleteSql = `
      DELETE FROM user_vocabulary 
      WHERE STORY_ID = '${req.params.storyId}'
    `;
    await executeQuery(vocabDeleteSql);
    console.log('✅ Vocabulary words removed for story');
    
    // Delete the story
    const sql = `DELETE FROM stories WHERE STORY_ID = '${req.params.storyId}'`;
    await executeQuery(sql);
    
    console.log('✅ Story deleted successfully');
    res.json({ success: true, message: 'Story deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting story:', error);
    res.status(500).json({ error: error.message });
  }
});

// Utility function to split text into sentences
function splitIntoSentences(text) {
  // Split by sentence endings, keeping the punctuation
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const lastMatch = sentences.join('');
  const remaining = text.slice(lastMatch.length).trim();
  if (remaining) {
    sentences.push(remaining);
  }
  return sentences.length > 0 ? sentences : [text];
}

// Generate and store sentence-based audio for a story
app.post('/api/story/:storyId/generate-audio', async (req, res) => {
  try {
    console.log('🎵 Generating sentence-based audio for story:', req.params.storyId);
    
    // Get story text from database
    const storySql = `SELECT STORY_TEXT FROM stories WHERE STORY_ID = '${req.params.storyId}'`;
    const storyRows = await executeQuery(storySql);
    
    if (!storyRows[0] || !storyRows[0].STORY_TEXT) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    const storyText = storyRows[0].STORY_TEXT;
    console.log('Story text length:', storyText.length, 'characters');
    
    // Check if sentence audio already exists (allow force regeneration with ?force=true)
    const forceRegenerate = req.query.force === 'true';
    if (!forceRegenerate) {
      const audioCheckSql = `SELECT SENTENCE_AUDIO_DATA FROM stories WHERE STORY_ID = '${req.params.storyId}' AND SENTENCE_AUDIO_DATA IS NOT NULL`;
      const audioRows = await executeQuery(audioCheckSql);
      
      if (audioRows[0] && audioRows[0].SENTENCE_AUDIO_DATA) {
        console.log('✅ Sentence audio already exists for this story');
        return res.json({ success: true, message: 'Sentence audio already exists' });
      }
    } else {
      console.log('🔄 Force regenerating sentence audio...');
    }
    
    // Split story into sentences
    const sentences = splitIntoSentences(storyText);
    console.log('Split into', sentences.length, 'sentences');
    
    // Generate combined audio using ElevenLabs (this will use credits)
    const { convertTextToSpeech } = require('./elevenLabsService');
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
    const updateSql = `UPDATE stories SET SENTENCE_AUDIO_DATA = '${base64Json}' WHERE STORY_ID = '${req.params.storyId}'`;
    console.log('📝 Update SQL length:', updateSql.length);
    await executeQuery(updateSql);
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
});

// Get sentence audio data for a story
app.get('/api/story/:storyId/sentence-audio', async (req, res) => {
  try {
    console.log('🔍 Retrieving sentence audio for story:', req.params.storyId);
    const sql = `SELECT SENTENCE_AUDIO_DATA FROM stories WHERE STORY_ID = '${req.params.storyId}'`;
    const rows = await executeQuery(sql);
    
    console.log('📊 Query result:', rows.length, 'rows found');
    console.log('📊 First row data:', rows[0] ? Object.keys(rows[0]) : 'No rows');
    
    if (!rows[0]) {
      console.log('❌ No story found with ID:', req.params.storyId);
      return res.status(404).json({ error: 'Story not found' });
    }
    
    if (!rows[0].SENTENCE_AUDIO_DATA) {
      console.log('❌ No sentence audio data found for story:', req.params.storyId);
      return res.status(404).json({ error: 'Sentence audio not found' });
    }
    
    console.log('✅ Sentence audio data found, length:', rows[0].SENTENCE_AUDIO_DATA.length);
    
    // Decode base64 JSON and parse the sentence audio data
    const decodedJson = Buffer.from(rows[0].SENTENCE_AUDIO_DATA, 'base64').toString('utf8');
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
});

// Clear sentence audio data for a story
app.post('/api/story/:storyId/clear-sentence-audio', async (req, res) => {
  try {
    console.log('🗑️ Clearing sentence audio for story:', req.params.storyId);
    const updateSql = `UPDATE stories SET SENTENCE_AUDIO_DATA = NULL WHERE STORY_ID = '${req.params.storyId}'`;
    await executeQuery(updateSql);
    console.log('✅ Sentence audio cleared successfully');
    res.json({ success: true, message: 'Sentence audio cleared successfully' });
  } catch (error) {
    console.error('❌ Error clearing sentence audio:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get combined audio data for a story (fallback for compatibility)
app.get('/api/story/:storyId/audio', async (req, res) => {
  try {
    // First try to get sentence audio data
    const sentenceSql = `SELECT SENTENCE_AUDIO_DATA FROM stories WHERE STORY_ID = '${req.params.storyId}'`;
    const sentenceRows = await executeQuery(sentenceSql);
    
    if (sentenceRows[0] && sentenceRows[0].SENTENCE_AUDIO_DATA) {
      // Extract combined audio from sentence data
      const decodedJson = Buffer.from(sentenceRows[0].SENTENCE_AUDIO_DATA, 'base64').toString('utf8');
      const sentenceAudioData = JSON.parse(decodedJson);
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
    
    // Fallback to old AUDIO_DATA column
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
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.send(audioBuffer);
  } catch (error) {
    console.error('Error retrieving audio:', error);
    res.status(500).json({ error: error.message });
  }
});

// User profile endpoints (using Snowflake database)
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    console.log('📋 Getting user profile for:', userId);
    
    // Check if user profile exists in database
    const checkSql = `SELECT * FROM user_profiles WHERE USER_ID = '${userId}'`;
    const existingProfiles = await executeQuery(checkSql);
    
    if (existingProfiles.length > 0) {
      const profile = existingProfiles[0];
      res.json({
        success: true,
        data: {
          childName: profile.CHILD_NAME || '',
          childAge: profile.CHILD_AGE || '',
          childPronouns: profile.CHILD_PRONOUNS || '',
          interests: profile.INTERESTS ? profile.INTERESTS.split(',') : [],
          profileCompleted: profile.PROFILE_COMPLETED === 'true' || profile.PROFILE_COMPLETED === true
        }
      });
    } else {
      // No profile found, return empty data
      res.json({
        success: true,
        data: {
          childName: '',
          childAge: '',
          childPronouns: '',
          interests: [],
          profileCompleted: false
        }
      });
    }
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { childName, childAge, childPronouns, interests, profileCompleted } = req.body;
    
    console.log('💾 Updating user profile for:', userId);
    console.log('Profile data:', { childName, childAge, childPronouns, interests, profileCompleted });
    
    // Escape data for SQL
    const escapedChildName = (childName || '').replace(/'/g, "''");
    const escapedChildAge = (childAge || '').replace(/'/g, "''");
    const escapedChildPronouns = (childPronouns || '').replace(/'/g, "''");
    const escapedInterests = (interests || []).join(',').replace(/'/g, "''");
    
    // Check if profile exists
    const checkSql = `SELECT USER_ID FROM user_profiles WHERE USER_ID = '${userId}'`;
    const existingProfiles = await executeQuery(checkSql);
    
    if (existingProfiles.length > 0) {
      // Update existing profile
      const updateSql = `
        UPDATE user_profiles 
        SET CHILD_NAME = '${escapedChildName}',
            CHILD_AGE = '${escapedChildAge}',
            CHILD_PRONOUNS = '${escapedChildPronouns}',
            INTERESTS = '${escapedInterests}',
            PROFILE_COMPLETED = '${profileCompleted || false}',
            UPDATED_AT = CURRENT_TIMESTAMP
        WHERE USER_ID = '${userId}'
      `;
      await executeQuery(updateSql);
    } else {
      // Create new profile
      const insertSql = `
        INSERT INTO user_profiles (USER_ID, CHILD_NAME, CHILD_AGE, CHILD_PRONOUNS, INTERESTS, PROFILE_COMPLETED, CREATED_AT, UPDATED_AT)
        VALUES ('${userId}', '${escapedChildName}', '${escapedChildAge}', '${escapedChildPronouns}', '${escapedInterests}', '${profileCompleted || false}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      await executeQuery(insertSql);
    }
    
    console.log('✅ User profile updated successfully');
    res.json({ 
      success: true, 
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create user_profiles table if it doesn't exist
app.post('/api/setup-database', async (req, res) => {
  try {
    console.log('🗄️ Setting up user_profiles table...');
    
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS user_profiles (
        USER_ID VARCHAR(255) PRIMARY KEY,
        CHILD_NAME VARCHAR(255),
        CHILD_AGE VARCHAR(10),
        CHILD_PRONOUNS VARCHAR(50),
        INTERESTS TEXT,
        PROFILE_COMPLETED BOOLEAN DEFAULT FALSE,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await executeQuery(createTableSql);
    console.log('✅ user_profiles table created successfully');
    
    // Create user_vocabulary table for tracking used vocabulary words
    const createVocabTableSql = `
      CREATE TABLE IF NOT EXISTS user_vocabulary (
        VOCAB_ID VARCHAR(255) PRIMARY KEY DEFAULT UUID_STRING(),
        USER_ID VARCHAR(255) NOT NULL,
        WORD VARCHAR(255) NOT NULL,
        STORY_ID VARCHAR(255),
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await executeQuery(createVocabTableSql);
    console.log('✅ user_vocabulary table created successfully');
    
    res.json({ 
      success: true, 
      message: 'Database setup completed successfully' 
    });
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add STORY_TITLE column to stories table if it doesn't exist
app.post('/api/migrate-stories-title', async (req, res) => {
  try {
    console.log('🔄 Adding STORY_TITLE column to stories table...');
    
    // Check if STORY_TITLE column exists
    const checkColumnSql = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'STORIES' 
      AND COLUMN_NAME = 'STORY_TITLE'
    `;
    
    const columnExists = await executeQuery(checkColumnSql);
    
    if (columnExists.length === 0) {
      console.log('📋 Adding STORY_TITLE column...');
      
      const addTitleColumnSql = `
        ALTER TABLE stories 
        ADD COLUMN STORY_TITLE VARCHAR(255) DEFAULT 'Adventure Story'
      `;
      
      await executeQuery(addTitleColumnSql);
      
      console.log('✅ STORY_TITLE column added successfully');
    } else {
      console.log('✅ STORY_TITLE column already exists');
    }
    
    res.json({ 
      success: true, 
      message: 'Stories table migration completed successfully' 
    });
  } catch (error) {
    console.error('❌ Error migrating stories table:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add SENTENCE_AUDIO_DATA column to stories table for sentence-based audio
app.post('/api/migrate-sentence-audio', async (req, res) => {
  try {
    console.log('🔄 Adding SENTENCE_AUDIO_DATA column to stories table...');
    
    // Check if SENTENCE_AUDIO_DATA column exists
    const checkColumnSql = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'STORIES' 
      AND COLUMN_NAME = 'SENTENCE_AUDIO_DATA'
    `;
    
    const columnExists = await executeQuery(checkColumnSql);
    
    if (columnExists.length === 0) {
      console.log('📋 Adding SENTENCE_AUDIO_DATA column...');
      
      const addSentenceAudioColumnSql = `
        ALTER TABLE stories 
        ADD COLUMN SENTENCE_AUDIO_DATA TEXT
      `;
      
      await executeQuery(addSentenceAudioColumnSql);
      
      console.log('✅ SENTENCE_AUDIO_DATA column added successfully');
    } else {
      console.log('✅ SENTENCE_AUDIO_DATA column already exists');
    }
    
    res.json({ 
      success: true, 
      message: 'Sentence audio migration completed successfully' 
    });
  } catch (error) {
    console.error('❌ Error migrating sentence audio column:', error);
    res.status(500).json({ error: error.message });
  }
});

// Migrate database from old schema to new schema
app.post('/api/migrate-database', async (req, res) => {
  try {
    console.log('🔄 Migrating database schema...');
    
    // Check if CHILD_GENDER column exists
    const checkColumnSql = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'USER_PROFILES' 
      AND COLUMN_NAME = 'CHILD_GENDER'
    `;
    
    const columnExists = await executeQuery(checkColumnSql);
    
    if (columnExists.length > 0) {
      console.log('📋 Found CHILD_GENDER column, migrating...');
      
      // Add new columns if they don't exist
      const addAgeColumnSql = `
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS CHILD_AGE VARCHAR(10)
      `;
      
      const addPronounsColumnSql = `
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS CHILD_PRONOUNS VARCHAR(50)
      `;
      
      await executeQuery(addAgeColumnSql);
      await executeQuery(addPronounsColumnSql);
      
      // Migrate data from CHILD_GENDER to CHILD_PRONOUNS
      const migrateDataSql = `
        UPDATE user_profiles 
        SET CHILD_PRONOUNS = CHILD_GENDER 
        WHERE CHILD_GENDER IS NOT NULL AND CHILD_PRONOUNS IS NULL
      `;
      
      await executeQuery(migrateDataSql);
      
      // Drop the old CHILD_GENDER column
      const dropColumnSql = `
        ALTER TABLE user_profiles 
        DROP COLUMN CHILD_GENDER
      `;
      
      await executeQuery(dropColumnSql);
      
      console.log('✅ Database migration completed successfully');
    } else {
      console.log('✅ No migration needed - database is already up to date');
    }
    
    res.json({ 
      success: true, 
      message: 'Database migration completed successfully' 
    });
  } catch (error) {
    console.error('❌ Error migrating database:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's used vocabulary words
app.get('/api/user/:userId/vocabulary', async (req, res) => {
  try {
    const userId = decodeURIComponent(req.params.userId);
    console.log('📚 Getting used vocabulary for user:', userId);
    
    const sql = `
      SELECT DISTINCT WORD 
      FROM user_vocabulary 
      WHERE USER_ID = '${userId}'
      ORDER BY WORD
    `;
    
    const rows = await executeQuery(sql);
    const usedWords = rows.map(row => row.WORD);
    
    console.log('✅ Found', usedWords.length, 'used vocabulary words');
    res.json({ success: true, data: usedWords });
  } catch (error) {
    console.error('❌ Error getting user vocabulary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add vocabulary words for a story
app.post('/api/user/:userId/vocabulary', async (req, res) => {
  try {
    const userId = decodeURIComponent(req.params.userId);
    const { words, storyId } = req.body;
    
    console.log('📝 Adding vocabulary words for user:', userId, 'story:', storyId);
    
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'Words array is required' });
    }
    
    // Insert each word into the vocabulary table
    const insertPromises = words.map(word => {
      const escapedWord = word.replace(/'/g, "''");
      const sql = `
        INSERT INTO user_vocabulary (USER_ID, WORD, STORY_ID) 
        VALUES ('${userId}', '${escapedWord}', '${storyId || null}')
      `;
      return executeQuery(sql);
    });
    
    await Promise.all(insertPromises);
    
    console.log('✅ Added', words.length, 'vocabulary words');
    res.json({ success: true, message: 'Vocabulary words added successfully' });
  } catch (error) {
    console.error('❌ Error adding vocabulary words:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove vocabulary words for a story
app.delete('/api/user/:userId/vocabulary/story/:storyId', async (req, res) => {
  try {
    const userId = decodeURIComponent(req.params.userId);
    const storyId = req.params.storyId;
    
    console.log('🗑️ Removing vocabulary words for user:', userId, 'story:', storyId);
    
    const sql = `
      DELETE FROM user_vocabulary 
      WHERE USER_ID = '${userId}' AND STORY_ID = '${storyId}'
    `;
    
    await executeQuery(sql);
    
    console.log('✅ Removed vocabulary words for story');
    res.json({ success: true, message: 'Vocabulary words removed successfully' });
  } catch (error) {
    console.error('❌ Error removing vocabulary words:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user stats (word count and story count)
app.get('/api/user/:userId/stats', async (req, res) => {
  try {
    const userId = decodeURIComponent(req.params.userId);
    console.log('📊 Getting user stats for:', userId);
    
    // Get vocabulary words list
    const vocabSql = `
      SELECT DISTINCT WORD 
      FROM user_vocabulary 
      WHERE USER_ID = '${userId}'
      ORDER BY WORD
    `;
    
    // Get stories list
    const storySql = `
      SELECT * FROM stories 
      WHERE USER_ID = '${userId}'
      ORDER BY CREATED_AT DESC
    `;
    
    const [vocabResult, storyResult] = await Promise.all([
      executeQuery(vocabSql),
      executeQuery(storySql)
    ]);
    
    const stats = {
      wordsLearned: vocabResult.length,
      storiesGenerated: storyResult.length
    };
    
    console.log('✅ User stats:', stats);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('❌ Error getting user stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's vocabulary words with definitions
app.get('/api/user/:userId/vocabulary-with-definitions', async (req, res) => {
  try {
    const userId = decodeURIComponent(req.params.userId);
    console.log('📚 Getting vocabulary with definitions for user:', userId);
    
    // Get vocabulary words and their associated story data
    const sql = `
      SELECT DISTINCT uv.WORD, s.VOCAB_DEFINITIONS, s.CREATED_AT
      FROM user_vocabulary uv
      LEFT JOIN stories s ON uv.STORY_ID = s.STORY_ID
      WHERE uv.USER_ID = '${userId}'
      ORDER BY s.CREATED_AT DESC, uv.WORD
    `;
    
    const rows = await executeQuery(sql);
    console.log('✅ Found', rows.length, 'vocabulary words with definitions');
    
    // Process the results to extract definitions
    const vocabularyWithDefinitions = rows.map(row => {
      let definitions = {};
      try {
        if (row.VOCAB_DEFINITIONS) {
          definitions = JSON.parse(row.VOCAB_DEFINITIONS);
        }
      } catch (error) {
        console.error('Error parsing definitions for word:', row.WORD, error);
      }
      
      return {
        word: row.WORD,
        definitions: definitions[row.WORD?.toLowerCase()] || {
          word: row.WORD,
          pronunciation: '',
          simple_definition: row.WORD,
          example_sentence: '',
          synonyms: []
        },
        learnedDate: row.CREATED_AT
      };
    });
    
    res.json({ success: true, data: vocabularyWithDefinitions });
  } catch (error) {
    console.error('❌ Error getting vocabulary with definitions:', error);
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

app.get('/api/test-delete', (req, res) => {
  res.json({ message: 'DELETE route test endpoint' });
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