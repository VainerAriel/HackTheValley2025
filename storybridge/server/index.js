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

app.delete('/api/story/:storyId', async (req, res) => {
  console.log('🔥 DELETE route hit for storyId:', req.params.storyId);
  try {
    console.log('🗑️ Deleting story:', req.params.storyId);
    
    const sql = `DELETE FROM stories WHERE STORY_ID = '${req.params.storyId}'`;
    await executeQuery(sql);
    
    console.log('✅ Story deleted successfully');
    res.json({ success: true, message: 'Story deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting story:', error);
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