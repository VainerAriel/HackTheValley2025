import { GoogleGenAI } from '@google/genai';

/**
 * Generate a dyslexia-friendly story for children
 * @param {Object} params - Story generation parameters
 * @param {string} params.childName - Name of the child
 * @param {string} params.age - Age of the child (5-12)
 * @param {string} params.interest1 - First interest
 * @param {string} params.interest2 - Second interest
 * @param {string} params.interest3 - Third interest
 * @param {Array<string>} params.vocabularyWords - Optional array of vocabulary challenge words
 * @returns {Promise<string>} The generated story text
 */
export async function generateStory({ childName, age, interest1, interest2, interest3, vocabularyWords = [] }) {
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

    const prompt = `You are a specialized children's story writer creating content for dyslexic learners aged 5-12.

**STORY REQUIREMENTS:**
- Target reader: ${childName}, age ${age}
- Word count: Exactly 450-500 words
- Reading level: Age-appropriate for ${age}-year-olds
- Themes to weave naturally: ${interest1}, ${interest2}, ${interest3}
${vocabularySection}

**CRITICAL FORMATTING FOR DYSLEXIA-FRIENDLY DISPLAY:**
1. Use short sentences (maximum 15 words per sentence)
2. Break content into short paragraphs (3-4 sentences maximum per paragraph)
3. Use simple, active voice
4. Avoid complex sentence structures
5. Include dialogue to break up narrative text
6. Use concrete, descriptive language

**STORY STRUCTURE:**
- **Beginning (100-120 words):** Introduce ${childName} as the protagonist in a relatable setting. Establish the first theme (${interest1}).
- **Middle (200-250 words):** Present a gentle challenge or adventure that incorporates the second theme (${interest2}). Build excitement without fear or anxiety.
- **End (150-180 words):** Resolve the adventure positively, weave in the third theme (${interest3}), and end with a confidence-building message.

**CONTENT GUIDELINES:**
- Make ${childName} brave, curious, and successful
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
export function validateStoryParams({ childName, age, interest1, interest2, interest3 }) {
  const errors = [];

  if (!childName || typeof childName !== 'string' || !childName.trim()) {
    errors.push("Child's name is required");
  }

  const ageNum = parseInt(age);
  if (!age || isNaN(ageNum) || ageNum < 5 || ageNum > 12) {
    errors.push('Age must be between 5 and 12');
  }

  if (!interest1 || typeof interest1 !== 'string' || !interest1.trim()) {
    errors.push('Interest 1 is required');
  }

  if (!interest2 || typeof interest2 !== 'string' || !interest2.trim()) {
    errors.push('Interest 2 is required');
  }

  if (!interest3 || typeof interest3 !== 'string' || !interest3.trim()) {
    errors.push('Interest 3 is required');
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
 * @returns {Promise<Array<Object>>} Array of word objects with word, definition, and age_appropriate flag
 */
export async function suggestVocabularyWords(age, interests) {
  try {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('API key not found. Please set REACT_APP_GEMINI_API_KEY in your .env file');
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an educational vocabulary specialist. Suggest 8 age-appropriate challenge words for a ${age}-year-old child interested in: ${interests.join(', ')}.

**REQUIREMENTS:**
- Words must be slightly above their current reading level (challenging but achievable)
- Words should relate to their interests when possible
- Include a mix of: adjectives, verbs, and nouns
- Avoid words that are too complex or abstract for age ${age}

**OUTPUT FORMAT (JSON only, no other text):**
[
  {
    "word": "magnificent",
    "simple_definition": "extremely beautiful or impressive",
    "age_appropriate": true
  },
  {
    "word": "explore",
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

**OUTPUT FORMAT (JSON only, no other text):**
{
  "definitions": [
    {
      "word": "word1",
      "pronunciation": "phonetic pronunciation",
      "simple_definition": "easy definition for a ${age}-year-old",
      "example_sentence": "example sentence using the word",
      "synonyms": ["synonym1", "synonym2"]
    },
    {
      "word": "word2", 
      "pronunciation": "phonetic pronunciation",
      "simple_definition": "easy definition for a ${age}-year-old",
      "example_sentence": "example sentence using the word",
      "synonyms": ["synonym1", "synonym2"]
    }
  ]
}

Provide valid JSON only.`;

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
    
    const batchResult = JSON.parse(responseText);

    // Convert to the format expected by the app
    const definitionsMap = {};
    if (batchResult.definitions && Array.isArray(batchResult.definitions)) {
      batchResult.definitions.forEach(def => {
        if (def && def.word) {
          definitionsMap[def.word.toLowerCase()] = def;
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

