const { connection, setCorsHeaders } = require('../../_utils');

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'DELETE') {
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

    // First, delete related vocabulary words
    const deleteVocabQuery = `DELETE FROM user_vocabulary WHERE STORY_ID = ?`;
    
    await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: deleteVocabQuery,
        binds: [storyId],
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Error deleting vocabulary words:', err);
            reject(err);
          } else {
            console.log('✅ Deleted vocabulary words for story:', storyId);
            resolve(rows);
          }
        }
      });
    });

    // Then delete the story
    const deleteQuery = `DELETE FROM STORIES WHERE STORY_ID = ?`;

    await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: deleteQuery,
        binds: [storyId],
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Error deleting story:', err);
            reject(err);
          } else {
            console.log('✅ Deleted story:', storyId);
            resolve(rows);
          }
        }
      });
    });

    res.status(200).json({ 
      success: true, 
      message: 'Story and related vocabulary words deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
