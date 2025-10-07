const { connection, setCorsHeaders } = require('../../_utils');

export default async function handler(req, res) {
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

    // Delete story
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
            resolve(rows);
          }
        }
      });
    });

    res.status(200).json({ 
      success: true, 
      message: 'Story deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
