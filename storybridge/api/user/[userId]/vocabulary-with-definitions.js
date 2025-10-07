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

      // Get user vocabulary with definitions from stories
      const vocabularyQuery = `
        SELECT DISTINCT s.VOCAB_WORDS, s.VOCAB_DEFINITIONS, s.CREATED_AT
        FROM STORIES s
        WHERE s.USER_ID = ? 
        AND s.VOCAB_WORDS IS NOT NULL
        AND s.VOCAB_DEFINITIONS IS NOT NULL
        ORDER BY s.CREATED_AT DESC
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
              console.log('📚 Vocabulary with definitions query result:', rows.length, 'stories found');
              
              // Combine all vocabulary words and definitions from all stories
              const allVocabulary = [];
              
              rows.forEach(row => {
                try {
                  // Handle both JSON and comma-separated formats
                  let vocabWords = [];
                  let vocabDefinitions = {};
                  
                  // Parse VOCAB_WORDS
                  if (row.VOCAB_WORDS) {
                    try {
                      vocabWords = JSON.parse(row.VOCAB_WORDS);
                    } catch (e) {
                      vocabWords = row.VOCAB_WORDS.split(',').map(word => word.trim()).filter(word => word);
                    }
                  }
                  
                  // Parse VOCAB_DEFINITIONS
                  if (row.VOCAB_DEFINITIONS) {
                    try {
                      vocabDefinitions = JSON.parse(row.VOCAB_DEFINITIONS);
                    } catch (e) {
                      // If it's not JSON, skip this row
                      console.log('Skipping row with non-JSON definitions');
                      return;
                    }
                  }
                  
                  vocabWords.forEach(word => {
                    const definition = vocabDefinitions[word.toLowerCase()];
                    if (definition) {
                      allVocabulary.push({
                        word: word,
                        definitions: definition,
                        learnedDate: row.CREATED_AT
                      });
                    }
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
