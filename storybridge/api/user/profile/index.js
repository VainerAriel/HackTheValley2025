const { connection, setCorsHeaders, authenticateToken } = require('../../_utils');

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate token
  authenticateToken(req, res, async () => {
    try {
      const userId = req.user.sub;
      
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

      // Get user profile
      const selectQuery = `
        SELECT USER_ID, CHILD_NAME, AGE, INTERESTS, CREATED_AT, UPDATED_AT
        FROM USER_PROFILES 
        WHERE USER_ID = ?
      `;

      const result = await new Promise((resolve, reject) => {
        connection.execute({
          sqlText: selectQuery,
          binds: [userId],
          complete: (err, stmt, rows) => {
            if (err) {
              console.error('Error fetching profile:', err);
              reject(err);
            } else {
              if (rows.length === 0) {
                resolve(null);
              } else {
                const row = rows[0];
                const profile = {
                  userId: row.USER_ID,
                  childName: row.CHILD_NAME,
                  age: row.AGE,
                  interests: JSON.parse(row.INTERESTS || '[]'),
                  createdAt: row.CREATED_AT,
                  updatedAt: row.UPDATED_AT
                };
                resolve(profile);
              }
            }
          }
        });
      });

      res.status(200).json({ 
        success: true, 
        data: result 
      });

    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
