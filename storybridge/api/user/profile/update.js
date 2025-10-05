const { connection, setCorsHeaders, authenticateToken } = require('../../_utils');

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate token
  authenticateToken(req, res, async () => {
    try {
      const userId = req.user.sub;
      const { childName, age, interests } = req.body;
      
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

      // Update or insert user profile
      const upsertQuery = `
        MERGE INTO USER_PROFILES AS target
        USING (SELECT ? AS USER_ID, ? AS CHILD_NAME, ? AS AGE, ? AS INTERESTS, CURRENT_TIMESTAMP() AS UPDATED_AT) AS source
        ON target.USER_ID = source.USER_ID
        WHEN MATCHED THEN
          UPDATE SET 
            CHILD_NAME = source.CHILD_NAME,
            AGE = source.AGE,
            INTERESTS = source.INTERESTS,
            UPDATED_AT = source.UPDATED_AT
        WHEN NOT MATCHED THEN
          INSERT (USER_ID, CHILD_NAME, AGE, INTERESTS, CREATED_AT, UPDATED_AT)
          VALUES (source.USER_ID, source.CHILD_NAME, source.AGE, source.INTERESTS, source.UPDATED_AT, source.UPDATED_AT)
      `;

      await new Promise((resolve, reject) => {
        connection.execute({
          sqlText: upsertQuery,
          binds: [userId, childName, age, JSON.stringify(interests || [])],
          complete: (err, stmt, rows) => {
            if (err) {
              console.error('Error updating profile:', err);
              reject(err);
            } else {
              resolve(rows);
            }
          }
        });
      });

      res.status(200).json({ 
        success: true, 
        message: 'Profile updated successfully' 
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
