import { GoogleGenAI } from '@google/genai';

/**
 * Generate a dyslexia-friendly story for children
 * @param {Object} params - Story generation parameters
 * @param {string} params.childName - Name of the child
 * @param {string} params.age - Age of the child (5-12)
 * @param {string} params.childPronouns - Child's pronouns (he/him, she/her, they/them)
 * @param {Array<string>} params.interests - Array of child's interests
 * @param {Array<string>} params.vocabularyWords - Optional array of vocabulary challenge words
 * @returns {Promise<string>} The generated story text
 */
export async function generateStory({ 
  childName, 
  age, 
  childPronouns = '', 
  interests = [], 
  vocabularyWords = [] 
}) {
  try {
    // Get API key from environment
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('API key not found. Please set REACT_APP_GEMINI_API_KEY in your .env file');
    }

    // Initialize the Gemini AI client
    const ai = new GoogleGenAI({ apiKey });

    // Create the specialized prompt for dyslexia-friendly stories
    const vocabularySection = vocabularyWords.length > 0 
      ? `- Challenge vocabulary words to include naturally: ${vocabularyWords.join(', ')}`
      : '';

    // Use the interests array directly
    const interestsText = interests.length > 0 ? interests.join(', ') : 'general adventure';
    
    // Handle pronouns for character references
    const pronounMap = {
      'he/him': { subject: 'he', object: 'him', possessive: 'his', reflexive: 'himself' },
      'she/her': { subject: 'she', object: 'her', possessive: 'her', reflexive: 'herself' },
      'they/them': { subject: 'they', object: 'them', possessive: 'their', reflexive: 'themselves' }
    };
    const pronouns = pronounMap[childPronouns] || pronounMap['they/them'];

    const prompt = `You are a specialized children's story writer creating content for dyslexic learners aged 5-12.

**STORY REQUIREMENTS:**
- Target reader: ${childName}, age ${age}
- Pronouns: Use ${childPronouns || 'they/them'} pronouns (${pronouns.subject}/${pronouns.object}/${pronouns.possessive})
- Word count: Exactly 450-500 words
- Reading level: Age-appropriate for ${age}-year-olds
- Themes to weave naturally: ${interestsText}
${vocabularySection}

**CRITICAL FORMATTING FOR DYSLEXIA-FRIENDLY DISPLAY:**
1. Use short sentences (maximum 15 words per sentence)
2. Break content into short paragraphs (3-4 sentences maximum per paragraph)
3. Use simple, active voice
4. Avoid complex sentence structures
5. Include dialogue to break up narrative text
6. Use concrete, descriptive language

**STORY STRUCTURE:**
- **Beginning (100-120 words):** Introduce ${childName} as the protagonist in a relatable setting. Establish themes from: ${interestsText}.
- **Middle (200-250 words):** Present a gentle challenge or adventure that incorporates multiple interests naturally. Build excitement without fear or anxiety.
- **End (150-180 words):** Resolve the adventure positively, weave in remaining interests, and end with a confidence-building message.

**CONTENT GUIDELINES:**
- Make ${childName} brave, curious, and successful
- Use ${pronouns.possessive} correct pronouns throughout: ${pronouns.subject}/${pronouns.object}/${pronouns.possessive}
- Include sensory details (sounds, colors, textures)
- Use repetition of key phrases for comprehension
- Avoid idioms, sarcasm, or abstract concepts
- Keep tone warm, encouraging, and empowering
- No scary elements, conflicts, or sad themes

${vocabularyWords.length > 0 ? `**VOCABULARY INTEGRATION:**
For each challenge word (${vocabularyWords.join(', ')}):
- Use it naturally in context where meaning is clear from surrounding words
- Place it in a sentence where the story context provides meaning clues
- Use each word exactly once
- Make the usage feel natural, not forced
- Ensure ${childName} or another character uses the word successfully
- **CRITICAL: Wrap each vocabulary word with double asterisks like this: **word** so it can be highlighted for definitions**

` : ''}**OUTPUT FORMAT:**
Provide ONLY the story text with proper paragraph breaks. Do not include:
- Title or heading
- "The End" or closing phrases
- Author notes or meta-commentary
- Explanations outside the story

Begin the story directly with the narrative.`;

    // Generate content with specified configuration
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    // Extract and return the story text
    if (!result || !result.text) {
      throw new Error('No story was generated. Please try again.');
    }

    return result.text;

  } catch (error) {
    // Enhanced error handling
    if (error.message.includes('API key')) {
      throw new Error('API key error: ' + error.message);
    } else if (error.message.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      throw new Error('Failed to generate story: ' + (error.message || 'Unknown error occurred'));
    }
  }
}

/**
 * Validate story generation parameters
 * @param {Object} params - Parameters to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export function validateStoryParams({ 
  childName, 
  age, 
  childPronouns = '', 
  interests = [] 
}) {
  const errors = [];

  if (!childName || typeof childName !== 'string' || !childName.trim()) {
    errors.push("Child's name is required");
  }

  const ageNum = parseInt(age);
  if (!age || isNaN(ageNum) || ageNum < 5 || ageNum > 12) {
    errors.push('Age must be between 5 and 12');
  }

  // Check if we have any interests
  if (interests.length === 0) {
    errors.push('At least one interest is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Suggest vocabulary words appropriate for the child's age and interests
 * @param {string} age - Age of the child (5-12)
 * @param {Array<string>} interests - Array of child's interests
 * @param {Array<string>} excludeWords - Array of words to exclude from suggestions
 * @returns {Promise<Array<Object>>} Array of word objects with word, definition, and age_appropriate flag
 */
export async function suggestVocabularyWords(age, interests = [], excludeWords = []) {
  try {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('API key not found. Please set REACT_APP_GEMINI_API_KEY in your .env file');
    }

    const ai = new GoogleGenAI({ apiKey });

    const interestsText = interests.length > 0 ? interests.join(', ') : 'general learning and adventure';
    const excludeText = excludeWords.length > 0 ? `\n- DO NOT suggest any of these already used words: ${excludeWords.join(', ')}` : '';
    
    const prompt = `You are an educational vocabulary specialist. Suggest 8 age-appropriate challenge words for a ${age}-year-old child interested in: ${interestsText}.

**REQUIREMENTS:**
- Words must be slightly above their current reading level (challenging but achievable)
- Words should relate to their interests when possible
- Include a mix of: adjectives, verbs, and nouns
- Avoid words that are too complex or abstract for age ${age}${excludeText}

**OUTPUT FORMAT (JSON only, no other text):**
[
  {
    "word": "magnificent",
    "pronunciation": "mag-NIF-ih-sent",
    "simple_definition": "extremely beautiful or impressive",
    "age_appropriate": true
  },
  {
    "word": "explore",
    "pronunciation": "ik-SPLOR",
    "simple_definition": "to travel and discover new places",
    "age_appropriate": true
  }
]

Provide exactly 8 words in valid JSON format.`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    if (!result || !result.text) {
      throw new Error('No word suggestions were generated.');
    }

    // Parse the JSON response
    let responseText = result.text.trim();
    
    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const words = JSON.parse(responseText);

    // Validate the response
    if (!Array.isArray(words) || words.length === 0) {
      throw new Error('Invalid word suggestions format');
    }

    return words.slice(0, 8); // Ensure we only return 8 words

  } catch (error) {
    console.error('Error suggesting vocabulary words:', error);
    if (error.message.includes('API key')) {
      throw new Error('API key error: ' + error.message);
    } else if (error.message.includes('JSON')) {
      throw new Error('Failed to parse word suggestions. Please try again.');
    } else {
      throw new Error('Failed to suggest vocabulary words: ' + (error.message || 'Unknown error occurred'));
    }
  }
}

/**
 * Get detailed definition for a vocabulary word
 * @param {string} word - The word to define
 * @param {string} age - Age of the child (for age-appropriate definition)
 * @returns {Promise<Object>} Definition object with pronunciation, definition, example, and synonyms
 */
export async function getWordDefinition(word, age) {
  try {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('API key not found. Please set REACT_APP_GEMINI_API_KEY in your .env file');
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Provide a child-friendly definition for the word "${word}" suitable for a ${age}-year-old.

**REQUIREMENTS:**
- Pronunciation should be in simple phonetic spelling for kids (like "mag-NIF-ih-sent")
- Definition should be simple and age-appropriate
- Example sentence should use the word naturally
- Provide 2-3 relevant synonyms

**OUTPUT FORMAT (JSON only, no other text):**
{
  "word": "${word}",
  "pronunciation": "mag-NIF-ih-sent",
  "simple_definition": "extremely beautiful or impressive",
  "example_sentence": "The sunset over the ocean was magnificent.",
  "synonyms": ["amazing", "wonderful"]
}

Provide valid JSON only.`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 200,
      },
    });

    if (!result || !result.text) {
      throw new Error('No definition was generated.');
    }

    // Parse the JSON response
    let responseText = result.text.trim();
    
    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const definition = JSON.parse(responseText);

    return definition;

  } catch (error) {
    console.error(`Error getting definition for "${word}":`, error);
    // Return a fallback definition object
    return {
      word: word,
      pronunciation: '',
      simple_definition: word,
      example_sentence: '',
      synonyms: []
    };
  }
}

/**
 * Generate a story title based on the story content
 * @param {string} storyText - The story text to generate a title for
 * @returns {Promise<string>} A story title (max 3 words)
 */
export async function generateStoryTitle(storyText) {
  try {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('API key not found. Please set REACT_APP_GEMINI_API_KEY in your .env file');
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Generate a short, engaging title for this children's story. The title should be:
- Maximum 3 words
- Child-friendly and exciting
- Capture the main theme or adventure
- Be simple and memorable

Story text:
${storyText}

Provide ONLY the title, no quotes, no explanations, no additional text.`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 50,
      },
    });

    if (!result || !result.text) {
      throw new Error('No title was generated.');
    }

    // Clean up the response - remove quotes and extra whitespace
    let title = result.text.trim();
    title = title.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
    title = title.replace(/\n/g, ' ').trim(); // Remove newlines
    
    // Ensure it's max 3 words
    const words = title.split(' ').slice(0, 3);
    return words.join(' ');

  } catch (error) {
    console.error('Error generating story title:', error);
    // Return a fallback title
    return 'Adventure Story';
  }
}

/**
 * Get batch vocabulary definitions in a single API call
 * @param {Array<string>} words - Array of words to define
 * @param {string} age - Age of the child (for age-appropriate definitions)
 * @returns {Promise<Object>} Object with word keys and definition values
 */
export async function getBatchWordDefinitions(words, age) {
  try {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('API key not found. Please set REACT_APP_GEMINI_API_KEY in your .env file');
    }

    const ai = new GoogleGenAI({ apiKey });
    const wordsList = words.join('", "');

    const prompt = `Provide child-friendly definitions for these words suitable for a ${age}-year-old: "${wordsList}"

**REQUIREMENTS:**
- Each word must have its own separate definition object
- Pronunciation should be in simple phonetic spelling for kids (like "mag-NIF-ih-sent")
- Definitions should be simple and age-appropriate
- Example sentences should use the word naturally
- Provide 2-3 relevant synonyms

**OUTPUT FORMAT (JSON only, no other text):**
{
  "definitions": [
    {
      "word": "word1",
      "pronunciation": "WURD",
      "simple_definition": "easy definition for a ${age}-year-old",
      "example_sentence": "example sentence using the word",
      "synonyms": ["synonym1", "synonym2"]
    },
    {
      "word": "word2", 
      "pronunciation": "WURD",
      "simple_definition": "easy definition for a ${age}-year-old",
      "example_sentence": "example sentence using the word",
      "synonyms": ["synonym1", "synonym2"]
    }
  ]
}

Provide ONLY valid JSON. No explanations, no markdown, no extra text.`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 800,
      },
    });

    if (!result || !result.text) {
      throw new Error('No batch definitions were generated.');
    }

    // Parse the JSON response
    let responseText = result.text.trim();
    
    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    console.log('Raw response from Gemini:', responseText);
    
    let batchResult;
    try {
      batchResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text that failed to parse:', responseText);
      throw new Error('Failed to parse vocabulary definitions JSON. Please try again.');
    }

    // Convert to the format expected by the app
    const definitionsMap = {};
    if (batchResult.definitions && Array.isArray(batchResult.definitions)) {
      batchResult.definitions.forEach(def => {
        if (def && def.word) {
          // Clean and validate each definition
          const cleanDef = {
            word: def.word,
            pronunciation: def.pronunciation || '',
            simple_definition: def.simple_definition || def.word,
            example_sentence: def.example_sentence || '',
            synonyms: Array.isArray(def.synonyms) ? def.synonyms : []
          };
          
          console.log('Processed definition:', cleanDef);
          definitionsMap[def.word.toLowerCase()] = cleanDef;
        }
      });
    }

    return definitionsMap;

  } catch (error) {
    console.error(`Error getting batch definitions for words:`, error);
    // Return fallback definitions
    const fallbackDefinitions = {};
    words.forEach(word => {
      fallbackDefinitions[word.toLowerCase()] = {
        word: word,
        pronunciation: '',
        simple_definition: word,
        example_sentence: '',
        synonyms: []
      };
    });
    return fallbackDefinitions;
  }
}

