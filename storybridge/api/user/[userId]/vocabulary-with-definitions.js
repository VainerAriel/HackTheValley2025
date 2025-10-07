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

      // Get vocabulary from user_vocabulary table and try to find definitions from any story
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
                  
                  // Use the actual definition if it exists in the linked story
                  if (vocabDefinitions[row.WORD]) {
                    definitions = vocabDefinitions[row.WORD];
                  } else {
                    // If no definition in linked story, try to find it in any other story
                    // This will be handled by a separate query if needed
                    console.log('No definition found for word:', row.WORD, 'in story:', row.STORY_ID);
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
              
              // For words without definitions, try to find them in other stories
              const wordsWithoutDefinitions = allVocabulary.filter(item => 
                item.definitions.definition === 'A vocabulary word from your stories'
              );
              
              if (wordsWithoutDefinitions.length > 0) {
                console.log('🔍 Searching for definitions for', wordsWithoutDefinitions.length, 'words without definitions');
                
                // Get all stories with definitions for this user
                const definitionsQuery = `
                  SELECT VOCAB_WORDS, VOCAB_DEFINITIONS, STORY_ID
                  FROM STORIES 
                  WHERE USER_ID = ? 
                  AND VOCAB_DEFINITIONS IS NOT NULL
                `;
                
                const definitionRows = await new Promise((resolveDefs, rejectDefs) => {
                  connection.execute({
                    sqlText: definitionsQuery,
                    binds: [userId],
                    complete: (err, stmt, defRows) => {
                      if (err) {
                        console.error('Error fetching definitions:', err);
                        rejectDefs(err);
                      } else {
                        resolveDefs(defRows);
                      }
                    }
                  });
                });
                
                // Try to find definitions for words without them
                wordsWithoutDefinitions.forEach(vocabItem => {
                  for (const defRow of definitionRows) {
                    try {
                      let vocabWords = [];
                      if (defRow.VOCAB_WORDS) {
                        try {
                          vocabWords = JSON.parse(defRow.VOCAB_WORDS);
                        } catch (e) {
                          vocabWords = defRow.VOCAB_WORDS.split(',').map(word => word.trim()).filter(word => word);
                        }
                      }
                      
                      if (vocabWords.includes(vocabItem.word)) {
                        let vocabDefinitions = {};
                        if (defRow.VOCAB_DEFINITIONS) {
                          try {
                            vocabDefinitions = JSON.parse(defRow.VOCAB_DEFINITIONS);
                            if (vocabDefinitions[vocabItem.word]) {
                              vocabItem.definitions = vocabDefinitions[vocabItem.word];
                              console.log('✅ Found definition for:', vocabItem.word);
                              break;
                            }
                          } catch (e) {
                            console.log('Could not parse definitions for story');
                          }
                        }
                      }
                    } catch (e) {
                      console.error('Error processing definition row:', e);
                    }
                  }
                });
              }

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
