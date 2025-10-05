const { connection, setCorsHeaders } = require('../../_utils');

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
    const { userId } = req.query;
    const { word, definition, storyId } = req.body;
    
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

    // Add vocabulary word
    const insertQuery = `
      INSERT INTO USER_VOCABULARY (USER_ID, WORD, DEFINITION, STORY_ID, CREATED_AT)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP())
    `;

    await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: insertQuery,
        binds: [userId, word, definition, storyId],
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Error adding vocabulary:', err);
            reject(err);
          } else {
            resolve(rows);
          }
        }
      });
    });

    res.status(200).json({ 
      success: true, 
      message: 'Vocabulary word added successfully' 
    });

  } catch (error) {
    console.error('Error adding vocabulary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
