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
app.use(express.json());

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
    const { userId, storyText, audioUrl, interests, vocabWords } = req.body;
    
    const escapedStory = storyText.replace(/'/g, "''");
    const escapedAudioUrl = (audioUrl || '').replace(/'/g, "''");
    
    const sql = `
      INSERT INTO stories (user_id, story_text, audio_url, interests, vocab_words) 
      VALUES ('${userId}', '${escapedStory}', '${escapedAudioUrl}', '${interests.join(',')}', '${vocabWords.join(',')}')
    `;
    
    await executeQuery(sql);
    console.log('✅ Story saved!\n');
    
    res.json({ success: true });
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
      WHERE user_id = '${req.params.userId}' 
      ORDER BY created_at DESC
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
    const sql = `SELECT * FROM stories WHERE story_id = '${req.params.storyId}'`;
    const rows = await executeQuery(sql);
    res.json({ success: true, data: rows[0] || null });
  } catch (error) {
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