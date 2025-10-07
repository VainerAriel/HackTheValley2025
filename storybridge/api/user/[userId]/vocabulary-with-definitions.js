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

      // Get vocabulary words from USER_VOCABULARY and their definitions from STORIES
      const vocabularyQuery = `
        SELECT DISTINCT uv.WORD, uv.CREATED_AT, uv.STORY_ID, s.VOCAB_DEFINITIONS
        FROM USER_VOCABULARY uv
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
              console.log('📚 Vocabulary with definitions query result:', rows.length, 'words found');
              
              // Process vocabulary words from USER_VOCABULARY with definitions from STORIES
              const allVocabulary = [];
              
              rows.forEach(row => {
                try {
                  if (row.WORD) {
                    let definitions = {
                      definition: `A vocabulary word from your stories`,
                      pronunciation: '',
                      partOfSpeech: '',
                      example: ''
                    };
                    
                    // Get the definition from the story's VOCAB_DEFINITIONS
                    if (row.VOCAB_DEFINITIONS) {
                      try {
                        const storyDefinitions = JSON.parse(row.VOCAB_DEFINITIONS);
                        
                        // Look for the word in the definitions (try different case variations)
                        const wordKey = row.WORD.toLowerCase();
                        const wordDefinition = storyDefinitions[wordKey] || 
                                             storyDefinitions[row.WORD] ||
                                             storyDefinitions[wordKey.charAt(0).toUpperCase() + wordKey.slice(1)];
                        
                        if (wordDefinition) {
                          definitions = wordDefinition;
                        }
                      } catch (e) {
                        console.log('Could not parse definitions for word:', row.WORD);
                      }
                    }
                    
                    allVocabulary.push({
                      word: row.WORD,
                      definitions: definitions,
                      learnedDate: row.CREATED_AT,
                      storyId: row.STORY_ID
                    });
                  }
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
