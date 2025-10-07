const { connection, setCorsHeaders, authenticateToken } = require('../../_utils');

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    console.log('📚 Fetching vocabulary with definitions for user:', userId);
      
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

      // Get vocabulary words from user_vocabulary table with definitions from STORIES
      let vocabularyQuery = `
        SELECT DISTINCT uv.WORD, uv.STORY_ID, uv.CREATED_AT, s.VOCAB_DEFINITIONS
        FROM user_vocabulary uv
        LEFT JOIN STORIES s ON uv.STORY_ID = s.STORY_ID
        WHERE uv.USER_ID = ?
        ORDER BY uv.CREATED_AT DESC
      `;

      const vocabulary = await new Promise((resolve, reject) => {
        connection.execute({
          sqlText: vocabularyQuery,
          binds: [userId],
          complete: (err, stmt, rows) => {
            if (err) {
              console.error('Error fetching vocabulary:', err);
              reject(err);
            } else {
              console.log('📚 Vocabulary with definitions query result:', rows.length, 'entries found');
              
              // Process vocabulary words from user_vocabulary table
              const allVocabulary = [];
              
              rows.forEach(row => {
                try {
                  // Parse VOCAB_DEFINITIONS from the story
                  let vocabDefinitions = {};
                  if (row.VOCAB_DEFINITIONS) {
                    try {
                      vocabDefinitions = JSON.parse(row.VOCAB_DEFINITIONS);
                    } catch (e) {
                      console.log('Could not parse definitions for story');
                    }
                  }
                  
                  // Create vocabulary entry for this word
                  let definitions = {
                    definition: `A vocabulary word from your stories`,
                    pronunciation: '',
                    partOfSpeech: '',
                    example: ''
                  };
                  
                  // Use the actual definition if it exists
                  if (vocabDefinitions[row.WORD]) {
                    definitions = vocabDefinitions[row.WORD];
                  }
                  
                  allVocabulary.push({
                    word: row.WORD,
                    definitions: definitions,
                    learnedDate: row.CREATED_AT,
                    storyId: row.STORY_ID
                  });
                } catch (e) {
                  console.error('Error parsing vocabulary data:', e);
                }
              });
              // Remove duplicates based on word
              const uniqueVocabulary = allVocabulary.filter((item, index, self) => 
                index === self.findIndex(t => t.word.toLowerCase() === item.word.toLowerCase())
              );

              resolve(uniqueVocabulary);
            }
          }
        });
      });

      res.status(200).json({ 
        success: true, 
        data: vocabulary 
      });

  } catch (error) {
    console.error('Error fetching vocabulary with definitions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
