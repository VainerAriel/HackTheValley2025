const { connection, setCorsHeaders, authenticateToken } = require('../../_utils');

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate token
  authenticateToken(req, res, async () => {
    try {
      const userId = req.user.sub;
      
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

      if (req.method === 'GET') {
        // Get user profile
        const selectQuery = `
          SELECT USER_ID, CHILD_NAME, CHILD_AGE, CHILD_PRONOUNS, INTERESTS, CREATED_AT, UPDATED_AT
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
                    childAge: row.CHILD_AGE,
                    childPronouns: row.CHILD_PRONOUNS,
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

      } else if (req.method === 'PUT') {
        // Update user profile
        const { childName, childAge, childPronouns, interests } = req.body;
        
        console.log('Profile update data:', { childName, childAge, childPronouns, interests });
        
        // Update or insert user profile
        const upsertQuery = `
          MERGE INTO USER_PROFILES AS target
          USING (SELECT ? AS USER_ID, ? AS CHILD_NAME, ? AS CHILD_AGE, ? AS CHILD_PRONOUNS, ? AS INTERESTS, CURRENT_TIMESTAMP() AS UPDATED_AT) AS source
          ON target.USER_ID = source.USER_ID
          WHEN MATCHED THEN
            UPDATE SET 
              CHILD_NAME = source.CHILD_NAME,
              CHILD_AGE = source.CHILD_AGE,
              CHILD_PRONOUNS = source.CHILD_PRONOUNS,
              INTERESTS = source.INTERESTS,
              UPDATED_AT = source.UPDATED_AT
          WHEN NOT MATCHED THEN
            INSERT (USER_ID, CHILD_NAME, CHILD_AGE, CHILD_PRONOUNS, INTERESTS, CREATED_AT, UPDATED_AT)
            VALUES (source.USER_ID, source.CHILD_NAME, source.CHILD_AGE, source.CHILD_PRONOUNS, source.INTERESTS, source.UPDATED_AT, source.UPDATED_AT)
        `;

        await new Promise((resolve, reject) => {
          connection.execute({
            sqlText: upsertQuery,
            binds: [
              userId, 
              childName || '', 
              childAge || '', 
              childPronouns || '', 
              JSON.stringify(interests || [])
            ],
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
      }

    } catch (error) {
      console.error('Error with profile operation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
